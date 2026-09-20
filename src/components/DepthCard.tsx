import { type ReactNode, type CSSProperties } from 'react';
import Interactive3D from './Interactive3D';

interface DepthCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Card variant */
  variant?: 'glass' | 'solid' | 'neon' | 'frosted';
  /** Accent color for glow effects */
  accent?: string;
  /** Enable floating animation */
  float?: boolean;
  /** Enable edge light effect */
  edgeLight?: boolean;
  /** Padding */
  padding?: string;
}

const variantStyles: Record<string, CSSProperties> = {
  glass: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
    backdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  solid: {
    background: 'linear-gradient(145deg, rgba(15,15,30,0.95), rgba(10,10,20,0.98))',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  neon: {
    background: 'linear-gradient(135deg, rgba(15,15,30,0.9), rgba(10,10,20,0.95))',
    border: '1px solid rgba(59,130,246,0.3)',
    boxShadow: '0 0 20px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  frosted: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
    backdropFilter: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.12)',
  },
};

export default function DepthCard({
  children,
  className = '',
  style,
  variant = 'glass',
  accent = '#3b82f6',
  float = false,
  edgeLight = true,
  padding = '1.5rem',
}: DepthCardProps) {
  return (
    <Interactive3D
      glow
      glowColor={`${accent}25`}
      shine
      shineColor={`${accent}12`}
      className={`
        relative rounded-2xl overflow-hidden
        ${float ? 'float-slow' : ''}
        ${className}
      `}
      style={{
        ...variantStyles[variant],
        padding,
        ...style,
      }}
    >
      {/* Top edge light */}
      {edgeLight && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
          }}
        />
      )}
      {/* Inner glow on hover */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${accent}08, transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </Interactive3D>
  );
}
