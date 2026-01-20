import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
  "bg-yellow-400",
  "bg-orange-400",
  "bg-pink-400",
  "bg-purple-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-red-400",
  "bg-cyan-400",
];

export function ConfettiCelebration({ isActive, onComplete }: ConfettiCelebrationProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      // Generate confetti pieces
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

      // Clear after animation completes
      const timeout = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isActive, onComplete]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className={cn(
                "absolute rounded-sm",
                piece.color
              )}
              style={{
                width: piece.size,
                height: piece.size * 0.6,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
