import Interactive3D from '../components/Interactive3D';
import DepthCard from '../components/DepthCard';

const endpoints = [
  { method: 'GET', path: '/health', description: 'Check API, retrieval, and generation service status.' },
  { method: 'GET', path: '/api/documents', description: 'List documents indexed in the current knowledge base.' },
  { method: 'GET', path: '/api/stats', description: 'Get dashboard statistics: document counts, chunk totals, top documents, and weekly activity.' },
  { method: 'POST', path: '/api/documents/upload', description: 'Upload and index a PDF, DOCX, TXT, or Markdown document.' },
  { method: 'POST', path: '/api/chat', description: 'Retrieve relevant chunks and generate a cited answer.' },
];

export default function ApiDocsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 stagger-3d-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>
            API Documentation
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
            Endpoints exposed by the Nexus RAG service.
          </p>
        </div>
        <div className="space-y-3">
          {endpoints.map((endpoint, i) => (
            <Interactive3D key={`${endpoint.method}-${endpoint.path}`} maxTilt={3} shine shineColor={endpoint.method === 'GET' ? 'rgba(52,211,153,0.04)' : 'rgba(59,130,246,0.04)'}>
              <DepthCard
                variant="glass"
                accent={endpoint.method === 'GET' ? '#34d399' : '#3b82f6'}
                padding="1.25rem"
                edgeLight={false}
                className={`stagger-3d-${Math.min(i + 2, 6)}`}
              >
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{
                      background: endpoint.method === 'GET' ? 'rgba(52,211,153,0.12)' : 'rgba(59,130,246,0.12)',
                      color: endpoint.method === 'GET' ? '#34d399' : '#60a5fa',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-sm" style={{ color: '#f0f0ff', fontFamily: 'JetBrains Mono, monospace' }}>
                    {endpoint.path}
                  </code>
                </div>
                <p className="text-sm" style={{ color: '#8888aa' }}>{endpoint.description}</p>
              </DepthCard>
            </Interactive3D>
          ))}
        </div>
        <DepthCard variant="neon" accent="#3b82f6" padding="0.75rem 1rem" className="mt-6 stagger-3d-6">
          <div className="text-xs" style={{ color: '#93c5fd' }}>
            The API is available through the same host when running with Docker, or at{' '}
            <code style={{ fontFamily: 'JetBrains Mono, monospace' }}>http://localhost:8000</code>{' '}
            during local development.
          </div>
        </DepthCard>
      </div>
    </div>
  );
}
