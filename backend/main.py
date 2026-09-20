import os
import re
import uuid
import io
import asyncio
import logging
from pathlib import Path
from typing import Any, cast

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
import fitz
from PIL import Image
import pytesseract
from qdrant_client import QdrantClient, models
from docx import Document as DocxDocument
from huggingface_hub import InferenceClient
import psycopg
from psycopg.rows import dict_row
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

COLLECTION = os.getenv("QDRANT_COLLECTION", "knowledge_chunks")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
LANGCHAIN_HF_GENERATION_MODEL = os.getenv("LANGCHAIN_HF_GENERATION_MODEL", "HuggingFaceTB/SmolLM2-360M-Instruct")
LANGCHAIN_HF_GENERATION_DEVICE = int(os.getenv("LANGCHAIN_HF_GENERATION_DEVICE", "-1"))
LANGCHAIN_HF_MAX_NEW_TOKENS = int(os.getenv("LANGCHAIN_HF_MAX_NEW_TOKENS", "256"))
HUGGINGFACEHUB_API_TOKEN = os.getenv("HUGGINGFACEHUB_API_TOKEN", os.getenv("HF_TOKEN", ""))
if HUGGINGFACEHUB_API_TOKEN and not os.getenv("HF_TOKEN"):
    os.environ["HF_TOKEN"] = HUGGINGFACEHUB_API_TOKEN
LANGCHAIN_EMBEDDING_MODEL = os.getenv("LANGCHAIN_EMBEDDING_MODEL", os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
LANGCHAIN_EMBEDDING_DEVICE = os.getenv("LANGCHAIN_EMBEDDING_DEVICE", "cpu")
LANGCHAIN_EMBEDDING_NORMALIZE = os.getenv("LANGCHAIN_EMBEDDING_NORMALIZE", "true").lower() == "true"
LANGCHAIN_EMBEDDING_BATCH_SIZE = int(os.getenv("LANGCHAIN_EMBEDDING_BATCH_SIZE", "32"))
LANGCHAIN_EMBEDDING_CACHE = os.getenv("LANGCHAIN_EMBEDDING_CACHE", os.getenv("HF_HOME", "/models/huggingface"))
LANGCHAIN_EMBEDDING_SHOW_PROGRESS = os.getenv("LANGCHAIN_EMBEDDING_SHOW_PROGRESS", "false").lower() == "true"
OCR_MIN_TEXT_CHARACTERS = int(os.getenv("OCR_MIN_TEXT_CHARACTERS", "40"))
OCR_LANGUAGE = os.getenv("OCR_LANGUAGE", "eng")
MAX_UPLOAD_SIZE_BYTES = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(50 * 1024 * 1024)))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nexus:nexus@postgres:5432/nexus")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
logger = logging.getLogger("nexus.rag")

app = FastAPI(title="Nexus RAG API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embedder = None
generator = None
GENERATION_BACKEND = "huggingface-api" if HUGGINGFACEHUB_API_TOKEN else "huggingface-local"
qdrant = QdrantClient(url=QDRANT_URL)


class HuggingFaceApiEmbeddings:
    def __init__(self) -> None:
        self.client = InferenceClient(token=HUGGINGFACEHUB_API_TOKEN)

    def embed_query(self, text: str) -> list[float]:
        return self.client.feature_extraction(
            text,
            model=LANGCHAIN_EMBEDDING_MODEL,
            normalize=LANGCHAIN_EMBEDDING_NORMALIZE,
        ).tolist()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self.embed_query(text) for text in texts]


class HuggingFaceApiGenerator:
    def __init__(self) -> None:
        self.client = InferenceClient(token=HUGGINGFACEHUB_API_TOKEN)

    def invoke(self, prompt: str) -> str:
        response = self.client.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            model=LANGCHAIN_HF_GENERATION_MODEL,
            max_tokens=LANGCHAIN_HF_MAX_NEW_TOKENS,
            temperature=0.0,
        )
        return str(response.choices[0].message.content)


def get_embedder() -> Any:
    global embedder
    if embedder is None:
        if HUGGINGFACEHUB_API_TOKEN:
            embedder = HuggingFaceApiEmbeddings()
        else:
            raise RuntimeError("HUGGINGFACEHUB_API_TOKEN is required for embeddings.")
    return embedder


def get_generator() -> Any:
    global generator
    if generator is not None:
        return generator
    if HUGGINGFACEHUB_API_TOKEN:
        generator = HuggingFaceApiGenerator()
    else:
        raise RuntimeError("HUGGINGFACEHUB_API_TOKEN is required for generation.")
    return generator


