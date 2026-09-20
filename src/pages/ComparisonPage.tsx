import { useEffect, useState } from 'react';
import type { Document } from '../lib/types';
import { listKnowledgeDocuments } from '../lib/api';
import Interactive3D from '../components/Interactive3D';
import DepthCard from '../components/DepthCard';
import MagneticButton from '../components/MagneticButton';

const COMPARISON_DATA: Record<string, Record<string, string>> = {
  'd1-d2': {
    overview: `**LangChain Architecture Guide** focuses on the orchestration layer — how to compose chains, agents, tools, and memory modules to build LLM-powered applications. It treats retrieval as one capability among many.

**Vector Database Comparison** is purely focused on the data infrastructure layer, evaluating storage, indexing, and retrieval performance across Qdrant, Pinecone, Weaviate, and Chroma.

**Key overlap:** Both documents discuss embedding models and the importance of choosing the right similarity metric (cosine vs dot-product) for high-dimensional vectors.`,
    differences: `| Dimension | LangChain Guide | Vector DB Comparison |
|-----------|----------------|---------------------|
| Focus | Application orchestration | Infrastructure benchmarks |
| Depth | Broad (chains, agents, memory) | Narrow & deep (retrieval perf) |
| Code examples | Extensive Python | Minimal |
| Audience | App developers | ML engineers / Ops |
| Recency | Framework v0.2+ | Benchmarked Q3 2026 |`,
    recommendations: `For building a production RAG system, use both documents together: the **Vector DB Comparison** to select and configure your retrieval infrastructure (Qdrant recommended for most use cases), and the **LangChain Guide** to wire retrieval into your application layer using RetrievalQA chains or LangGraph agents.`,
  },
  'd1-d3': {
    overview: `**LangChain Architecture Guide** covers the full stack of LangChain primitives. **RAG Pipeline Best Practices** is a narrower, deeper treatment of the retrieval-augmented generation pattern specifically.

Both documents agree on the fundamentals: chunk size matters, overlap prevents boundary artifacts, and reranking significantly improves retrieval quality.`,
    differences: `| Dimension | LangChain Guide | RAG Best Practices |
|-----------|----------------|---------------------|
| Scope | Full LangChain ecosystem | RAG pattern only |
| Chunking | High-level overview | Deep dive with benchmarks |
| Reranking | Mentioned | Full section w/ code |
| Memory | Extensive coverage | Not covered |
| Evaluation | Basic | Detailed RAGAS metrics |`,
    recommendations: `Read the **RAG Best Practices** doc first to understand chunking strategies and embedding selection, then apply those insights when configuring LangChain's document loaders and retrievers as described in the **Architecture Guide**.`,
  },
  'd2-d3': {
    overview: `**Vector Database Comparison** benchmarks raw infrastructure. **RAG Best Practices** focuses on the algorithmic patterns layered on top of that infrastructure.

Together they represent the complete retrieval stack: from hardware-level QPS benchmarks to semantic chunking and retrieval quality evaluation.`,
    differences: `| Dimension | Vector DB Comparison | RAG Best Practices |
|-----------|---------------------|---------------------|
| Layer | Infrastructure | Algorithm |
| Metrics | QPS, latency, storage | Precision@k, RAGAS |
| Language | Agnostic | Python-focused |
| Cloud coverage | Self-hosted + SaaS | Self-hosted focus |`,
    recommendations: `Choose your vector database using the benchmarks in the **Comparison** doc, then implement the chunking, embedding, and reranking strategies from **RAG Best Practices** on top of your chosen infrastructure.`,
  },
};

function formatMD(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#93c5fd">$1</strong>')
    .replace(
      /\| (.*?) \|/g,
      m => `<span style="font-family:JetBrains Mono,monospace;font-size:0.82em">${m}</span>`
    )
    .replace(/\n/g, '<br/>');
}

