import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { subjectsList } from "./toolPromoData";

interface ToolPageSubjectsProps {
  title?: string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 150, damping: 12 },
  },
};

export function ToolPageSubjects({ title = "Works for All Subjects", className }: ToolPageSubjectsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className={cn("w-full", className)}
    >
      <motion.h2 
        style={{ y: titleY }}
        className="text-2xl md:text-3xl font-display font-bold text-center mb-8"
      >
        {title}
      </motion.h2>
      
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4"
      >
        {subjectsList.map((subject, index) => (
          <motion.div
            key={subject.name}
            variants={itemVariants}
            whileHover={{ scale: 1.08, y: -4, rotate: index % 2 === 0 ? 2 : -2 }}
            className="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-default"
          >
            <motion.span 
              className="text-2xl md:text-3xl mb-2"
              whileHover={{ scale: 1.2 }}
            >
              {subject.icon}
            </motion.span>
            <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
              {subject.name}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
