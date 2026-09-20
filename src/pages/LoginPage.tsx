import { useEffect, useRef, useState } from 'react';
import type { User } from '../lib/types';
import { authenticateWithGoogle } from '../lib/api';
import Interactive3D from '../components/Interactive3D';
import DepthCard from '../components/DepthCard';
import MagneticButton from '../components/MagneticButton';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; width: number }
          ) => void;
        };
      };
    };
  }
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

function OrbitalHero() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-8" style={{ perspective: '600px' }}>
      {/* Central logo */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <Interactive3D maxTilt={20} glow glowColor="rgba(59,130,246,0.3)">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 48%, #7c3aed 100%)',
              boxShadow: '0 0 40px rgba(59,130,246,0.5), 0 0 80px rgba(139,92,246,0.3), inset 0 2px 0 rgba(255,255,255,0.3)',
              transform: 'rotateX(10deg) rotateY(-10deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <span
              className="text-3xl font-bold text-white"
              style={{ fontFamily: 'Outfit, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              N
            </span>
          </div>
        </Interactive3D>
      </div>

      {/* Orbiting rings */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="orbit-ring orbit-ring-1">
          <div
            className="absolute w-3 h-3 rounded-full"
            style={{
              top: '-1.5px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#3b82f6',
              boxShadow: '0 0 12px #3b82f6',
            }}
          />
        </div>
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="orbit-ring orbit-ring-2">
          <div
            className="absolute w-2.5 h-2.5 rounded-full"
            style={{
              top: '-1.25px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#8b5cf6',
              boxShadow: '0 0 10px #8b5cf6',
            }}
          />
        </div>
      </div>
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="orbit-ring orbit-ring-3">
          <div
            className="absolute w-2 h-2 rounded-full"
            style={{
              top: '-1px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ec4899',
              boxShadow: '0 0 8px #ec4899',
            }}
          />
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${3 + i}px`,
            height: `${3 + i}px`,
            background: i % 2 === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(139,92,246,0.6)',
            boxShadow: `0 0 ${6 + i * 2}px ${i % 2 === 0 ? 'rgba(59,130,246,0.4)' : 'rgba(139,92,246,0.4)'}`,
            top: `${20 + Math.sin(i * 1.2) * 30}%`,
            left: `${20 + Math.cos(i * 1.2) * 30}%`,
            animation: `float-3d ${4 + i}s ease-in-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
    </div>
  );
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
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'filled_black',
        size: 'large',
        width: 350,
      });
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
        name:
          mode === 'signup'
            ? name.trim()
            : email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        role: 'user',
      });
    }
  };

  return (
    <div className="min-h-screen grid-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows - enhanced */}
      <div
        className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'drift 14s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'drift 14s ease-in-out infinite alternate-reverse',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.04) 30%, rgba(236,72,153,0.02) 50%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid pointer-events-none" style={{ opacity: 0.3 }} />

      <div className="w-full max-w-md fade-in relative z-10" style={{ perspective: '1200px' }}>
        {/* Orbital Hero */}
        <OrbitalHero />

        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-4xl font-bold mb-2 gradient-text"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            Nexus AI
          </h1>
          <p className="text-sm" style={{ color: '#8888aa' }}>
            Knowledge Assistant Platform
          </p>
        </div>

        {/* Card */}
        <DepthCard variant="frosted" accent="#3b82f6" padding="2rem" className="card-3d">
          <h2
            className="text-lg font-semibold mb-6"
            style={{ fontFamily: 'Outfit, sans-serif', color: '#f0f0ff' }}
          >
            {mode === 'signin' ? 'Sign in to your workspace' : 'Create your workspace'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="stagger-3d-1">
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
                >
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f0f0ff',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div className="stagger-3d-2">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
              >
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
              <div className="stagger-3d-3">
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
                >
                  CONFIRM PASSWORD
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f0f0ff',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  placeholder="Repeat your password"
                  required
                />
              </div>
            )}
            <div className="stagger-3d-3">
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}
              >
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
              <div
                className="text-xs px-3 py-2.5 rounded-xl stagger-3d-4"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                {error}
              </div>
            )}

            <div className="stagger-3d-4">
              <MagneticButton
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {loading ? 'Authenticating…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </MagneticButton>
            </div>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs" style={{ color: '#8888aa' }}>
            <span className="h-px flex-1 glow-divider" />
            <span className="uppercase tracking-widest text-[10px]">OR CONTINUE WITH</span>
            <span className="h-px flex-1 glow-divider" />
          </div>
          {googleClientId ? (
            <div ref={googleButtonRef} className="flex justify-center min-h-10" />
          ) : (
            <div className="text-center text-xs" style={{ color: '#8888aa' }}>
              Google sign-in requires `VITE_GOOGLE_CLIENT_ID`.
            </div>
          )}

          <div
            className="mt-6 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
              }}
              className="w-full text-xs transition-colors hover:text-blue-300"
              style={{ color: '#8888aa' }}
            >
              {mode === 'signin'
                ? 'New to Nexus AI? Create an account'
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </DepthCard>

        {/* Features strip */}
        <div
          className="flex items-center justify-center gap-6 mt-6 text-xs"
          style={{ color: 'rgba(136,136,170,0.6)' }}
        >
          {['RAG-Powered', 'End-to-End Encrypted', 'SOC 2 Ready'].map((f, i) => (
            <span
              key={f}
              className={`flex items-center gap-1.5 stagger-3d-${i + 5}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#34d399',
                  boxShadow: `0 0 6px ${i === 0 ? '#3b82f6' : i === 1 ? '#8b5cf6' : '#34d399'}`,
                }}
              />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