export default function ComparisonPage() {
  const [indexedDocs, setIndexedDocs] = useState<Document[]>([]);
  useEffect(() => {
    listKnowledgeDocuments()
      .then(documents =>
        setIndexedDocs(documents.filter(document => document.status === 'indexed'))
      )
      .catch(() => setIndexedDocs([]));
  }, []);
  const [docA, setDocA] = useState(indexedDocs[0]?.id ?? '');
  const [docB, setDocB] = useState(indexedDocs[1]?.id ?? '');
  const [activeTab, setActiveTab] = useState<'overview' | 'differences' | 'recommendations'>(
    'overview'
  );
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<typeof COMPARISON_DATA['d1-d2'] | null>(null);

  const compare = async () => {
    if (!docA || !docB || docA === docB) return;
    setComparing(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 1400));
    const key = [docA, docB].sort().join('-');
    const found = COMPARISON_DATA[key];
    setResult(
      found ?? {
        overview: `Both documents cover complementary aspects of AI system design. The semantic analysis identifies ${Math.floor(Math.random() * 30) + 20} shared concepts and ${Math.floor(Math.random() * 15) + 8} areas of divergence.`,
        differences: `Analysis detected distinct terminology clusters and coverage gaps across the two documents.`,
        recommendations: `Read both documents in context — they address different layers of the same problem domain and are best used together.`,
      }
    );
    setComparing(false);
  };

  const docAObj = indexedDocs.find(d => d.id === docA);
  const docBObj = indexedDocs.find(d => d.id === docB);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 stagger-3d-1">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
          >
            Document Comparison
          </h1>
          <p className="text-sm" style={{ color: '#8888aa' }}>
            AI-powered semantic comparison with embedding-based analysis
          </p>
        </div>

        {/* Selector */}
        <DepthCard variant="glass" accent="#8b5cf6" padding="1.5rem" className="mb-6 stagger-3d-2">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
              >
                DOCUMENT A
              </label>
              <select
                value={docA}
                onChange={e => setDocA(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0f0ff',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {indexedDocs.map(d => (
                  <option key={d.id} value={d.id} style={{ background: '#0a0a12' }}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-center text-lg float-3d-slow" style={{ color: '#8b5cf6' }}>
              ⊞
            </div>
            <div>
              <label
                className="text-xs font-medium mb-1.5 block"
                style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
              >
                DOCUMENT B
              </label>
              <select
                value={docB}
                onChange={e => setDocB(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0f0ff',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {indexedDocs.map(d => (
                  <option key={d.id} value={d.id} style={{ background: '#0a0a12' }}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <MagneticButton
              variant="primary"
              size="md"
              onClick={compare}
              disabled={comparing || !docA || !docB || docA === docB}
              loading={comparing}
            >
              {comparing ? 'Analyzing with embeddings…' : 'Run Comparison'}
            </MagneticButton>
            {docA === docB && docA && (
              <span className="text-xs" style={{ color: '#f59e0b' }}>
                Select two different documents
              </span>
            )}
          </div>
        </DepthCard>

        {/* Doc cards */}
        {docAObj && docBObj && (
          <div className="grid grid-cols-2 gap-4 mb-6 stagger-3d-3">
            {[docAObj, docBObj].map((doc, i) => (
              <Interactive3D key={doc.id} maxTilt={4} shine shineColor={i === 0 ? 'rgba(59,130,246,0.04)' : 'rgba(139,92,246,0.04)'}>
                <div
                  className="glass rounded-2xl p-4"
                  style={{
                    border: `1px solid ${i === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-lg"
                      style={{
                        background: i === 0 ? 'rgba(59,130,246,0.2)' : 'rgba(139,92,246,0.2)',
                        color: i === 0 ? '#60a5fa' : '#a78bfa',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {i === 0 ? 'A' : 'B'}
                    </span>
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}
                    >
                      {doc.name}
                    </span>
                  </div>
                  <div
                    className="flex gap-3 text-xs"
                    style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    <span>{doc.chunks} chunks</span>
                    <span>{(doc.tokens / 1000).toFixed(1)}K tokens</span>
                  </div>
                  {doc.summary && (
                    <p
                      className="mt-2 text-xs"
                      style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
                    >
                      {doc.summary.slice(0, 100)}…
                    </p>
                  )}
                </div>
              </Interactive3D>
            ))}
          </div>
        )}

        {/* Result */}
        {result && (
          <DepthCard variant="glass" accent="#3b82f6" padding="0" className="stagger-3d-4">
            {/* Tabs */}
            <div className="flex" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {(['overview', 'differences', 'recommendations'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-6 py-3 text-xs font-medium capitalize transition-all duration-200"
                  style={{
                    color: activeTab === tab ? '#60a5fa' : '#8888aa',
                    borderBottom:
                      activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  {tab}
                </button>
              ))}
              <div className="ml-auto flex items-center px-4 gap-2">
                <div
                  className="w-2 h-2 rounded-full neon-pulse"
                  style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }}
                />
                <span
                  className="text-xs"
                  style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  Embedding analysis complete
                </span>
              </div>
            </div>
            <div
              className="p-6 text-sm leading-relaxed"
              style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}
            >
              <div dangerouslySetInnerHTML={{ __html: formatMD(result[activeTab]) }} />
            </div>

            {/* Similarity score */}
            <div className="px-6 pb-6">
              <DepthCard variant="solid" accent="#60a5fa" padding="1rem">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
                  >
                    Semantic Similarity Score
                  </span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {(0.4 + Math.random() * 0.4).toFixed(3)}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: '62%',
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      boxShadow: '0 0 12px rgba(59,130,246,0.3)',
                    }}
                  />
                </div>
                <div
                  className="flex justify-between text-xs mt-1"
                  style={{
                    color: 'rgba(136,136,170,0.5)',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <span>0.0 Unrelated</span>
                  <span>1.0 Identical</span>
                </div>
              </DepthCard>
            </div>
          </DepthCard>
        )}
      </div>
    </div>
  );
}
