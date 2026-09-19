# Nexus RAG Knowledge Assistant

This project is a Dockerized retrieval-augmented generation concept app.

## Stack

- React + Vite frontend served by Nginx
- FastAPI ingestion and chat API
- LangChain Hugging Face embeddings
- Qdrant vector database
- PostgreSQL document metadata database
- Hugging Face local text-generation model with an extractive fallback

## Run with Docker

```bash
docker compose up --build
```

The app is available at `http://localhost:8080`. Upload PDF, DOCX, TXT, or Markdown files in Knowledge Base, then ask questions in AI Chat. PostgreSQL stores document metadata while Qdrant stores embeddings and retrieves the most relevant chunks as citations.

To enable Google sign-in, create a Google OAuth 2.0 Web client in Google Cloud Console and add its client ID to `.env`:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Add `http://localhost:8080` as an authorized JavaScript origin, then rebuild the web container.

For hosted Hugging Face inference, set `HUGGINGFACEHUB_API_TOKEN` in your local `.env` file. The API uses hosted inference when the token is present and falls back to the local Hugging Face pipeline otherwise. Never commit the token. For a smaller machine, set `LANGCHAIN_HF_GENERATION_MODEL` to a smaller Hugging Face text-generation model and set `LANGCHAIN_HF_GENERATION_DEVICE=-1` for CPU. When generation fails, the API returns extractive answers from retrieved chunks.

### LangChain embedding settings

The API reads LangChain Hugging Face settings from the environment. The defaults use `sentence-transformers/all-MiniLM-L6-v2` on CPU with normalized vectors and a batch size of 32. Configure `LANGCHAIN_EMBEDDING_MODEL`, `LANGCHAIN_EMBEDDING_DEVICE`, `LANGCHAIN_EMBEDDING_NORMALIZE`, `LANGCHAIN_EMBEDDING_BATCH_SIZE`, `LANGCHAIN_EMBEDDING_CACHE`, and `LANGCHAIN_EMBEDDING_SHOW_PROGRESS` in `.env` when needed. Optional LangSmith tracing is controlled by `LANGCHAIN_TRACING_V2`, `LANGCHAIN_PROJECT`, and `LANGCHAIN_API_KEY`.

Answer generation uses `LANGCHAIN_HF_GENERATION_MODEL`, `LANGCHAIN_HF_GENERATION_DEVICE`, and `LANGCHAIN_HF_MAX_NEW_TOKENS`. Set `HUGGINGFACEHUB_API_TOKEN` to use the Hugging Face API; without it, Docker persists local model downloads in the `hf_models` volume.

## Local frontend development

```bash
bun install
bun run dev
```

Set `VITE_API_URL=http://localhost:8000` in `.env` and run the API with its Python dependencies from `backend/` if you are not using the full Docker stack.

The frontend Docker build also uses Bun. The backend remains a Python FastAPI service inside Docker.
