import { useEffect, useState } from 'react';
import { listKnowledgeDocuments } from '../lib/api';
import type { Document } from '../lib/types';

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="glass rounded-xl p-5 fade-in" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
        {label}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: '#8888aa' }}>{sub}</div>
    </div>
  );
}

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map(d => d.count));
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map(d => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-sm transition-all duration-500 relative overflow-hidden"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: '4px', background: 'rgba(59,130,246,0.3)' }}>
            <div className="absolute inset-0 rounded-t-sm progress-animated opacity-60" />
          </div>
          <span className="text-xs" style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}>{d.date.replace('Sep ', '')}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    listKnowledgeDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  const stats = {
    totalDocuments: documents.length,
    totalChats: 0,
    totalQueries: 0,
    avgResponseTime: 0,
    documentsThisWeek: 0,
    queriesThisWeek: 0,
    topDocuments: documents.slice(0, 4).map(document => ({ name: document.name, queries: 0 })),
    queryVolume: [],
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>
            System Dashboard
          </h1>
          <p className="text-sm" style={{ color: '#8888aa' }}>
            Real-time insights across your knowledge base — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Documents" value={stats.totalDocuments} sub={`+${stats.documentsThisWeek} this week`} color="#60a5fa" />
          <StatCard label="Chat Sessions" value={stats.totalChats} sub="Across all users" color="#a78bfa" />
          <StatCard label="Total Queries" value={stats.totalQueries} sub={`+${stats.queriesThisWeek} this week`} color="#34d399" />
          <StatCard label="Avg Response" value={`${stats.avgResponseTime}s`} sub="P50 latency" color="#f59e0b" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query volume chart */}
          <div className="lg:col-span-2 glass rounded-xl p-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm font-semibold mb-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>Query Volume</div>
                <div className="text-xs" style={{ color: '#8888aa' }}>Last 7 days</div>
              </div>
              <div className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>
                ↑ 23% vs prior week
              </div>
            </div>
            <BarChart data={stats.queryVolume} />
          </div>

          {/* Top documents */}
          <div className="glass rounded-xl p-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-sm font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>Top Documents</div>
            <div className="space-y-3">
              {stats.topDocuments.map((doc, i) => {
                const pct = Math.round((doc.queries / stats.topDocuments[0].queries) * 100);
                return (
                  <div key={doc.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs truncate flex-1 mr-2" style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}>
                        {doc.name}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}>{doc.queries}</span>
                    </div>
                    <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-1 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: i === 0 ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' : 'rgba(59,130,246,0.5)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* System status */}
        <div className="mt-6 glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-sm font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>Infrastructure Status</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'FastAPI Backend', status: 'Operational', ms: '12ms' },
              { name: 'Qdrant Vector DB', status: 'Operational', ms: '4ms' },
              { name: 'PostgreSQL', status: 'Operational', ms: '2ms' },
              { name: 'Hugging Face', status: 'Degraded', ms: '340ms' },
            ].map(s => (
              <div key={s.name} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{
                    background: s.status === 'Operational' ? '#34d399' : '#f59e0b',
                    boxShadow: `0 0 6px ${s.status === 'Operational' ? '#34d399' : '#f59e0b'}`,
                  }} />
                  <span className="text-xs font-medium" style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}>{s.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: s.status === 'Operational' ? '#34d399' : '#f59e0b' }}>{s.status}</span>
                  <span className="text-xs" style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}>{s.ms}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-6 glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-sm font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>Recent Activity</div>
          <div className="space-y-2">
            {[
              { action: 'Document indexed', detail: 'FastAPI Security Hardening.pdf · 186 chunks · 102K tokens', time: '2m ago', color: '#34d399' },
              { action: 'Query answered', detail: 'RAG pipeline optimization · 3 citations retrieved', time: '8m ago', color: '#60a5fa' },
              { action: 'Session started', detail: 'New chat: Vector DB selection · 2 documents', time: '15m ago', color: '#a78bfa' },
              { action: 'Upload started', detail: 'Hugging Face Transformers.txt · processing…', time: '22m ago', color: '#f59e0b' },
              { action: 'User logged in', detail: 'admin@nexus.ai from 192.168.1.42', time: '1h ago', color: '#60a5fa' },
            ].map((ev, i) => (
              <div key={i} className="flex items-center gap-4 py-2" style={{ borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: ev.color, boxShadow: `0 0 4px ${ev.color}` }} />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium mr-2" style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}>{ev.action}</span>
                  <span className="text-xs" style={{ color: '#8888aa' }}>{ev.detail}</span>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'rgba(136,136,170,0.6)', fontFamily: 'JetBrains Mono, monospace' }}>{ev.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
