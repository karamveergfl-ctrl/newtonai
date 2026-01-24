import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { TrendingUp, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingTopic {
  name: string;
  icon: string;
  count: string;
  gradient: string;
  isHot?: boolean;
}

const trendingTopics: TrendingTopic[] = [
  { name: "Organic Chemistry", icon: "🧪", count: "2.4K", gradient: "from-pink-500 to-rose-500", isHot: true },
  { name: "Calculus II", icon: "∫", count: "1.8K", gradient: "from-blue-500 to-cyan-500", isHot: true },
  { name: "Machine Learning", icon: "🤖", count: "1.5K", gradient: "from-purple-500 to-violet-500" },
  { name: "World History", icon: "🌍", count: "1.2K", gradient: "from-amber-500 to-orange-500" },
  { name: "Molecular Biology", icon: "🧬", count: "980", gradient: "from-emerald-500 to-green-500" },
  { name: "Statistics", icon: "📊", count: "870", gradient: "from-indigo-500 to-blue-500" },
  { name: "Spanish Language", icon: "🇪🇸", count: "750", gradient: "from-red-500 to-orange-500" },
  { name: "Economics 101", icon: "💹", count: "680", gradient: "from-teal-500 to-cyan-500" },
];

interface ToolPageTrendingTopicsProps {
  className?: string;
}

export function ToolPageTrendingTopics({ className }: ToolPageTrendingTopicsProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const titleY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 100, damping: 15 },
    },
  };

  return (
    <section ref={ref} className={cn("relative", className)}>
      {/* Section Header with Parallax */}
      <motion.div 
        style={{ y: titleY }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent mb-4"
        >
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Trending Now</span>
          <Flame className="h-4 w-4 text-destructive animate-pulse" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-2"
        >
          Popular Topics This Week
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-lg mx-auto"
        >
          See what other students are studying right now
        </motion.p>
      </motion.div>

      {/* Trending Topics Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4"
      >
        {trendingTopics.map((topic, index) => (
          <motion.div
            key={topic.name}
            variants={itemVariants}
            whileHover={{ 
              scale: 1.03, 
              y: -4,
              transition: { type: "spring", stiffness: 400, damping: 25 }
            }}
            className="group relative"
          >
            <div className={cn(
              "relative overflow-hidden rounded-xl border border-border/50 bg-card p-4",
              "transition-all duration-300 hover:border-primary/30 hover:shadow-lg",
              "cursor-pointer"
            )}>
              {/* Hot badge */}
              {topic.isHot && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, type: "spring" }}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                >
                  <Flame className="h-3 w-3" />
                  HOT
                </motion.div>
              )}
              
              {/* Background gradient on hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                `bg-gradient-to-br ${topic.gradient}`
              )} />
              
              {/* Content */}
              <div className="relative flex flex-col items-center text-center gap-2">
                <motion.span 
                  className="text-2xl md:text-3xl"
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  {topic.icon}
                </motion.span>
                
                <div>
                  <h3 className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {topic.count} this week
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
