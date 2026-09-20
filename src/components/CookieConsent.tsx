import { useState, useEffect } from 'react';

const STORAGE_KEY = 'nexus_cookie_consent';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

function loadConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(prefs: CookiePreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        background: disabled
          ? 'rgba(255,255,255,0.15)'
          : checked
            ? '#3b82f6'
            : 'rgba(255,255,255,0.1)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{
          transform: checked ? 'translateX(18px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) setVisible(true);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true, timestamp: new Date().toISOString() });
    setVisible(false);
  };

  const acceptSelected = () => {
    saveConsent({ necessary: true, analytics, marketing, timestamp: new Date().toISOString() });
    setVisible(false);
  };

  const rejectAll = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false, timestamp: new Date().toISOString() });
    setVisible(false);
  };

  const categories = [
    { label: 'Strictly Necessary', desc: 'Required for the app to function. Cannot be disabled.', checked: true, disabled: true, onChange: () => {} },
    { label: 'Analytics', desc: 'Help us understand how you use the app so we can improve it.', checked: analytics, disabled: false, onChange: () => setAnalytics(!analytics) },
    { label: 'Marketing', desc: 'Used to deliver relevant ads and measure campaign performance.', checked: marketing, disabled: false, onChange: () => setMarketing(!marketing) },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-4"
      style={{ pointerEvents: 'auto', animation: 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards' }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,30,0.97), rgba(10,10,20,0.99))',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6), 0 0 80px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Gradient top accent */}
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6)' }} />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
              }}
            >
              🍪
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#f0f0ff', fontFamily: 'Outfit, sans-serif' }}>
                We value your privacy
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: '#8888aa', fontFamily: 'Inter, sans-serif' }}>
                We use cookies to improve your experience, analyze usage, and assist with
                our marketing efforts. You can customize your preferences below.
              </p>
            </div>
          </div>

          {/* Details toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs mb-3 transition-colors hover:text-blue-300"
            style={{ color: '#60a5fa', fontFamily: 'Inter, sans-serif' }}
          >
            {showDetails ? '▾ Hide details' : '▸ Manage preferences'}
          </button>

          {/* Cookie categories */}
          {showDetails && (
            <div className="mb-4 space-y-2.5" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              {categories.map(cookie => (
                <div
                  key={cookie.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex-1 mr-3">
                    <div className="text-xs font-medium" style={{ color: '#c4c4e0', fontFamily: 'Inter, sans-serif' }}>
                      {cookie.label}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: '#6b6b8a', fontFamily: 'Inter, sans-serif' }}>
                      {cookie.desc}
                    </div>
                  </div>
                  <Toggle checked={cookie.checked} disabled={cookie.disabled} onChange={cookie.onChange} />
                </div>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={rejectAll}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:brightness-125"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#8888aa',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Reject All
            </button>
            <button
              onClick={acceptSelected}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 hover:brightness-125"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: '#c4c4e0',
                border: '1px solid rgba(255,255,255,0.12)',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Accept Selected
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 hover:brightness-110"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
                fontFamily: 'Outfit, sans-serif',
              }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
