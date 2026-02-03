import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveformProps {
  isActive: boolean;
  type: 'listening' | 'speaking';
  className?: string;
}

export function VoiceWaveform({ isActive, type, className }: VoiceWaveformProps) {
  const [bars, setBars] = useState<number[]>([0.3, 0.5, 0.7, 0.5, 0.3]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isActive) {
      setBars([0.3, 0.3, 0.3, 0.3, 0.3]);
      return;
    }

    const animate = () => {
      setBars(prev => 
        prev.map(() => 0.2 + Math.random() * 0.8)
      );
      animationRef.current = requestAnimationFrame(() => {
        setTimeout(animate, 100);
      });
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  const barColor = type === 'listening' 
    ? 'bg-primary' 
    : 'bg-green-500';

  return (
    <div className={cn('flex items-center justify-center gap-1 h-8', className)}>
      {bars.map((height, index) => (
        <div
          key={index}
          className={cn(
            'w-1 rounded-full transition-all duration-100',
            barColor,
            !isActive && 'opacity-40'
          )}
          style={{ 
            height: `${height * 100}%`,
            minHeight: '4px',
          }}
        />
      ))}
    </div>
  );
}
