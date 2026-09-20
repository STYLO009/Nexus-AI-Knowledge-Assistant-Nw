import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChatSession, Citation } from '../lib/types';
import { askKnowledgeBase, listKnowledgeDocuments } from '../lib/api';
import Interactive3D from '../components/Interactive3D';
import DepthCard from '../components/DepthCard';

function CitationBadge({ citation }: { citation: Citation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Interactive3D maxTilt={4} shine={false} glow={false}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-left transition-all duration-200 w-full"
      >
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl mt-1 cursor-pointer"
          style={{
            background: expanded ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.06)',
            border: `1px solid ${expanded ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)'}`,
            boxShadow: expanded ? '0 0 16px rgba(59,130,246,0.1)' : 'none',
          }}
        >
          <span
            className="text-xs font-bold shrink-0 px-1.5 py-0.5 rounded-md"
            style={{
              color: '#60a5fa',
              fontFamily: 'JetBrains Mono, monospace',
              background: 'rgba(59,130,246,0.15)',
            }}
          >
            [{Math.round(citation.score * 100)}%]
          </span>
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-medium truncate"
              style={{ color: '#93c5fd' }}
            >
              {citation.docName}
            </div>
            {citation.page && (
              <div className="text-xs mt-0.5" style={{ color: '#8888aa' }}>
                Page {citation.page}
              </div>
            )}
            {expanded && (
              <div
                className="mt-2 text-xs italic leading-relaxed"
                style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}
              >
                "{citation.chunk}"
              </div>
            )}
          </div>
          <span className="text-xs shrink-0 mt-0.5" style={{ color: '#8888aa' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>
    </Interactive3D>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === 'user';
  return (
    <Interactive3D maxTilt={isUser ? 3 : 2} shine={!isUser} shineColor="rgba(139,92,246,0.06)">
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} slide-right`}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 mt-1"
          style={
            isUser
              ? {
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                }
              : {
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  color: '#a78bfa',
                  boxShadow: '0 0 16px rgba(139,92,246,0.1)',
                }
          }
        >
          {isUser ? 'U' : '◎'}
        </div>
        <div
          className={`flex-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}
        >
          <div
            className="px-4 py-3 rounded-2xl text-sm relative overflow-hidden"
            style={{
              background: isUser
                ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.2))'
                : 'rgba(255,255,255,0.05)',
              border: isUser
                ? '1px solid rgba(59,130,246,0.25)'
                : '1px solid rgba(255,255,255,0.08)',
              color: '#f0f0ff',
              fontFamily: 'Inter, sans-serif',
              lineHeight: '1.65',
              boxShadow: isUser
                ? '0 4px 16px rgba(59,130,246,0.15)'
                : '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            {msg.streaming ? (
              <span className="flex items-center gap-2 py-1">
                <span className="w-2 h-2 rounded-full bg-blue-400 dot-1" />
                <span className="w-2 h-2 rounded-full bg-blue-400 dot-2" />
                <span className="w-2 h-2 rounded-full bg-blue-400 dot-3" />
              </span>
            ) : (
              <div
                className="whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
              />
            )}
            {/* Subtle inner glow for assistant messages */}
            {!isUser && !msg.streaming && (
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.03), transparent 50%)',
                }}
              />
            )}
          </div>
          {msg.citations && msg.citations.length > 0 && (
            <div className="w-full space-y-1 mt-1">
              <div
                className="text-xs font-medium flex items-center gap-2"
                style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
              >
                <span
                  className="w-1 h-1 rounded-full"
                  style={{ background: '#34d399', boxShadow: '0 0 4px #34d399' }}
                />
                {msg.citations.length} source{msg.citations.length > 1 ? 's' : ''} retrieved
              </div>
              {msg.citations.map((c, i) => (
                <CitationBadge key={i} citation={c} />
              ))}
            </div>
          )}
          <span
            className="text-xs"
            style={{
              color: 'rgba(136,136,170,0.5)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </Interactive3D>
  );
}

