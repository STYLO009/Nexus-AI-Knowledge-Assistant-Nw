import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChatSession, Citation } from '../lib/types';
import { askKnowledgeBase, listKnowledgeDocuments } from '../lib/api';

function CitationBadge({ citation }: { citation: Citation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="text-left transition-all duration-200"
      style={{ display: 'block', width: '100%' }}
    >
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg mt-1 cursor-pointer"
        style={{
          background: expanded ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
        <span className="text-xs font-medium shrink-0" style={{ color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>
          [{Math.round(citation.score * 100)}%]
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate" style={{ color: '#93c5fd' }}>{citation.docName}</div>
          {citation.page && <div className="text-xs" style={{ color: '#8888aa' }}>Page {citation.page}</div>}
          {expanded && (
            <div className="mt-2 text-xs italic" style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}>
              "{citation.chunk}"
            </div>
          )}
        </div>
        <span className="text-xs" style={{ color: '#8888aa' }}>{expanded ? '▲' : '▼'}</span>
      </div>
    </button>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} slide-right`}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1"
        style={isUser
          ? { background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }
          : { background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
        {isUser ? 'U' : '◎'}
      </div>
      <div className={`flex-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="px-4 py-3 rounded-xl text-sm"
          style={{
            background: isUser ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.2))' : 'rgba(255,255,255,0.05)',
            border: isUser ? '1px solid rgba(59,130,246,0.25)' : '1px solid rgba(255,255,255,0.08)',
            color: '#f0f0ff',
            fontFamily: 'Inter, sans-serif',
            lineHeight: '1.65',
          }}>
          {msg.streaming ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dot-3" />
            </span>
          ) : (
            <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
          )}
        </div>
        {msg.citations && msg.citations.length > 0 && (
          <div className="w-full space-y-1">
            <div className="text-xs font-medium" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
              {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''} retrieved
            </div>
            {msg.citations.map((c, i) => <CitationBadge key={i} citation={c} />)}
          </div>
        )}
        <span className="text-xs" style={{ color: 'rgba(136,136,170,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#93c5fd">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="font-family:JetBrains Mono,monospace;font-size:0.8em;padding:1px 5px;border-radius:4px;background:rgba(139,92,246,0.2);color:#c4b5fd">$1</code>')
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre style="margin:8px 0;padding:10px;border-radius:8px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);font-family:JetBrains Mono,monospace;font-size:0.78em;overflow-x:auto;white-space:pre-wrap"><code>$2</code></pre>')
    .replace(/\| (.*?) \|/g, (m) => `<span style="font-family:JetBrains Mono,monospace;font-size:0.82em">${m}</span>`)
    .replace(/^(\d+)\. (.+)$/gm, '<div style="margin:2px 0"><span style="color:#8b5cf6;margin-right:6px">$1.</span>$2</div>')
    .replace(/\n/g, '<br/>');
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [documents, setDocuments] = useState<import('../lib/types').Document[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listKnowledgeDocuments().then(loaded => {
      setDocuments(loaded);
      setSelectedDocs(loaded.filter(document => document.status === 'indexed').map(document => document.id));
    }).catch(() => {
      setDocuments([]);
      setSelectedDocs([]);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMessage = {
      id: `m${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    const placeholderMsg: ChatMessage = {
      id: `m${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      streaming: true,
    };
    setMessages(prev => [...prev, userMsg, placeholderMsg]);
    setInput('');
    setStreaming(true);

    let response: { answer: string; citations: Citation[] };
    try {
      response = await askKnowledgeBase(input, selectedDocs);
    } catch {
      response = {
        answer: 'The RAG service is unavailable. Start the Docker services and try again.',
        citations: [],
      };
    }

    // Stream the response word by word
    const words = response.answer.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? '' : ' ') + words[i];
      const finalAccumulated = accumulated;
      setMessages(prev => prev.map(m => m.id === placeholderMsg.id
        ? { ...m, content: finalAccumulated, streaming: i < words.length - 1 }
        : m
      ));
      if (i < words.length - 1) await new Promise(r => setTimeout(r, 18 + Math.random() * 20));
    }

    setMessages(prev => prev.map(m => m.id === placeholderMsg.id
      ? { ...m, content: response.answer, streaming: false, citations: response.citations }
      : m
    ));
    setStreaming(false);
  };

  const newSession = () => {
    const id = `s${Date.now()}`;
    const session: ChatSession = {
      id, title: 'New conversation', messages: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      documentIds: selectedDocs,
    };
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(id);
    setMessages([]);
  };

  const suggestions = [
    'What is RAG and how does it work?',
    'Compare vector database options',
    'How to implement JWT in FastAPI?',
    'Best practices for chunking documents',
  ];

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sessions sidebar */}
      <div className="w-56 flex flex-col shrink-0" style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={newSession} className="w-full py-2 rounded-lg text-xs font-medium transition-all duration-200"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', fontFamily: 'Inter, sans-serif' }}>
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map(s => (
            <button key={s.id} onClick={() => { setActiveSessionId(s.id); setMessages([]); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200"
              style={{
                background: activeSessionId === s.id ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: activeSessionId === s.id ? '#60a5fa' : '#8888aa',
                border: activeSessionId === s.id ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                fontFamily: 'Inter, sans-serif',
              }}>
              <div className="truncate font-medium">{s.title}</div>
              <div className="text-xs mt-0.5 opacity-60">{new Date(s.updatedAt).toLocaleDateString()}</div>
            </button>
          ))}
        </div>

        {/* Doc filter */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-medium mb-2" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>Sources</div>
          {documents.filter(d => d.status === 'indexed').map(d => (
            <label key={d.id} className="flex items-center gap-2 py-1 cursor-pointer">
              <input type="checkbox" checked={selectedDocs.includes(d.id)}
                onChange={e => setSelectedDocs(prev => e.target.checked ? [...prev, d.id] : prev.filter(id => id !== d.id))}
                className="w-3 h-3 accent-blue-500" />
              <span className="text-xs truncate" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>{d.name.replace(/\.(pdf|docx|md|txt)$/, '')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-sm font-semibold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>
              {sessions.find(s => s.id === activeSessionId)?.title ?? 'New Conversation'}
            </h2>
            <div className="text-xs" style={{ color: '#8888aa' }}>{selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} in context · Qdrant retrieval</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
            <span className="text-xs" style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>LLM Connected</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <span className="text-2xl">◎</span>
              </div>
              <h3 className="text-base font-semibold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>
                Ask anything
              </h3>
              <p className="text-sm mb-6" style={{ color: '#8888aa' }}>
                I'll retrieve answers from your indexed documents with citations.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-lg">
                {suggestions.map(s => (
                  <button key={s} onClick={() => setInput(s)}
                    className="px-3 py-2 rounded-lg text-xs text-left transition-all duration-200 hover:border-blue-500/40"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask a question about your documents… (⏎ to send, ⇧⏎ newline)"
              rows={1}
              className="flex-1 px-4 py-3 rounded-xl text-sm resize-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#f0f0ff',
                fontFamily: 'Inter, sans-serif',
                maxHeight: '120px',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              className="px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shrink-0"
              style={{
                background: streaming || !input.trim() ? 'rgba(59,130,246,0.2)' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: streaming || !input.trim() ? '#8888aa' : '#fff',
                border: '1px solid rgba(59,130,246,0.3)',
                fontFamily: 'Inter, sans-serif',
                boxShadow: streaming || !input.trim() ? 'none' : '0 0 16px rgba(59,130,246,0.3)',
              }}>
              {streaming ? '⟳' : '↑'}
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2 px-1">
            <span className="text-xs" style={{ color: 'rgba(136,136,170,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>
              RAG · cosine · top-5 · reranked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
