import { useState, useRef, useEffect } from 'react';
import type { Document } from '../lib/types';
import { listKnowledgeDocuments, uploadKnowledgeDocument } from '../lib/api';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function DocTypeIcon({ type }: { type: Document['type'] }) {
  const colors: Record<string, string> = { pdf: '#f87171', docx: '#60a5fa', txt: '#a78bfa', md: '#34d399' };
  return (
    <span className="text-xs font-bold px-1.5 py-0.5 rounded"
      style={{ background: `${colors[type]}22`, color: colors[type], border: `1px solid ${colors[type]}33`, fontFamily: 'JetBrains Mono, monospace' }}>
      {type.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: Document['status'] }) {
  const cfg = {
    indexed: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.25)', label: 'Indexed' },
    processing: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.25)', label: 'Processing' },
    error: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)', label: 'Error' },
  }[status];
  return (
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      {status === 'processing' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1" />}
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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listKnowledgeDocuments().then(setDocuments).catch(() => setDocuments([]));
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);
    try {
      setUploadProgress(35);
      const newDoc = await uploadKnowledgeDocument(file);
      setDocuments(prev => [newDoc, ...prev]);
      setUploadProgress(100);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Document upload failed. Check that the API is running.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filteredDocs = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.includes(search.toLowerCase()))
  );

  const selectedDoc = documents.find(d => d.id === selected);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main panel */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>Documents</h1>
              <p className="text-sm" style={{ color: '#8888aa' }}>{documents.filter(d => d.status === 'indexed').length} indexed · {documents.length} total</p>
            </div>
            <button onClick={() => fileRef.current?.click()}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontFamily: 'Outfit, sans-serif', boxShadow: '0 0 16px rgba(59,130,246,0.3)' }}>
              Upload Document
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden"
              onChange={e => handleUpload(e.target.files)} />
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl mb-6 p-8 text-center cursor-pointer transition-all duration-200"
            style={{
              border: `2px dashed ${dragOver ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
              background: dragOver ? 'rgba(59,130,246,0.06)' : 'rgba(255,255,255,0.02)',
            }}>
            {uploading ? (
              <div>
                <div className="text-sm font-medium mb-3" style={{ color: '#60a5fa', fontFamily: 'Inter, sans-serif' }}>Uploading & processing…</div>
                <div className="h-1.5 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-1.5 rounded-full progress-animated transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                </div>
                <div className="text-xs mt-2" style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}>{uploadProgress}%</div>
              </div>
            ) : (
              <div>
                <div className="text-3xl mb-2">▣</div>
                <div className="text-sm font-medium" style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}>Drop files here or click to upload</div>
                <div className="text-xs mt-1" style={{ color: '#8888aa' }}>PDF, DOCX, TXT, MD · Max 50MB</div>
              </div>
            )}
          </div>
          {uploadError && (
            <div className="mb-4 rounded-lg px-3 py-2 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)' }}>
              {uploadError}
            </div>
          )}

          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search documents or tags…"
            className="w-full px-4 py-2.5 rounded-xl text-sm mb-4 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }} />

          {/* Document list */}
          <div className="space-y-2">
            {filteredDocs.map(doc => (
              <div key={doc.id}
                onClick={() => setSelected(doc.id === selected ? null : doc.id)}
                className="glass rounded-xl p-4 cursor-pointer transition-all duration-200 fade-in"
                style={{
                  border: doc.id === selected ? '1px solid rgba(59,130,246,0.35)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: doc.id === selected ? '0 0 12px rgba(59,130,246,0.1)' : 'none',
                }}>
                <div className="flex items-start gap-3">
                  <DocTypeIcon type={doc.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate" style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}>{doc.name}</span>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}>
                      <span>{formatSize(doc.size)}</span>
                      {doc.chunks > 0 && <span>{doc.chunks} chunks</span>}
                      {doc.tokens > 0 && <span>{(doc.tokens / 1000).toFixed(1)}K tokens</span>}
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                    {doc.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {doc.tags.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {doc.summary && doc.id === selected && (
                      <p className="mt-3 text-xs leading-relaxed" style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}>{doc.summary}</p>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setDocuments(prev => prev.filter(d => d.id !== doc.id)); }}
                    className="shrink-0 text-xs transition-colors hover:text-red-400 p-1"
                    style={{ color: 'rgba(136,136,170,0.4)' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {selectedDoc && (
        <div className="w-72 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-5">
            <div className="text-sm font-semibold mb-4" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>Document Details</div>
            <div className="space-y-3">
              {[
                { label: 'Name', value: selectedDoc.name },
                { label: 'Type', value: selectedDoc.type.toUpperCase() },
                { label: 'Size', value: formatSize(selectedDoc.size) },
                { label: 'Status', value: selectedDoc.status },
                { label: 'Chunks', value: selectedDoc.chunks || '—' },
                { label: 'Tokens', value: selectedDoc.tokens ? `${(selectedDoc.tokens / 1000).toFixed(1)}K` : '—' },
                { label: 'Uploaded', value: new Date(selectedDoc.uploadedAt).toLocaleString() },
              ].map(r => (
                <div key={r.label} className="flex justify-between gap-2">
                  <span className="text-xs" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>{r.label}</span>
                  <span className="text-xs text-right" style={{ color: '#f0f0ff', fontFamily: 'JetBrains Mono, monospace' }}>{r.value}</span>
                </div>
              ))}
            </div>
            {selectedDoc.summary && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-xs font-medium mb-2" style={{ color: '#8888aa' }}>Summary</div>
                <p className="text-xs leading-relaxed" style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}>{selectedDoc.summary}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
