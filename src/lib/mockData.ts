import type { Document, ChatSession, DashboardStats } from './types';

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'd1',
    name: 'LangChain Architecture Guide.pdf',
    type: 'pdf',
    size: 2847000,
    uploadedAt: '2026-09-18T10:23:00Z',
    status: 'indexed',
    chunks: 142,
    tokens: 84320,
    summary: 'Comprehensive guide to LangChain framework architecture, including chains, agents, memory, and retrieval patterns.',
    tags: ['langchain', 'architecture', 'ai'],
  },
  {
    id: 'd2',
    name: 'Vector Database Comparison.docx',
    type: 'docx',
    size: 1240000,
    uploadedAt: '2026-09-17T14:05:00Z',
    status: 'indexed',
    chunks: 78,
    tokens: 46100,
    summary: 'Analysis of leading vector databases: Qdrant, Pinecone, Weaviate, Chroma — benchmarks, pricing, and use cases.',
    tags: ['vector-db', 'qdrant', 'comparison'],
  },
  {
    id: 'd3',
    name: 'RAG Pipeline Best Practices.md',
    type: 'md',
    size: 580000,
    uploadedAt: '2026-09-16T09:15:00Z',
    status: 'indexed',
    chunks: 41,
    tokens: 24500,
    summary: 'Production best practices for Retrieval-Augmented Generation pipelines covering chunking, embedding, and reranking.',
    tags: ['rag', 'best-practices', 'embeddings'],
  },
  {
    id: 'd4',
    name: 'FastAPI Security Hardening.pdf',
    type: 'pdf',
    size: 3100000,
    uploadedAt: '2026-09-15T16:40:00Z',
    status: 'indexed',
    chunks: 186,
    tokens: 102400,
    summary: 'Security hardening guide for FastAPI applications — JWT, OAuth2, rate limiting, CORS, and SQL injection prevention.',
    tags: ['fastapi', 'security', 'jwt'],
  },
  {
    id: 'd5',
    name: 'Hugging Face Transformers.txt',
    type: 'txt',
    size: 420000,
    uploadedAt: '2026-09-14T11:30:00Z',
    status: 'processing',
    chunks: 0,
    tokens: 0,
    tags: ['huggingface', 'transformers', 'nlp'],
  },
];

export const MOCK_SESSIONS: ChatSession[] = [
  {
    id: 's1',
    title: 'RAG pipeline optimization',
    messages: [],
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-09-18T11:30:00Z',
    documentIds: ['d1', 'd3'],
  },
  {
    id: 's2',
    title: 'Vector DB selection guide',
    messages: [],
    createdAt: '2026-09-17T14:00:00Z',
    updatedAt: '2026-09-17T15:45:00Z',
    documentIds: ['d2'],
  },
  {
    id: 's3',
    title: 'FastAPI JWT implementation',
    messages: [],
    createdAt: '2026-09-16T09:00:00Z',
    updatedAt: '2026-09-16T10:20:00Z',
    documentIds: ['d4'],
  },
];

export const MOCK_STATS: DashboardStats = {
  totalDocuments: 5,
  totalChats: 23,
  totalQueries: 187,
  avgResponseTime: 1.4,
  documentsThisWeek: 3,
  queriesThisWeek: 64,
  topDocuments: [
    { name: 'LangChain Architecture Guide', queries: 48 },
    { name: 'RAG Pipeline Best Practices', queries: 37 },
    { name: 'FastAPI Security Hardening', queries: 29 },
    { name: 'Vector Database Comparison', queries: 21 },
  ],
  queryVolume: [
    { date: 'Sep 13', count: 12 },
    { date: 'Sep 14', count: 19 },
    { date: 'Sep 15', count: 28 },
    { date: 'Sep 16', count: 22 },
    { date: 'Sep 17', count: 31 },
    { date: 'Sep 18', count: 41 },
    { date: 'Sep 19', count: 34 },
  ],
};

