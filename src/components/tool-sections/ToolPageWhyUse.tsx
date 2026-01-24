import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, Users, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ToolPageWhyUseProps {
  title: string;
  benefits: string[];
  className?: string;
}

export function ToolPageWhyUse({ title, benefits, className }: ToolPageWhyUseProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn("w-full", className)}
    >
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Left side - Main message */}
          <div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-4">
              {title}
            </h2>
            
            <div className="space-y-3 mb-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/20">
                    <CheckCircle className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm md:text-base text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>
            
            <Button 
              onClick={() => navigate("/pricing")}
              className="gap-2"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Right side - Social proof */}
          <div className="flex flex-col items-center md:items-end text-center md:text-right">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            
            <p className="text-lg md:text-xl font-display font-bold text-foreground mb-1">
              Study Smarter, Not Harder
            </p>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Trusted by 50,000+ students</span>
            </div>
            
            {/* Platform badges */}
            <div className="flex flex-wrap justify-center md:justify-end gap-2 mt-4">
              {["Web", "Mobile", "Offline"].map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-card border border-border/50 text-muted-foreground"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
