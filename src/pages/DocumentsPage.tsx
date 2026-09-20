import { useState, useRef, useEffect } from 'react';
import type { Document } from '../lib/types';
import {
  listKnowledgeDocuments,
  uploadKnowledgeDocument,
  deleteKnowledgeDocument,
} from '../lib/api';
import Interactive3D from '../components/Interactive3D';
import DepthCard from '../components/DepthCard';
import MagneticButton from '../components/MagneticButton';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocTypeIcon({ type }: { type: Document['type'] }) {
  const colors: Record<string, string> = {
    pdf: '#f87171',
    docx: '#60a5fa',
    txt: '#a78bfa',
    md: '#34d399',
  };
  return (
    <span
      className="text-xs font-bold px-2.5 py-1.5 rounded-xl"
      style={{
        background: `${colors[type]}15`,
        color: colors[type],
        border: `1px solid ${colors[type]}25`,
        fontFamily: 'JetBrains Mono, monospace',
        boxShadow: `0 0 12px ${colors[type]}15`,
      }}
    >
      {type.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: Document['status'] }) {
  const cfg = {
    indexed: {
      bg: 'rgba(52,211,153,0.12)',
      color: '#34d399',
      border: 'rgba(52,211,153,0.25)',
      label: 'Indexed',
    },
    processing: {
      bg: 'rgba(245,158,11,0.12)',
      color: '#f59e0b',
      border: 'rgba(245,158,11,0.25)',
      label: 'Processing',
    },
    error: {
      bg: 'rgba(239,68,68,0.12)',
      color: '#f87171',
      border: 'rgba(239,68,68,0.25)',
      label: 'Error',
    },
  }[status];
  return (
    <span
      className="text-xs px-2 py-0.5 rounded-full"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {status === 'processing' && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />
      )}
      {cfg.label}
    </span>
  );
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listKnowledgeDocuments()
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);
    try {
      const newDoc = await uploadKnowledgeDocument(file, setUploadProgress);
      setDocuments(prev => [newDoc, ...prev]);
      setUploadProgress(100);
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Document upload failed. Check that the API is running.'
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!window.confirm(`Delete "${doc.name}"? This will remove all vectors and cannot be undone.`))
      return;
    setDeleting(doc.id);
    setUploadError('');
    try {
      await deleteKnowledgeDocument(doc.id);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      if (selected === doc.id) setSelected(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete document.');
    } finally {
      setDeleting(null);
    }
  };

  const filteredDocs = documents.filter(
    d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.tags.some(t => t.includes(search.toLowerCase()))
  );

  const selectedDoc = documents.find(d => d.id === selected);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main panel */}
      <div className="flex-1 overflow-y-auto p-8 page-enter">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 stagger-3d-1">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
              >
                Documents
              </h1>
              <p className="text-sm" style={{ color: '#8888aa' }}>
                {documents.filter(d => d.status === 'indexed').length} indexed ·{' '}
                {documents.length} total
              </p>
            </div>
            <MagneticButton
              variant="primary"
              size="md"
              icon="📄"
              onClick={() => fileRef.current?.click()}
            >
              Upload Document
            </MagneticButton>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />
          </div>

          {/* Drop zone */}
          <DepthCard
            variant={dragOver ? 'neon' : 'glass'}
            accent={dragOver ? '#3b82f6' : '#8888aa'}
            padding="2rem"
            className={`mb-6 stagger-3d-2 cursor-pointer transition-all duration-300`}
            style={{
              border: `2px dashed ${dragOver ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div
              onDragOver={e => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => fileRef.current?.click()}
              className="text-center"
            >
              {uploading ? (
                <div>
                  <div
                    className="text-sm font-medium mb-3"
                    style={{ color: '#60a5fa', fontFamily: 'Inter, sans-serif' }}
                  >
                    Uploading & processing…
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden mx-auto max-w-xs"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <div
                      className="h-full rounded-full progress-animated transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div
                    className="text-xs mt-2"
                    style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {uploadProgress}%
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className="text-5xl mb-3 float-3d-slow inline-block"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.3))' }}
                  >
                    ▣
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}
                  >
                    Drop files here or click to upload
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#8888aa' }}>
                    PDF, DOCX, TXT, MD · Max 50MB
                  </div>
                </div>
              )}
            </div>
          </DepthCard>

          {uploadError && (
            <DepthCard variant="neon" accent="#ef4444" padding="0.75rem 1rem" className="mb-4">
              <div className="text-xs" style={{ color: '#fca5a5' }}>
                {uploadError}
              </div>
            </DepthCard>
          )}

          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search documents or tags…"
            className="w-full px-4 py-2.5 rounded-xl text-sm mb-4 transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#f0f0ff',
              fontFamily: 'Inter, sans-serif',
            }}
          />

          {/* Document list */}
          <div className="space-y-3">
            {filteredDocs.map((doc, i) => (
              <Interactive3D
                key={doc.id}
                maxTilt={4}
                shine
                shineColor={
                  doc.id === selected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)'
                }
              >
                <div
                  onClick={() => setSelected(doc.id === selected ? null : doc.id)}
                  className="glass rounded-2xl p-4 cursor-pointer fade-in relative overflow-hidden"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    border:
                      doc.id === selected
                        ? '1px solid rgba(59,130,246,0.35)'
                        : '1px solid rgba(255,255,255,0.07)',
                    boxShadow:
                      doc.id === selected
                        ? '0 0 20px rgba(59,130,246,0.12), inset 0 1px 0 rgba(255,255,255,0.08)'
                        : undefined,
                  }}
                >
                  {/* Selected indicator */}
                  {doc.id === selected && (
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{
                        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      }}
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <DocTypeIcon type={doc.type} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}
                        >
                          {doc.name}
                        </span>
                        <StatusBadge status={doc.status} />
                      </div>
                      <div
                        className="flex items-center gap-4 text-xs"
                        style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        <span>{formatSize(doc.size)}</span>
                        {doc.chunks > 0 && <span>{doc.chunks} chunks</span>}
                        {doc.tokens > 0 && (
                          <span>{(doc.tokens / 1000).toFixed(1)}K tokens</span>
                        )}
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      {doc.tags.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {doc.tags.map(t => (
                            <span
                              key={t}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(139,92,246,0.12)',
                                color: '#a78bfa',
                                border: '1px solid rgba(139,92,246,0.2)',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(doc);
                      }}
                      disabled={deleting === doc.id}
                      className="shrink-0 text-xs transition-all duration-200 p-2 rounded-xl hover:bg-red-500/10"
                      style={{
                        color: deleting === doc.id ? '#f87171' : 'rgba(136,136,170,0.4)',
                      }}
                      title="Delete document"
                    >
                      {deleting === doc.id ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        '✕'
                      )}
                    </button>
                  </div>
                </div>
              </Interactive3D>
            ))}
            {filteredDocs.length === 0 && documents.length > 0 && (
              <div className="text-center py-8 text-xs" style={{ color: '#6b6b8a' }}>
                No documents match "{search}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedDoc && (
        <div
          className="w-72 overflow-y-auto page-enter"
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div
                className="text-sm font-semibold"
                style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
              >
                Document Details
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                style={{ color: '#8888aa' }}
              >
                ✕
              </button>
            </div>
            <DepthCard variant="solid" accent="#60a5fa" padding="1rem">
              <div className="space-y-3">
                {[
                  { label: 'Name', value: selectedDoc.name },
                  { label: 'Type', value: selectedDoc.type.toUpperCase() },
                  { label: 'Size', value: formatSize(selectedDoc.size) },
                  { label: 'Status', value: selectedDoc.status },
                  { label: 'Chunks', value: selectedDoc.chunks || '—' },
                  {
                    label: 'Tokens',
                    value: selectedDoc.tokens
                      ? `${(selectedDoc.tokens / 1000).toFixed(1)}K`
                      : '—',
                  },
                  {
                    label: 'Uploaded',
                    value: new Date(selectedDoc.uploadedAt).toLocaleString(),
                  },
                ].map(r => (
                  <div key={r.label} className="flex justify-between gap-2">
                    <span
                      className="text-xs"
                      style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
                    >
                      {r.label}
                    </span>
                    <span
                      className="text-xs text-right truncate"
                      style={{ color: '#f0f0ff', fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </DepthCard>
            {selectedDoc.summary && (
              <div className="mt-4">
                <DepthCard variant="glass" accent="#a78bfa" padding="0.75rem">
                  <div
                    className="text-xs font-medium mb-2"
                    style={{ color: '#8888aa' }}
                  >
                    Summary
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}
                  >
                    {selectedDoc.summary}
                  </p>
                </DepthCard>
              </div>
            )}
            <MagneticButton
              variant="danger"
              size="sm"
              className="w-full mt-4"
              onClick={() => handleDelete(selectedDoc)}
              disabled={deleting === selectedDoc.id}
              loading={deleting === selectedDoc.id}
            >
              {deleting === selectedDoc.id ? 'Deleting…' : 'Delete Document'}
            </MagneticButton>
          </div>
        </div>
      )}
    </div>
  );
}