export const RAG_RESPONSES: { query: string; answer: string; citations: { docId: string; docName: string; page: number; chunk: string; score: number }[] }[] = [
  {
    query: 'what is',
    answer: `RAG (Retrieval-Augmented Generation) combines the strengths of retrieval-based and generative approaches. Instead of relying solely on parametric memory stored in model weights, RAG dynamically fetches relevant context from a vector store at inference time.

**Key components of a RAG pipeline:**

1. **Document ingestion** — PDFs, docs, and text are chunked into ~512-token segments with overlap to preserve context boundaries.
2. **Embedding** — Each chunk is encoded into a dense vector using a model like \`sentence-transformers/all-MiniLM-L6-v2\` or OpenAI's \`text-embedding-3-small\`.
3. **Retrieval** — At query time, the user's question is embedded and cosine similarity is computed against the indexed chunks. The top-k results are returned.
4. **Generation** — Retrieved chunks are injected into the LLM prompt as context, grounding the response in factual source material.

This approach dramatically reduces hallucination and enables the model to cite specific passages from your knowledge base.`,
    citations: [
      { docId: 'd3', docName: 'RAG Pipeline Best Practices.md', page: 1, chunk: 'RAG combines parametric memory with non-parametric retrieval, fetching relevant document chunks to ground LLM responses in factual sources.', score: 0.94 },
      { docId: 'd1', docName: 'LangChain Architecture Guide.pdf', page: 23, chunk: 'LangChain\'s RetrievalQA chain wraps a retriever and an LLM, injecting retrieved documents into a prompt template before generation.', score: 0.87 },
    ],
  },
  {
    query: 'vector',
    answer: `Qdrant is optimized for high-throughput production workloads with on-disk indexing support, making it excellent for large corpora. Pinecone offers a fully managed SaaS option with minimal operational overhead. Weaviate adds a GraphQL interface and built-in module ecosystem.

**Performance benchmarks (1M vectors, 768-dim):**

| Database | QPS | P99 Latency | Storage |
|----------|-----|-------------|---------|
| Qdrant   | 4,200 | 12ms | 3.2 GB |
| Pinecone | 3,800 | 18ms | Managed |
| Weaviate | 2,900 | 24ms | 4.1 GB |
| Chroma   | 1,200 | 45ms | 2.8 GB |

For most production RAG systems processing under 10M documents, Qdrant running on a \`c6g.2xlarge\` instance (8 vCPU, 16 GB RAM) provides the best cost/performance ratio.`,
    citations: [
      { docId: 'd2', docName: 'Vector Database Comparison.docx', page: 12, chunk: 'Qdrant achieves 4,200 QPS at P99 12ms on 1M 768-dimensional vectors on c6g.2xlarge, outperforming Pinecone by 10.5% on throughput.', score: 0.97 },
      { docId: 'd2', docName: 'Vector Database Comparison.docx', page: 8, chunk: 'For production deployments, on-disk indexing in Qdrant reduces memory requirements by 60% with only 8% throughput degradation.', score: 0.91 },
    ],
  },
  {
    query: 'jwt',
    answer: `Implementing JWT authentication in FastAPI follows a well-established pattern using python-jose for token encoding and passlib for password hashing.

\`\`\`python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "your-256-bit-secret"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({**data, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
        return await get_user(user_id)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
\`\`\`

Always rotate your SECRET_KEY in production and store it in environment variables, never in source code.`,
    citations: [
      { docId: 'd4', docName: 'FastAPI Security Hardening.pdf', page: 34, chunk: 'Use python-jose with HS256 for JWT signing. Store SECRET_KEY in environment variables and rotate every 90 days in production environments.', score: 0.96 },
      { docId: 'd4', docName: 'FastAPI Security Hardening.pdf', page: 41, chunk: 'Implement token refresh with a 7-day refresh token stored as httpOnly cookie, separate from the 30-minute access token.', score: 0.88 },
    ],
  },
];

export function getSimulatedResponse(query: string) {
  const q = query.toLowerCase();
  for (const r of RAG_RESPONSES) {
    if (q.includes(r.query)) return r;
  }
  return {
    answer: `Based on your knowledge base, I found relevant information about **"${query}"**.\n\nThe indexed documents contain ${Math.floor(Math.random() * 50) + 20} relevant passages discussing this topic. The key findings suggest that proper implementation requires careful attention to configuration, performance tuning, and security considerations documented across your uploaded materials.\n\nWould you like me to dive deeper into any specific aspect?`,
    citations: [
      { docId: 'd1', docName: 'LangChain Architecture Guide.pdf', page: Math.floor(Math.random() * 80) + 1, chunk: 'Relevant passage from the architecture guide covering the requested topic with implementation details and code examples.', score: 0.82 },
    ],
  };
}
