import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Users, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ToolPageWhyUseProps {
  title: string;
  benefits: string[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const benefitVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 12 },
  },
};

export function ToolPageWhyUse({ title, benefits, className }: ToolPageWhyUseProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const cardY = useTransform(scrollYProgress, [0, 1], [40, -20]);
  const starsRotate = useTransform(scrollYProgress, [0, 1], [0, 10]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className={cn("w-full", className)}
    >
      <motion.div 
        style={{ y: cardY }}
        className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8 overflow-hidden relative"
      >
        {/* Decorative gradient orb */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid md:grid-cols-2 gap-8 items-center relative z-10">
          {/* Left side - Main message */}
          <div>
            <motion.h2 
              variants={benefitVariants}
              className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4"
            >
              {title}
            </motion.h2>
            
            <motion.div 
              variants={containerVariants}
              className="space-y-3 mb-6"
            >
              {benefits.map((benefit) => (
                <motion.div
                  key={benefit}
                  variants={benefitVariants}
                  className="flex items-center gap-3"
                >
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20"
                  >
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </motion.div>
                  <span className="text-sm md:text-base text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div variants={benefitVariants}>
              <Button 
                onClick={() => navigate("/pricing")}
                className="gap-2"
              >
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
          
          {/* Right side - Social proof */}
          <motion.div 
            variants={benefitVariants}
            className="flex flex-col items-center md:items-end text-center md:text-right"
          >
            <motion.div 
              style={{ rotate: starsRotate }}
              className="flex items-center gap-1 mb-2"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                </motion.div>
              ))}
            </motion.div>
            
            <p className="text-lg md:text-xl font-display font-bold text-foreground mb-1">
              Study Smarter, Not Harder
            </p>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Trusted by 50,000+ students</span>
            </div>
            
            {/* Platform badges */}
            <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-4">
              {["Web", "Mobile", "Offline"].map((platform, index) => (
                <motion.span
                  key={platform}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-card border border-border/50 text-muted-foreground"
                >
                  {platform}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