function formatMarkdown(text: string): string {
  return text
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong style="color:#93c5fd">$1</strong>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code style="font-family:JetBrains Mono,monospace;font-size:0.8em;padding:2px 6px;border-radius:5px;background:rgba(139,92,246,0.2);color:#c4b5fd;border:1px solid rgba(139,92,246,0.15)">$1</code>'
    )
    .replace(
      /```(\w+)?\n?([\s\S]*?)```/g,
      '<pre style="margin:8px 0;padding:12px;border-radius:10px;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.08);font-family:JetBrains Mono,monospace;font-size:0.78em;overflow-x:auto;white-space:pre-wrap"><code>$2</code></pre>'
    )
    .replace(
      /\| (.*?) \|/g,
      m => `<span style="font-family:JetBrains Mono,monospace;font-size:0.82em">${m}</span>`
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<div style="margin:2px 0"><span style="color:#8b5cf6;margin-right:6px;font-weight:600">$1.</span>$2</div>'
    )
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
    listKnowledgeDocuments()
      .then(loaded => {
        setDocuments(loaded);
        setSelectedDocs(
          loaded.filter(document => document.status === 'indexed').map(document => document.id)
        );
      })
      .catch(() => {
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
      setMessages(prev =>
        prev.map(m =>
          m.id === placeholderMsg.id
            ? { ...m, content: finalAccumulated, streaming: i < words.length - 1 }
            : m
        )
      );
      if (i < words.length - 1) await new Promise(r => setTimeout(r, 18 + Math.random() * 20));
    }

    setMessages(prev =>
      prev.map(m =>
        m.id === placeholderMsg.id
          ? { ...m, content: response.answer, streaming: false, citations: response.citations }
          : m
      )
    );
    setStreaming(false);
  };

  const newSession = () => {
    const id = `s${Date.now()}`;
    const session: ChatSession = {
      id,
      title: 'New conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      <div
        className="w-56 flex flex-col shrink-0 relative overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(139,92,246,0.03), transparent 30%, transparent 70%, rgba(59,130,246,0.02))',
          }}
        />
        <div
          className="p-3 relative z-10"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={newSession}
            className="w-full py-2.5 rounded-xl text-xs font-medium transition-all duration-200 btn-3d"
            style={{
              background: 'rgba(59,130,246,0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59,130,246,0.25)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 relative z-10">
          {sessions.map(s => (
            <Interactive3D key={s.id} maxTilt={3} shine={false} glow={false}>
              <button
                onClick={() => {
                  setActiveSessionId(s.id);
                  setMessages([]);
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all duration-200"
                style={{
                  background:
                    activeSessionId === s.id
                      ? 'rgba(59,130,246,0.12)'
                      : 'transparent',
                  color: activeSessionId === s.id ? '#60a5fa' : '#8888aa',
                  border:
                    activeSessionId === s.id
                      ? '1px solid rgba(59,130,246,0.2)'
                      : '1px solid transparent',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <div className="truncate font-medium">{s.title}</div>
                <div className="text-xs mt-0.5 opacity-60">
                  {new Date(s.updatedAt).toLocaleDateString()}
                </div>
              </button>
            </Interactive3D>
          ))}
        </div>

        {/* Doc filter */}
        <div
          className="p-3 relative z-10"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="text-xs font-medium mb-2 flex items-center gap-1.5"
            style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: '#34d399', boxShadow: '0 0 4px #34d399' }}
            />
            Sources
          </div>
          {documents
            .filter(d => d.status === 'indexed')
            .map(d => (
              <label
                key={d.id}
                className="flex items-center gap-2 py-1.5 cursor-pointer rounded-lg px-1 transition-colors hover:bg-white/3"
              >
                <input
                  type="checkbox"
                  checked={selectedDocs.includes(d.id)}
                  onChange={e =>
                    setSelectedDocs(prev =>
                      e.target.checked
                        ? [...prev, d.id]
                        : prev.filter(id => id !== d.id)
                    )
                  }
                  className="w-3 h-3 accent-blue-500 rounded"
                />
                <span
                  className="text-xs truncate"
                  style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
                >
                  {d.name.replace(/\.(pdf|docx|md|txt)$/, '')}
                </span>
              </label>
            ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
            >
              {sessions.find(s => s.id === activeSessionId)?.title ?? 'New Conversation'}
            </h2>
            <div className="text-xs flex items-center gap-1.5" style={{ color: '#8888aa' }}>
              {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} in context
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                Qdrant
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full neon-pulse"
              style={{ background: '#34d399', boxShadow: '0 0 8px #34d399' }}
            />
            <span
              className="text-xs"
              style={{ color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}
            >
              LLM Connected
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center float-3d-slow"
                style={{
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  boxShadow: '0 0 24px rgba(139,92,246,0.1)',
                }}
              >
                <span className="text-3xl">◎</span>
              </div>
              <h3
                className="text-base font-semibold mb-1"
                style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
              >
                Ask anything
              </h3>
              <p className="text-sm mb-6" style={{ color: '#8888aa' }}>
                I'll retrieve answers from your indexed documents with citations.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-lg">
                {suggestions.map((s, i) => (
                  <Interactive3D key={s} maxTilt={5} shine={false}>
                    <button
                      onClick={() => setInput(s)}
                      className={`px-3 py-2.5 rounded-xl text-xs text-left transition-all duration-200 stagger-3d-${i + 1}`}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#c4c4e0',
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      {s}
                    </button>
                  </Interactive3D>
                ))}
              </div>
            </div>
          )}
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex gap-3 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask a question about your documents… (⏎ to send, ⇧⏎ newline)"
              rows={1}
              className="flex-1 px-4 py-3 rounded-2xl text-sm resize-none transition-all duration-200"
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
              className="px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 shrink-0 btn-3d"
              style={{
                background:
                  streaming || !input.trim()
                    ? 'rgba(59,130,246,0.2)'
                    : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: streaming || !input.trim() ? '#8888aa' : '#fff',
                border: '1px solid rgba(59,130,246,0.3)',
                fontFamily: 'Inter, sans-serif',
                boxShadow:
                  streaming || !input.trim()
                    ? 'none'
                    : '0 0 20px rgba(59,130,246,0.3)',
              }}
            >
              {streaming ? '⟳' : '↑'}
            </button>
          </div>
          <div className="flex items-center gap-4 mt-2 px-1">
            <span
              className="text-xs flex items-center gap-1.5"
              style={{ color: 'rgba(136,136,170,0.5)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              <span className="w-1 h-1 rounded-full" style={{ background: '#3b82f6' }} />
              RAG · cosine · top-5 · reranked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
