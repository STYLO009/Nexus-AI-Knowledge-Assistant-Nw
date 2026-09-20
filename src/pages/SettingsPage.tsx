import { useState } from 'react';
import type { User } from '../lib/types';
import DepthCard from '../components/DepthCard';
import Interactive3D from '../components/Interactive3D';

export default function SettingsPage({ user }: { user: User }) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 stagger-3d-1">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>
            Workspace Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8888aa' }}>
            Manage your account and assistant preferences.
          </p>
        </div>

        <DepthCard variant="glass" accent="#60a5fa" padding="1.5rem" className="mb-4 stagger-3d-2">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#f0f0ff', fontFamily: 'Outfit, sans-serif' }}>
            Account
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Interactive3D maxTilt={3} shine={false} glow={false}>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs uppercase tracking-widest" style={{ color: '#8888aa' }}>Name</div>
                <div className="text-sm mt-1" style={{ color: '#c4c4e0' }}>{user.name}</div>
              </div>
            </Interactive3D>
            <Interactive3D maxTilt={3} shine={false} glow={false}>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs uppercase tracking-widest" style={{ color: '#8888aa' }}>Email</div>
                <div className="text-sm mt-1" style={{ color: '#c4c4e0' }}>{user.email}</div>
              </div>
            </Interactive3D>
          </div>
        </DepthCard>

        <DepthCard variant="glass" accent="#8b5cf6" padding="1.5rem" className="stagger-3d-3">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#f0f0ff', fontFamily: 'Outfit, sans-serif' }}>
            Preferences
          </h2>
          <Interactive3D maxTilt={2} shine={false} glow={false}>
            <label
              className="flex items-center justify-between gap-4 py-3 cursor-pointer rounded-xl px-2 transition-colors hover:bg-white/3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span>
                <span className="block text-sm" style={{ color: '#c4c4e0' }}>Email alerts</span>
                <span className="block text-xs mt-1" style={{ color: '#8888aa' }}>
                  Receive notifications when documents finish indexing.
                </span>
              </span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={e => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          </Interactive3D>
          <Interactive3D maxTilt={2} shine={false} glow={false}>
            <label
              className="flex items-center justify-between gap-4 py-3 cursor-pointer rounded-xl px-2 transition-colors hover:bg-white/3"
            >
              <span>
                <span className="block text-sm" style={{ color: '#c4c4e0' }}>Compact workspace</span>
                <span className="block text-xs mt-1" style={{ color: '#8888aa' }}>
                  Use denser spacing across document and chat views.
                </span>
              </span>
              <input
                type="checkbox"
                checked={compactMode}
                onChange={e => setCompactMode(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          </Interactive3D>
        </DepthCard>
      </div>
    </div>
  );
}
