import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { StatItem } from "./toolPromoData";

interface ToolPageStatsBarProps {
  stats: StatItem[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 12 },
  },
};

export function ToolPageStatsBar({ stats, className }: ToolPageStatsBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const iconY = useTransform(scrollYProgress, [0, 1], [20, -20]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className={cn("w-full", className)}
    >
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="flex flex-col items-center justify-center p-4 md:p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <motion.div 
                style={{ y: iconY }}
                className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 mb-3"
              >
                <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </motion.div>
              <span className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {stat.value}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground text-center mt-1">
                {stat.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
