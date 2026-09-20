import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  color?: string;
}

export default function AnimatedCounter({
  target,
  duration = 1200,
  prefix = '',
  suffix = '',
  className = '',
  color = '#f0f0ff',
}: AnimatedCounterProps) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (startTime.current === null) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  const formatted = current.toLocaleString();

  return (
    <span
      className={`inline-block tabular-nums ${className}`}
      style={{
        color,
        fontFamily: "'Outfit', sans-serif",
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
}
