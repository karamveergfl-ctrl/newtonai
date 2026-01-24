import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { subjectsList } from "./toolPromoData";

interface ToolPageSubjectsProps {
  title?: string;
  className?: string;
}

export function ToolPageSubjects({ title = "Works for All Subjects", className }: ToolPageSubjectsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
        {title}
      </h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
        {subjectsList.map((subject, index) => (
          <motion.div
            key={subject.name}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            whileHover={{ scale: 1.05, y: -2 }}
            className="flex flex-col items-center justify-center p-3 md:p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-default"
          >
            <span className="text-2xl md:text-3xl mb-2">{subject.icon}</span>
            <span className="text-xs md:text-sm font-medium text-foreground text-center leading-tight">
              {subject.name}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
