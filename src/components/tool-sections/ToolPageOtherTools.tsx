import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { allTools, ToolId } from "./toolPromoData";

interface ToolPageOtherToolsProps {
  currentToolId: ToolId;
  title?: string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 12 },
  },
};

export function ToolPageOtherTools({ 
  currentToolId, 
  title = "Looking for more study tools?", 
  className 
}: ToolPageOtherToolsProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 1], [30, -30]);
  
  // Filter out current tool and get up to 4 other tools
  const otherTools = allTools
    .filter(tool => tool.id !== currentToolId)
    .slice(0, 4);

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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
      >
        {otherTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => navigate(tool.path)}
              className="group p-5 md:p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
            >
              <motion.div 
                whileHover={{ scale: 1.15, rotate: 5 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl mb-4",
                  `bg-gradient-to-br ${tool.gradient}`
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </motion.div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {tool.name}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {tool.description}
              </p>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 h-auto text-primary hover:text-primary/80 group-hover:translate-x-1 transition-transform"
              >
                Try it <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
