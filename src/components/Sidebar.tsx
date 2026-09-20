import { useState } from 'react';
import type { Page, User } from '../lib/types';
import Interactive3D from './Interactive3D';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: User;
  onLogout: () => void;
}

const navItems: { id: Page; label: string; icon: string; color: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡', color: '#3b82f6' },
  { id: 'chat', label: 'AI Chat', icon: '◎', color: '#8b5cf6' },
  { id: 'documents', label: 'Documents', icon: '▣', color: '#34d399' },
  { id: 'comparison', label: 'Compare', icon: '⊞', color: '#f59e0b' },
];

export default function Sidebar({ currentPage, onNavigate, user, onLogout }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside className="flex flex-col w-64 min-h-screen shrink-0 sidebar-depth sidebar-3d relative overflow-hidden">
      {/* Ambient glow behind sidebar */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-0 w-full h-32"
          style={{
            background: 'linear-gradient(180deg, rgba(59,130,246,0.06), transparent)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-full h-32"
          style={{
            background: 'linear-gradient(0deg, rgba(139,92,246,0.04), transparent)',
          }}
        />
      </div>

      {/* Logo */}
      <div className="px-6 py-6 border-b relative z-10" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <Interactive3D maxTilt={8} glow glowColor="rgba(59,130,246,0.2)" shine={false}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="logo-cube" aria-hidden="true">
                <span>N</span>
              </div>
              {/* Orbiting dot */}
              <div
                className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                style={{
                  background: '#34d399',
                  boxShadow: '0 0 8px #34d399',
                  animation: 'beacon-pulse 2s ease-in-out infinite',
                }}
              />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>
                Nexus AI
              </div>
              <div className="text-xs" style={{ color: '#8888aa' }}>
                Knowledge Assistant
              </div>
            </div>
          </div>
        </Interactive3D>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 relative z-10">
        {navItems.map((item, index) => {
          const active = currentPage === item.id;
          const hovered = hoveredItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`
                sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-300 relative overflow-hidden
                stagger-3d-${index + 1}
              `}
              style={{
                fontFamily: 'Inter, sans-serif',
                background: active
                  ? `linear-gradient(135deg, ${item.color}18, ${item.color}08)`
                  : hovered
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                color: active ? item.color : '#8888aa',
                border: active
                  ? `1px solid ${item.color}30`
                  : '1px solid transparent',
                boxShadow: active ? `0 0 20px ${item.color}15` : 'none',
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
                  style={{
                    background: `linear-gradient(180deg, ${item.color}, ${item.color}80)`,
                    boxShadow: `0 0 8px ${item.color}80`,
                  }}
                />
              )}
              <span className="text-lg leading-none relative z-10">{item.icon}</span>
              <span className="relative z-10">{item.label}</span>
              {item.id === 'chat' && (
                <span
                  className="ml-auto text-xs px-1.5 py-0.5 rounded-full relative z-10 neon-pulse"
                  style={{
                    background: 'rgba(139,92,246,0.2)',
                    color: '#a78bfa',
                    border: '1px solid rgba(139,92,246,0.3)',
                  }}
                >
                  Live
                </span>
              )}
              {/* Hover glow */}
              {hovered && !active && (
                <div
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${item.color}08, transparent 70%)`,
                  }}
                />
              )}
            </button>
          );
        })}

        <div className="pt-4 mt-4 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="px-3 py-2 text-xs font-medium uppercase tracking-widest"
            style={{ color: 'rgba(136,136,170,0.5)' }}
          >
            System
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 hover:text-white stagger-3d-5"
            style={{
              color: currentPage === 'settings' ? '#60a5fa' : '#8888aa',
              fontFamily: 'Inter, sans-serif',
              background: currentPage === 'settings' ? 'rgba(59,130,246,0.1)' : 'transparent',
            }}
          >
            <span>⚙</span> Settings
          </button>
          <button
            onClick={() => onNavigate('api-docs')}
            className="sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 hover:text-white stagger-3d-6"
            style={{
              color: currentPage === 'api-docs' ? '#60a5fa' : '#8888aa',
              fontFamily: 'Inter, sans-serif',
              background: currentPage === 'api-docs' ? 'rgba(59,130,246,0.1)' : 'transparent',
            }}
          >
            <span>?</span> API Docs
          </button>
        </div>
      </nav>

      {/* Glowing divider */}
      <div className="mx-4 glow-divider" />

      {/* User */}
      <div className="px-3 pb-4 pt-3 relative z-10">
        <Interactive3D maxTilt={5} glow={false} shine={false}>
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 relative"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                boxShadow: '0 2px 12px rgba(59,130,246,0.4)',
              }}
            >
              {user.name.charAt(0)}
              {/* Online dot */}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  background: '#34d399',
                  borderColor: '#0a0a14',
                  boxShadow: '0 0 6px #34d399',
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium truncate"
                style={{ color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}
              >
                {user.name}
              </div>
              <div className="text-xs truncate" style={{ color: '#8888aa' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-xs transition-all duration-200 hover:text-red-400 tooltip-3d p-1.5 rounded-lg hover:bg-red-500/10"
              data-tooltip="Sign out"
              style={{ color: '#8888aa' }}
            >
              ⏻
            </button>
          </div>
        </Interactive3D>
      </div>
    </aside>
  );
}
