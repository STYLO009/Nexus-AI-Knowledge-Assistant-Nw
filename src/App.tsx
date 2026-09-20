import { useState, useEffect, useCallback } from 'react';
import type { User, Page } from './lib/types';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import ComparisonPage from './pages/ComparisonPage';
import SettingsPage from './pages/SettingsPage';
import ApiDocsPage from './pages/ApiDocsPage';
import Sidebar from './components/Sidebar';
import CookieConsent from './components/CookieConsent';
import ParticleField from './components/ParticleField';

const USER_STORAGE_KEY = 'nexus_user';

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function CursorTrail() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);

  const handleMove = useCallback((e: MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
    setVisible(true);
  }, []);

  const handleLeave = useCallback(() => setVisible(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseleave', handleLeave);
    };
  }, [handleMove, handleLeave]);

  return (
    <div
      className="cursor-trail"
      style={{
        left: pos.x,
        top: pos.y,
        opacity: visible ? 1 : 0,
      }}
    />
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(loadUser);
  const [page, setPage] = useState<Page>('dashboard');

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    saveUser(authenticatedUser);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    saveUser(null);
    setPage('dashboard');
  };

  if (!user) {
    return (
      <>
        <CookieConsent />
        <ParticleField />
        <CursorTrail />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#050508' }}>
      <CookieConsent />
      <ParticleField />
      <CursorTrail />

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute top-[-14rem] left-[18%] w-150 h-150 rounded-full ambient-orb ambient-orb-blue"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 64%)',
          }}
        />
        <div
          className="absolute bottom-[-12rem] right-[18%] w-125 h-125 rounded-full ambient-orb ambient-orb-violet"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 64%)',
          }}
        />
        {/* Third orb - pink accent */}
        <div
          className="absolute top-[40%] right-[5%] w-80 h-80 rounded-full ambient-orb"
          style={{
            background: 'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 64%)',
            animationDelay: '-3s',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Animated grid */}
      <div
        className="fixed inset-0 grid-bg pointer-events-none"
        style={{ zIndex: 0, opacity: 0.4 }}
      />

      {/* Data stream lines (decorative) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="data-stream-line"
            style={{
              left: `${15 + i * 18}%`,
              animationDuration: `${8 + i * 2}s`,
              animationDelay: `${i * 1.5}s`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      <div className="relative flex w-full app-shell" style={{ zIndex: 1 }}>
        <Sidebar currentPage={page} onNavigate={setPage} user={user} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col overflow-hidden min-h-screen app-stage">
          {/* Top bar */}
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0 relative"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(5,5,8,0.6)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              className="flex items-center gap-3 text-sm font-medium"
              style={{ color: '#f0f0ff', fontFamily: 'Outfit, sans-serif' }}
            >
              <span className="status-beacon neon-pulse" aria-hidden="true">
                <span />
              </span>
              {page === 'dashboard' && 'System Dashboard'}
              {page === 'chat' && 'AI Chat · RAG Mode'}
              {page === 'documents' && 'Knowledge Base'}
              {page === 'comparison' && 'Document Comparison'}
              {page === 'settings' && 'Workspace Settings'}
              {page === 'api-docs' && 'API Documentation'}
            </div>
            <div className="flex items-center gap-3">
              <div
                className="text-xs px-2.5 py-1 rounded-full glass-shimmer"
                style={{
                  background: 'rgba(52,211,153,0.1)',
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.2)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                v2.4.1
              </div>
              <div
                className="text-xs"
                style={{
                  color: '#8888aa',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="flex flex-1 overflow-hidden">
            {page === 'dashboard' && <DashboardPage />}
            {page === 'chat' && <ChatPage />}
            {page === 'documents' && <DocumentsPage />}
            {page === 'comparison' && <ComparisonPage />}
            {page === 'settings' && <SettingsPage user={user} />}
            {page === 'api-docs' && <ApiDocsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}
