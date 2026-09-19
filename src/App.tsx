import { useState } from 'react';
import type { User, Page } from './lib/types';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import DocumentsPage from './pages/DocumentsPage';
import ComparisonPage from './pages/ComparisonPage';
import SettingsPage from './pages/SettingsPage';
import ApiDocsPage from './pages/ApiDocsPage';
import Sidebar from './components/Sidebar';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>('dashboard');

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('dashboard');
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#050508' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-14rem] left-[18%] w-150 h-150 rounded-full ambient-orb ambient-orb-blue"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.14) 0%, transparent 64%)' }} />
        <div className="absolute bottom-[-12rem] right-[18%] w-125 h-125 rounded-full ambient-orb ambient-orb-violet"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 64%)' }} />
      </div>
      <div className="fixed inset-0 grid-bg pointer-events-none" style={{ zIndex: 0, opacity: 0.5 }} />

      <div className="relative flex w-full app-shell" style={{ zIndex: 1 }}>
        <Sidebar currentPage={page} onNavigate={setPage} user={user} onLogout={handleLogout} />
        <main className="flex-1 flex flex-col overflow-hidden min-h-screen app-stage">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(5,5,8,0.6)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-3 text-sm font-medium" style={{ color: '#f0f0ff', fontFamily: 'Outfit, sans-serif' }}>
              <span className="status-beacon" aria-hidden="true"><span /></span>
              {page === 'dashboard' && 'System Dashboard'}
              {page === 'chat' && 'AI Chat · RAG Mode'}
              {page === 'documents' && 'Knowledge Base'}
              {page === 'comparison' && 'Document Comparison'}
              {page === 'settings' && 'Workspace Settings'}
              {page === 'api-docs' && 'API Documentation'}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)', fontFamily: 'JetBrains Mono, monospace' }}>
                v2.4.1
              </div>
              <div className="text-xs" style={{ color: '#8888aa', fontFamily: 'JetBrains Mono, monospace' }}>
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
