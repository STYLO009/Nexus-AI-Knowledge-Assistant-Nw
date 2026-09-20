import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react';

interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff',
    boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
  },
  secondary: {
    background: 'rgba(255,255,255,0.08)',
    color: '#c4c4e0',
    border: '1px solid rgba(255,255,255,0.12)',
  },
  ghost: {
    background: 'transparent',
    color: '#8888aa',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  danger: {
    background: 'rgba(239,68,68,0.1)',
    color: '#f87171',
    border: '1px solid rgba(239,68,68,0.2)',
  },
};

const sizeStyles: Record<string, CSSProperties> = {
  sm: { padding: '0.5rem 1rem', fontSize: '0.75rem' },
  md: { padding: '0.625rem 1.5rem', fontSize: '0.875rem' },
  lg: { padding: '0.75rem 2rem', fontSize: '1rem' },
};

export default function MagneticButton({
  children,
  onClick,
  className = '',
  style,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      setOffset({ x: x * 0.15, y: y * 0.15 });
    },
    [disabled, loading]
  );

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    setIsPressed(false);
  }, []);

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative inline-flex items-center justify-center gap-2
        rounded-xl font-medium transition-all duration-200
        cursor-pointer select-none
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        fontFamily: "'Outfit', sans-serif",
        transform: `translate(${offset.x}px, ${offset.y}px) ${isPressed ? 'scale(0.97)' : 'scale(1)'}`,
        transition: 'transform 0.15s ease-out, box-shadow 0.2s ease, opacity 0.2s ease',
        ...(isPressed && variant === 'primary'
          ? { boxShadow: '0 2px 8px rgba(59,130,246,0.3)' }
          : {}),
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {!loading && icon && <span className="text-sm">{icon}</span>}
      {children}
    </button>
  );
}
