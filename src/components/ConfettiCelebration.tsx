import { useEffect, useState, useRef } from "react";

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
}

interface ConfettiCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
}

const COLORS = [
  "hsl(45, 93%, 58%)",   // yellow
  "hsl(24, 95%, 53%)",   // orange
  "hsl(330, 80%, 60%)",  // pink
  "hsl(270, 60%, 60%)",  // purple
  "hsl(210, 80%, 60%)",  // blue
  "hsl(140, 60%, 50%)",  // green
  "hsl(0, 75%, 55%)",    // red
  "hsl(190, 80%, 55%)",  // cyan
];

export function ConfettiCelebration({ isActive, onComplete }: ConfettiCelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isActive) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 1.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        size: 6 + Math.random() * 8,
      }));
      setPieces(newPieces);

      const timeout = setTimeout(() => {
        setPieces([]);
        onCompleteRef.current?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}vw`,
            top: -20,
            width: piece.size,
            height: piece.size * 0.6,
            backgroundColor: piece.color,
            borderRadius: 2,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            // @ts-ignore
            "--confetti-rotation": `${piece.rotation + 720}deg`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          70% { opacity: 0.8; }
          100% { transform: translateY(110vh) rotate(var(--confetti-rotation)); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
