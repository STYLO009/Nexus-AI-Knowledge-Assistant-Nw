import { useEffect, useRef, useState } from 'react';
import type { User } from '../lib/types';
import { authenticateWithGoogle } from '../lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void;
        };
      };
    };
  }
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: response => {
          setLoading(true);
          setError('');
          authenticateWithGoogle(response.credential)
            .then(onLogin)
            .catch(() => setError('Google sign-in could not be verified. Please try again.'))
            .finally(() => setLoading(false));
        },
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'filled_black', size: 'large', width: 350 });
    };
    if (window.google) renderGoogleButton();
    else window.setTimeout(renderGoogleButton, 500);
  }, [googleClientId, onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 700));
    if (!email || password.length < 6) {
      setError('Enter a valid email and a password with at least 6 characters.');
      setLoading(false);
      return;
    }
    if (mode === 'signup' && (!name.trim() || password !== confirmPassword)) {
      setError(!name.trim() ? 'Enter your name to create an account.' : 'Passwords do not match.');
      setLoading(false);
      return;
    }
    if (email && password.length >= 6) {
      onLogin({
        id: `${mode}-${Date.now()}`,
        email,
        name: mode === 'signup' ? name.trim() : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        role: 'user',
      });
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="w-full max-w-md fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 30px rgba(59,130,246,0.5)' }}>
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>N</span>
          </div>
          <h1 className="text-3xl font-bold mb-1 gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>Nexus AI</h1>
          <p className="text-sm" style={{ color: '#8888aa' }}>Knowledge Assistant Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}>
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0f0ff',
                  fontFamily: 'Inter, sans-serif',
                }}
                placeholder="you@company.ai"
                required
              />
            </div>
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0ff', fontFamily: 'Inter, sans-serif' }}
                  placeholder="Repeat your password"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0f0ff',
                  fontFamily: 'Inter, sans-serif',
                }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 mt-2 relative overflow-hidden"
              style={{
                background: loading ? 'rgba(59,130,246,0.4)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: '#ffffff',
                fontFamily: 'Outfit, sans-serif',
                boxShadow: loading ? 'none' : '0 0 20px rgba(59,130,246,0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs" style={{ color: '#8888aa' }}>
            <span className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
            OR CONTINUE WITH
            <span className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
          </div>
          {googleClientId ? (
            <div ref={googleButtonRef} className="flex justify-center min-h-10" />
          ) : (
            <div className="text-center text-xs" style={{ color: '#8888aa' }}>Google sign-in requires `VITE_GOOGLE_CLIENT_ID`.</div>
          )}

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="w-full text-xs transition-colors hover:text-blue-300" style={{ color: '#8888aa' }}>
              {mode === 'signin' ? 'New to Nexus AI? Create an account' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        {/* Features strip */}
        <div className="flex items-center justify-center gap-6 mt-6 text-xs" style={{ color: 'rgba(136,136,170,0.6)' }}>
          {['RAG-Powered', 'End-to-End Encrypted', 'SOC 2 Ready'].map(f => (
            <span key={f} className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full" style={{ background: '#3b82f6' }} />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
