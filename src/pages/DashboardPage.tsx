import { useEffect, useState } from 'react';
import { getDashboardStats } from '../lib/api';
import type { DashboardStats } from '../lib/api';
import DepthCard from '../components/DepthCard';
import AnimatedCounter from '../components/AnimatedCounter';
import Interactive3D from '../components/Interactive3D';

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  delay,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  icon: string;
  delay: string;
}) {
  return (
    <DepthCard
      variant="glass"
      accent={color}
      padding="1.25rem"
      className={`stagger-3d-${parseInt(delay) + 1}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
        >
          {label}
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm relative"
          style={{
            background: `${color}15`,
            color,
            boxShadow: `0 0 16px ${color}20`,
          }}
        >
          {icon}
          {/* Pulse ring */}
          <div
            className="absolute inset-0 rounded-xl"
            style={{
              border: `1px solid ${color}30`,
              animation: 'neon-pulse-ring 3s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      <div className="text-3xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
        <AnimatedCounter target={value} color={color} />
      </div>
      <div className="text-xs" style={{ color: '#8888aa' }}>
        {sub}
      </div>
    </DepthCard>
  );
}

function BarChart({ data }: { data: { label: string; count: number }[] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center h-32"
        style={{ color: '#6b6b8a', fontFamily: 'Inter, sans-serif', fontSize: '12px' }}
      >
        No data yet — upload documents to see activity
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-4 h-32">
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-2">
          <span
            className="text-xs font-medium"
            style={{
              color: '#c4c4e0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
            }}
          >
            {d.count}
          </span>
          <div
            className="w-full rounded-t-lg transition-all duration-1000 relative overflow-hidden"
            style={{
              height: animated ? `${Math.max((d.count / max) * 100, 8)}%` : '4%',
              background: `linear-gradient(180deg, ${i === 0 ? '#3b82f6' : '#8b5cf6'}, ${i === 0 ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'})`,
              boxShadow: `0 -4px 16px ${i === 0 ? 'rgba(59,130,246,0.25)' : 'rgba(139,92,246,0.25)'}`,
            }}
          >
            <div className="absolute inset-0 rounded-t-lg progress-animated opacity-40" />
            {/* Shine effect */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                animation: 'glass-shimmer 3s ease-in-out infinite',
              }}
            />
          </div>
          <span
            className="text-xs"
            style={{
              color: '#8888aa',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
            }}
          >
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(() => setError('Could not load dashboard stats'));
  }, []);

  const s = stats;

  const statCards = s
    ? [
        {
          label: 'Documents',
          value: s.totalDocuments,
          sub: `+${s.documentsThisWeek} this week`,
          color: '#60a5fa',
          icon: '📁',
        },
        {
          label: 'Total Chunks',
          value: s.totalChunks,
          sub: `${s.totalTokens.toLocaleString()} tokens indexed`,
          color: '#a78bfa',
          icon: '🧩',
        },
        {
          label: 'Indexed',
          value: s.indexedDocuments,
          sub: `${s.processingDocuments} processing`,
          color: '#34d399',
          icon: '✓',
        },
        {
          label: 'Errors',
          value: s.errorDocuments,
          sub: 'Failed documents',
          color: '#f87171',
          icon: '⚠',
        },
      ]
    : [
        { label: 'Documents', value: 0, sub: 'Loading…', color: '#60a5fa', icon: '📁' },
        { label: 'Total Chunks', value: 0, sub: 'Loading…', color: '#a78bfa', icon: '🧩' },
        { label: 'Indexed', value: 0, sub: 'Loading…', color: '#34d399', icon: '✓' },
        { label: 'Errors', value: 0, sub: 'Loading…', color: '#f87171', icon: '⚠' },
      ];

  const chartData =
    s && s.chunksThisWeek > 0
      ? [
          { label: 'Chunks', count: s.chunksThisWeek },
          { label: 'Docs', count: s.documentsThisWeek },
        ]
      : [];

  return (
    <div className="flex-1 overflow-y-auto page-enter">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 stagger-3d-1">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
          >
            System Dashboard
          </h1>
          <p className="text-sm" style={{ color: '#8888aa' }}>
            Real-time insights across your knowledge base —{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {error && (
          <DepthCard variant="neon" accent="#ef4444" padding="0.75rem 1rem" className="mb-4">
            <div className="text-xs" style={{ color: '#fca5a5' }}>
              {error}
            </div>
          </DepthCard>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <StatCard key={card.label} {...card} delay={`${i}`} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity chart */}
          <DepthCard variant="glass" accent="#3b82f6" padding="1.5rem" className="lg:col-span-2 stagger-3d-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div
                  className="text-sm font-semibold mb-0.5"
                  style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
                >
                  Ingestion Activity
                </div>
                <div className="text-xs" style={{ color: '#8888aa' }}>
                  This week
                </div>
              </div>
              {s && s.chunksThisWeek > 0 && (
                <div
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{
                    background: 'rgba(52,211,153,0.12)',
                    color: '#34d399',
                    border: '1px solid rgba(52,211,153,0.2)',
                  }}
                >
                  +{s.chunksThisWeek.toLocaleString()} chunks
                </div>
              )}
            </div>
            <BarChart data={chartData} />
          </DepthCard>

          {/* Top documents */}
          <DepthCard variant="glass" accent="#8b5cf6" padding="1.5rem" className="stagger-3d-4">
            <div
              className="text-sm font-semibold mb-4"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
            >
              Top Documents
            </div>
            <div className="space-y-3">
              {s && s.topDocuments.length > 0 ? (
                s.topDocuments.map((doc, i) => {
                  const maxChunks = s.topDocuments[0].chunks || 1;
                  const pct = Math.round((doc.chunks / maxChunks) * 100);
                  return (
                    <Interactive3D key={doc.name} maxTilt={5} shine={false} glow={false}>
                      <div className="fade-in" style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="text-xs truncate flex-1 mr-2"
                            style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}
                          >
                            {doc.name}
                          </span>
                          <span
                            className="text-xs shrink-0"
                            style={{
                              color: '#8888aa',
                              fontFamily: 'JetBrains Mono, monospace',
                            }}
                          >
                            {doc.chunks}
                          </span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                            style={{
                              width: `${pct}%`,
                              background:
                                i === 0
                                  ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                                  : 'rgba(59,130,246,0.5)',
                              boxShadow:
                                i === 0 ? '0 0 12px rgba(59,130,246,0.3)' : 'transparent',
                            }}
                          >
                            <div className="absolute inset-0 progress-animated opacity-30" />
                          </div>
                        </div>
                      </div>
                    </Interactive3D>
                  );
                })
              ) : (
                <div className="text-xs text-center py-4" style={{ color: '#6b6b8a' }}>
                  No indexed documents yet
                </div>
              )}
            </div>
          </DepthCard>
        </div>

        {/* System status */}
        <DepthCard variant="solid" accent="#34d399" padding="1.25rem" className="mt-6 stagger-3d-5">
          <div
            className="text-sm font-semibold mb-4"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
          >
            Infrastructure Status
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { name: 'FastAPI Backend', status: 'Operational', ms: '12ms', color: '#34d399' },
              { name: 'Qdrant Vector DB', status: 'Operational', ms: '4ms', color: '#34d399' },
              { name: 'PostgreSQL', status: 'Operational', ms: '2ms', color: '#34d399' },
              { name: 'Hugging Face', status: 'Degraded', ms: '340ms', color: '#f59e0b' },
            ].map((service, i) => (
              <Interactive3D key={service.name} maxTilt={6} shine={false}>
                <div
                  className="rounded-xl p-3 relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: service.color,
                        boxShadow: `0 0 8px ${service.color}`,
                      }}
                    />
                    <span
                      className="text-xs font-medium"
                      style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}
                    >
                      {service.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: service.color }}>
                      {service.status}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        color: '#8888aa',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {service.ms}
                    </span>
                  </div>
                </div>
              </Interactive3D>
            ))}
          </div>
        </DepthCard>

        {/* Recent activity */}
        <DepthCard variant="glass" accent="#60a5fa" padding="1.25rem" className="mt-6 stagger-3d-6">
          <div
            className="text-sm font-semibold mb-4"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
          >
            Recent Activity
          </div>
          <div className="space-y-1">
            {s && s.totalDocuments > 0 ? (
              [
                {
                  action: 'Documents loaded',
                  detail: `${s.indexedDocuments} indexed, ${s.processingDocuments} processing`,
                  time: 'now',
                  color: '#34d399',
                },
                {
                  action: 'Knowledge base',
                  detail: `${s.totalChunks.toLocaleString()} chunks · ${s.totalTokens.toLocaleString()} tokens`,
                  time: 'now',
                  color: '#60a5fa',
                },
                ...(s.documentsThisWeek > 0
                  ? [
                      {
                        action: 'This week',
                        detail: `${s.documentsThisWeek} new documents · ${s.chunksThisWeek.toLocaleString()} chunks added`,
                        time: '7d',
                        color: '#a78bfa',
                      },
                    ]
                  : []),
                ...(s.errorDocuments > 0
                  ? [
                      {
                        action: 'Errors',
                        detail: `${s.errorDocuments} document(s) failed to index`,
                        time: '!',
                        color: '#f87171',
                      },
                    ]
                  : []),
              ].map((ev, i, arr) => (
                <div
                  key={i}
                  className="flex items-center gap-4 py-2.5 fade-in"
                  style={{
                    animationDelay: `${0.5 + i * 0.06}s`,
                    borderBottom:
                      i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      background: ev.color,
                      boxShadow: `0 0 6px ${ev.color}`,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-xs font-medium mr-2"
                      style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}
                    >
                      {ev.action}
                    </span>
                    <span className="text-xs" style={{ color: '#8888aa' }}>
                      {ev.detail}
                    </span>
                  </div>
                  <span
                    className="text-xs shrink-0"
                    style={{
                      color: 'rgba(136,136,170,0.6)',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}
                  >
                    {ev.time}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-center py-4" style={{ color: '#6b6b8a' }}>
                {error ? 'Could not load activity' : 'No activity yet — upload a document to get started'}
              </div>
            )}
          </div>
        </DepthCard>
      </div>
    </div>
  );
}
