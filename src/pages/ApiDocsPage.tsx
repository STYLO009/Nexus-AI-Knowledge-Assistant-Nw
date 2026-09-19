const endpoints = [
  { method: 'GET', path: '/health', description: 'Check API, retrieval, and generation service status.' },
  { method: 'GET', path: '/api/documents', description: 'List documents indexed in the current knowledge base.' },
  { method: 'POST', path: '/api/documents/upload', description: 'Upload and index a PDF, DOCX, TXT, or Markdown document.' },
  { method: 'POST', path: '/api/chat', description: 'Retrieve relevant chunks and generate a cited answer.' },
];

export default function ApiDocsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>API Documentation</h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>Endpoints exposed by the Nexus RAG service.</p>
        </div>
        <div className="space-y-3">
          {endpoints.map(endpoint => (
            <article key={`${endpoint.method}-${endpoint.path}`} className="glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: endpoint.method === 'GET' ? 'rgba(52,211,153,0.12)' : 'rgba(59,130,246,0.12)', color: endpoint.method === 'GET' ? '#34d399' : '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>{endpoint.method}</span>
                <code className="text-sm" style={{ color: '#f0f0ff', fontFamily: 'JetBrains Mono, monospace' }}>{endpoint.path}</code>
              </div>
              <p className="text-sm" style={{ color: '#8888aa' }}>{endpoint.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-6 px-4 py-3 rounded-lg text-xs" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: '#93c5fd' }}>
          The API is available through the same host when running with Docker, or at <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>http://localhost:8000</code> during local development.
        </div>
      </div>
    </div>
  );
}
