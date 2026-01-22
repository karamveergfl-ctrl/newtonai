import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Brain, 
  FileText, 
  Sparkles, 
  Lightbulb,
  GraduationCap,
  PenTool,
  Bookmark,
  Star,
  Zap
} from "lucide-react";

// Floating icon configurations
const floatingIcons = [
  { Icon: BookOpen, color: "text-teal-400/20", size: 24 },
  { Icon: Brain, color: "text-purple-400/20", size: 28 },
  { Icon: FileText, color: "text-pink-400/20", size: 22 },
  { Icon: Sparkles, color: "text-amber-400/20", size: 20 },
  { Icon: Lightbulb, color: "text-yellow-400/20", size: 26 },
  { Icon: GraduationCap, color: "text-blue-400/20", size: 30 },
  { Icon: PenTool, color: "text-emerald-400/20", size: 22 },
  { Icon: Bookmark, color: "text-orange-400/20", size: 24 },
  { Icon: Star, color: "text-fuchsia-400/20", size: 18 },
  { Icon: Zap, color: "text-cyan-400/20", size: 20 },
];

interface Particle {
  id: number;
  x: number;
  y: number;
  icon: typeof floatingIcons[0];
  delay: number;
  duration: number;
  floatRange: number;
  rotateRange: number;
}

const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    icon: floatingIcons[i % floatingIcons.length],
    delay: Math.random() * 5,
    duration: 8 + Math.random() * 8,
    floatRange: 15 + Math.random() * 25,
    rotateRange: 10 + Math.random() * 20,
  }));
};

const FloatingParticle = memo(({ particle }: { particle: Particle }) => {
  const { Icon, color, size } = particle.icon;
  
  return (
    <motion.div
      className={`absolute ${color} pointer-events-none`}
      style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.5],
        y: [0, -particle.floatRange, 0, particle.floatRange, 0],
        x: [0, particle.floatRange * 0.3, 0, -particle.floatRange * 0.3, 0],
        rotate: [-particle.rotateRange, particle.rotateRange, -particle.rotateRange],
      }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Icon size={size} strokeWidth={1.5} />
    </motion.div>
  );
});

FloatingParticle.displayName = "FloatingParticle";

// Dot particle for subtle background texture
const DotParticle = memo(({ delay, x, y }: { delay: number; x: number; y: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-primary/10"
    style={{ left: `${x}%`, top: `${y}%` }}
    animate={{
      opacity: [0.2, 0.6, 0.2],
      scale: [1, 1.5, 1],
    }}
    transition={{
      duration: 3 + Math.random() * 2,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
));

DotParticle.displayName = "DotParticle";

interface HeroParticlesProps {
  iconCount?: number;
  dotCount?: number;
  className?: string;
}

export const HeroParticles = memo(({ 
  iconCount = 12, 
  dotCount = 20,
  className = "" 
}: HeroParticlesProps) => {
  // Memoize particles to prevent regeneration on re-renders
  const iconParticles = useMemo(() => generateParticles(iconCount), [iconCount]);
  const dotParticles = useMemo(() => 
    Array.from({ length: dotCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
    })), 
    [dotCount]
  );

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Floating icon particles */}
      {iconParticles.map((particle) => (
        <FloatingParticle key={particle.id} particle={particle} />
      ))}
      
      {/* Subtle dot particles */}
      {dotParticles.map((dot) => (
        <DotParticle key={dot.id} delay={dot.delay} x={dot.x} y={dot.y} />
      ))}
      
      {/* Additional gradient orbs for depth */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500/5 to-transparent blur-2xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.2, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      <motion.div
        className="absolute top-2/3 left-1/3 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/5 to-transparent blur-xl"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
    </div>
  );
});

HeroParticles.displayName = "HeroParticles";

export default HeroParticles;
