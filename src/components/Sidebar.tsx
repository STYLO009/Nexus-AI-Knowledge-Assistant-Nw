import type { Page, User } from '../lib/types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: User;
  onLogout: () => void;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'chat', label: 'AI Chat', icon: '◎' },
  { id: 'documents', label: 'Documents', icon: '▣' },
  { id: 'comparison', label: 'Compare', icon: '⊞' },
];

export default function Sidebar({ currentPage, onNavigate, user, onLogout }: SidebarProps) {
  return (
    <aside className="flex flex-col w-64 min-h-screen shrink-0" style={{
      background: 'rgba(5,5,8,0.95)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="logo-cube" aria-hidden="true">
            <span>N</span>
          </div>
          <div>
            <div className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>Nexus AI</div>
            <div className="text-xs" style={{ color: '#8888aa' }}>Knowledge Assistant</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: active ? '#60a5fa' : '#8888aa',
                border: active ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                boxShadow: active ? '0 0 12px rgba(59,130,246,0.1)' : 'none',
              }}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
              {item.id === 'chat' && (
                <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}>
                  Live
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-widest" style={{ color: 'rgba(136,136,170,0.5)' }}>
            System
          </div>
          <button onClick={() => onNavigate('settings')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:text-white"
            style={{ color: currentPage === 'settings' ? '#60a5fa' : '#8888aa', fontFamily: 'Inter, sans-serif' }}>
            <span>⚙</span> Settings
          </button>
          <button onClick={() => onNavigate('api-docs')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 hover:text-white"
            style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
            <span>?</span> API Docs
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="px-3 pb-4">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            {user.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}>{user.name}</div>
            <div className="text-xs truncate" style={{ color: '#8888aa' }}>{user.role}</div>
          </div>
          <button onClick={onLogout} className="text-xs transition-colors hover:text-red-400" style={{ color: '#8888aa' }} title="Logout">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}