def ensure_database() -> None:
    with psycopg.connect(DATABASE_URL) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id UUID PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                size BIGINT NOT NULL,
                uploaded_at TIMESTAMPTZ NOT NULL,
                status TEXT NOT NULL,
                chunks INTEGER NOT NULL DEFAULT 0,
                tokens INTEGER NOT NULL DEFAULT 0,
                tags TEXT[] NOT NULL DEFAULT '{}'
            )
            """
        )
        connection.execute("UPDATE documents SET status = 'error' WHERE status = 'indexed' AND chunks = 0")


def document_from_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "type": row["type"],
        "size": row["size"],
        "uploadedAt": row["uploaded_at"].isoformat(),
        "status": row["status"],
        "chunks": row["chunks"],
        "tokens": row["tokens"],
        "tags": row["tags"],
    }


def ensure_collection() -> None:
    embedding_model = get_embedder()
    try:
        qdrant.get_collection(COLLECTION)
    except Exception:
        qdrant.create_collection(
            collection_name=COLLECTION,
            vectors_config=models.VectorParams(
                size=len(embedding_model.embed_query("dimension probe")),
                distance=models.Distance.COSINE,
            ),
        )


def extract_pages(filename: str, content: bytes) -> list[dict[str, Any]]:
    suffix = Path(filename).suffix.lower()
    if suffix == ".pdf":
        pages = []
        pdf_document = None
        try:
            pdf_document = fitz.open(stream=content, filetype="pdf")
            try:
                extracted_pages = PdfReader(io.BytesIO(content)).pages
            except Exception:
                logger.exception("Selectable PDF extraction failed for filename=%s; using OCR", filename)
                extracted_pages = [None] * len(pdf_document)
            for page_number, page in enumerate(extracted_pages, start=1):
                text = (page.extract_text() or "").strip() if page is not None else ""
                extraction = "text"
                if len(text) < OCR_MIN_TEXT_CHARACTERS:
                    try:
                        rendered_page: Any = pdf_document[page_number - 1]
                        rendered = rendered_page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
                        image = Image.frombytes("RGB", (rendered.width, rendered.height), rendered.samples)
                        ocr_text = pytesseract.image_to_string(image, lang=OCR_LANGUAGE).strip()
                        if len(ocr_text) > len(text):
                            text = ocr_text
                            extraction = "ocr"
                    except Exception:
                        logger.exception("OCR failed for filename=%s page=%d", filename, page_number)
                pages.append({"page": page_number, "text": text, "extraction": extraction})
        finally:
            if pdf_document is not None:
                pdf_document.close()
        return pages
    if suffix == ".docx":
        return [{"page": 1, "text": "\n".join(p.text for p in DocxDocument(io.BytesIO(content)).paragraphs), "extraction": "text"}]
    return [{"page": 1, "text": content.decode("utf-8", errors="ignore"), "extraction": "text"}]


def chunk_text(text: str, size: int = 900, overlap: int = 120) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    return [normalized[i : i + size] for i in range(0, len(normalized), size - overlap) if normalized[i : i + size].strip()]


def chunk_pages(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    chunks = []
    for page in pages:
        for text in chunk_text(page["text"]):
            chunks.append({"page": page["page"], "text": text, "extraction": page["extraction"]})
    return chunks


def search(query: str, limit: int = 5, document_ids: list[str] | None = None) -> list[dict[str, Any]]:
    ensure_collection()
    vector = get_embedder().embed_query(query)
    result = qdrant.query_points(
        collection_name=COLLECTION,
        query=vector,
        limit=limit,
        with_payload=True,
    ).points
    hits = []
    for item in result:
        payload = item.payload or {}
        if document_ids and payload.get("doc_id") not in document_ids:
            continue
        hits.append({**payload, "score": round(float(item.score), 3)})
    return hits


def fallback_answer(query: str, hits: list[dict[str, Any]]) -> str:
    if not hits:
        return "I could not find relevant evidence in the indexed knowledge base. Try uploading a document or asking about a more specific topic."
    evidence = " ".join(hit["text"] for hit in hits[:3])
    return f"Based on the indexed documents, the strongest evidence for {query!r} is:\n\n{evidence}\n\nThis answer is extractive because Hugging Face generation is unavailable. Check the Hugging Face API token or local model configuration to enable generative answers grounded in the same citations."


async def generate_answer(query: str, hits: list[dict[str, Any]]) -> str:
    context = "\n\n".join(f"[{i + 1}] {hit['text']}" for i, hit in enumerate(hits))
    prompt = (
        "Answer the question using only the supplied context. Be concise, say when the context is insufficient, "
        "and cite evidence inline as [1], [2].\n\n"
        f"Context:\n{context}\n\nQuestion: {query}"
    )
    try:
        response = await asyncio.to_thread(get_generator().invoke, prompt)
        return str(response).strip() or fallback_answer(query, hits)
    except Exception:
        logger.exception("Hugging Face generation failed; using extractive fallback")
        return fallback_answer(query, hits)


@app.on_event("startup")
def startup() -> None:
    ensure_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "retrieval": "qdrant", "generation": f"{GENERATION_BACKEND}-with-extractive-fallback", "google_auth": "configured" if GOOGLE_CLIENT_ID else "not-configured"}


@app.post("/api/auth/google")
def google_auth(payload: dict[str, Any]) -> dict[str, Any]:
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured on the server.")
    credential = str(payload.get("credential", ""))
    if not credential:
        raise HTTPException(status_code=400, detail="Missing Google credential.")
    try:
        claims = id_token.verify_oauth2_token(credential, google_requests.Request(), GOOGLE_CLIENT_ID)
    except ValueError as error:
        raise HTTPException(status_code=401, detail="Invalid Google credential.") from error
    return {
        "id": claims["sub"],
        "email": claims["email"],
        "name": claims.get("name") or claims["email"].split("@")[0],
        "role": "user",
    }


@app.get("/api/documents")
def list_documents() -> list[dict[str, Any]]:
    with psycopg.connect(DATABASE_URL, row_factory=cast(Any, dict_row)) as connection:
        rows = connection.execute("SELECT id, name, type, size, uploaded_at, status, chunks, tokens, tags FROM documents ORDER BY uploaded_at DESC").fetchall()
    return [document_from_row(cast(dict[str, Any], row)) for row in rows]


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: str) -> dict[str, str]:
    # Delete vectors from Qdrant
    try:
        qdrant.delete(collection_name=COLLECTION, points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[models.FieldCondition(key="doc_id", match=models.MatchValue(value=doc_id))]
            )
        ))
    except Exception:
        logger.warning("Failed to delete vectors for doc_id=%s (may not exist)", doc_id)
    # Delete from database
    with psycopg.connect(DATABASE_URL) as connection:
        result = connection.execute("DELETE FROM documents WHERE id = %s", (doc_id,))
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Document not found.")
    return {"status": "deleted"}


@app.get("/api/stats")
def get_stats() -> dict[str, Any]:
    with psycopg.connect(DATABASE_URL, row_factory=cast(Any, dict_row)) as connection:
        row = connection.execute(
            """
            SELECT
                COUNT(*)::int AS total_documents,
                COALESCE(SUM(chunks), 0)::int AS total_chunks,
                COALESCE(SUM(tokens), 0)::int AS total_tokens,
                COUNT(*) FILTER (WHERE status = 'indexed')::int AS indexed_documents,
                COUNT(*) FILTER (WHERE status = 'processing')::int AS processing_documents,
                COUNT(*) FILTER (WHERE status = 'error')::int AS error_documents,
                COUNT(*) FILTER (WHERE uploaded_at >= NOW() - INTERVAL '7 days')::int AS documents_this_week,
                COALESCE(SUM(chunks) FILTER (WHERE uploaded_at >= NOW() - INTERVAL '7 days'), 0)::int AS chunks_this_week
            FROM documents
            """
        ).fetchone()
        # Top documents by chunk count
        top_rows = connection.execute(
            "SELECT name, chunks, tokens FROM documents WHERE status = 'indexed' ORDER BY chunks DESC LIMIT 5"
        ).fetchall()
    r = cast(dict[str, Any], row)
    return {
        "totalDocuments": r["total_documents"],
        "totalChunks": r["total_chunks"],
        "totalTokens": r["total_tokens"],
        "indexedDocuments": r["indexed_documents"],
        "processingDocuments": r["processing_documents"],
        "errorDocuments": r["error_documents"],
        "documentsThisWeek": r["documents_this_week"],
        "chunksThisWeek": r["chunks_this_week"],
        "topDocuments": [
            {"name": t["name"], "chunks": t["chunks"], "tokens": t["tokens"]}
            for t in top_rows
        ],
    }


@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)) -> dict[str, Any]:
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE_BYTES:
        max_size_mb = MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(status_code=413, detail=f"File exceeds the {max_size_mb:g} MB upload limit.")

    doc_id = str(uuid.uuid4())
    name = file.filename or "document.txt"
    doc_type = Path(name).suffix.lstrip(".") or "txt"

    # Quick parse to validate the file has extractable text before inserting
    pages = extract_pages(name, content)
    chunks = chunk_pages(pages)
    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="No extractable text was found. Upload a text-based PDF, DOCX, TXT, or Markdown file.",
        )

    # Insert document with 'processing' status and return immediately
    document = {
        "id": doc_id, "name": name, "type": doc_type, "size": len(content),
        "status": "processing", "chunks": 0, "tokens": 0, "tags": [],
    }
    with psycopg.connect(DATABASE_URL) as connection:
        connection.execute(
            "INSERT INTO documents (id, name, type, size, uploaded_at, status, chunks, tokens, tags) VALUES (%s, %s, %s, %s, NOW(), %s, %s, %s, %s)",
            (doc_id, name, doc_type, len(content), "processing", 0, 0, []),
        )

    # Schedule heavy processing (embedding + vector upsert) in background
    asyncio.create_task(_process_document(doc_id, name, content, pages, chunks))

    return document


async def _process_document(doc_id: str, name: str, content: bytes, pages: list, chunks: list) -> None:
    """Background task: embed chunks, upsert to Qdrant, update DB status."""
    try:
        text = "\n".join(page["text"] for page in pages)
        ocr_pages = sum(page["extraction"] == "ocr" for page in pages)
        logger.info("Processing upload filename=%s bytes=%d pages=%d chunks=%d ocr_pages=%d", name, len(content), len(pages), len(chunks), ocr_pages)

        ensure_collection()
        vectors = await asyncio.to_thread(
            get_embedder().embed_documents,
            [chunk["text"] for chunk in chunks],
        )
        logger.info("Embedded upload filename=%s vectors=%d", name, len(vectors))

        points = [
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    "doc_id": doc_id, "doc_name": name, "text": chunk["text"],
                    "chunk": index + 1, "page": chunk["page"], "extraction": chunk["extraction"],
                },
            )
            for index, (chunk, vector) in enumerate(zip(chunks, vectors))
        ]
        if points:
            qdrant.upsert(collection_name=COLLECTION, points=points)

        with psycopg.connect(DATABASE_URL) as connection:
            connection.execute(
                "UPDATE documents SET status = 'indexed', chunks = %s, tokens = %s WHERE id = %s",
                (len(chunks), len(text.split()), doc_id),
            )
        logger.info("Indexed upload filename=%s doc_id=%s chunks=%d", name, doc_id, len(chunks))

    except Exception:
        logger.exception("Background processing failed for filename=%s doc_id=%s", name, doc_id)
        try:
            with psycopg.connect(DATABASE_URL) as connection:
                connection.execute(
                    "UPDATE documents SET status = 'error' WHERE id = %s",
                    (doc_id,),
                )
        except Exception:
            logger.exception("Failed to mark document as error: doc_id=%s", doc_id)


@app.post("/api/chat")
async def chat(payload: dict[str, Any]) -> dict[str, Any]:
    query = str(payload.get("query", "")).strip()

    if not query:
        return {
            "answer": "Ask a question about your indexed documents.",
            "citations": []
        }

    document_ids = payload.get("document_ids")

    print("\n========== CHAT ==========")
    print("Query:", query)
    print("Document IDs:", document_ids)

    try:
        # 1. Search the knowledge base
        hits = search(
            query,
            document_ids=document_ids
        )

        print("Initial hits:", len(hits))

        # 2. If filtering by document IDs produced nothing,
        # search the complete knowledge base
        if not hits and document_ids:
            print("No filtered results. Searching all documents...")
            hits = search(query)

        print("Final hits:", len(hits))

        # 3. Show retrieved context
        for i, hit in enumerate(hits[:5]):
            print(f"\n--- HIT {i + 1} ---")
            print("Document:", hit.get("doc_name"))
            print("Doc ID:", hit.get("doc_id"))
            print("Page:", hit.get("page"))
            print("Score:", hit.get("score"))
            print("Text:", hit.get("text", "")[:500])

        # 4. Generate answer
        answer = await generate_answer(
            query,
            hits
        )

        print("\nGenerated answer:", answer)
        print("==========================\n")

        # 5. Citations
        citations = []

        for hit in hits:
            citations.append({
                "docId": hit.get("doc_id"),
                "docName": hit.get("doc_name"),
                "page": hit.get("page", hit.get("chunk")),
                "chunk": hit.get("text", ""),
                "score": hit.get("score", 0)
            })

        return {
            "answer": answer,
            "citations": citations
        }

    except Exception as e:
        print("CHAT ERROR:", repr(e))

        return {
            "answer": "An error occurred while processing your question.",
            "citations": [],
            "error": str(e)
        }