import { motion } from "framer-motion";
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

export function ToolPageOtherTools({ 
  currentToolId, 
  title = "Looking for more study tools?", 
  className 
}: ToolPageOtherToolsProps) {
  const navigate = useNavigate();
  
  // Filter out current tool and get up to 4 other tools
  const otherTools = allTools
    .filter(tool => tool.id !== currentToolId)
    .slice(0, 4);

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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {otherTools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => navigate(tool.path)}
              className="group p-5 md:p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform group-hover:scale-110",
                `bg-gradient-to-br ${tool.gradient}`
              )}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              
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
      </div>
    </motion.div>
  );
}
