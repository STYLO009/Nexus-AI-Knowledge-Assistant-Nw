import { useRef, useState, useCallback, type ReactNode, type CSSProperties } from 'react';

interface Interactive3DProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Enable glow effect on hover */
  glow?: boolean;
  /** Glow color */
  glowColor?: string;
  /** Enable scale on hover */
  scale?: boolean;
  /** Perspective value in px */
  perspective?: number;
  /** Enable shine/glare overlay */
  shine?: boolean;
  /** Shine color */
  shineColor?: string;
  /** Disable the effect */
  disabled?: boolean;
}

export default function Interactive3D({
  children,
  className = '',
  style,
  maxTilt = 15,
  glow = true,
  glowColor = 'rgba(59,130,246,0.15)',
  scale = true,
  perspective = 800,
  shine = true,
  shineColor = 'rgba(255,255,255,0.08)',
  disabled = false,
}: Interactive3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)');
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (0.5 - y) * maxTilt;
      const rotateY = (x - 0.5) * maxTilt;
      const translateZ = isHovered ? 20 : 0;

      setTransform(
        `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`
      );
      setGlowPos({ x: x * 100, y: y * 100 });
      setShinePos({ x: x * 100, y: y * 100 });
    },
    [disabled, maxTilt, perspective, isHovered]
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTransform(`perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0)`);
  }, [perspective]);

  const interactiveStyle: CSSProperties = {
    transformStyle: 'preserve-3d',
    transition: isHovered
      ? 'transform 0.1s ease-out, box-shadow 0.3s ease'
      : 'transform 0.5s cubic-bezier(0.16,1,0.3,1), box-shadow 0.5s ease',
    transform,
    willChange: 'transform',
    ...(glow && isHovered
      ? {
          boxShadow: `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.1)`,
        }
      : {}),
    ...(scale && isHovered ? { scale: '1.02' } : {}),
    ...style,
  };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={interactiveStyle}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {/* Shine/glare overlay */}
      {shine && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, ${shineColor}, transparent 60%)`,
              transform: 'translateZ(40px)',
            }}
          />
        </div>
      )}
    </div>
  );
}
