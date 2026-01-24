import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FeatureItem } from "./toolPromoData";

interface ToolPageFeaturesProps {
  features: FeatureItem[];
  title?: string;
  className?: string;
}

export function ToolPageFeatures({ features, title = "Powerful Features", className }: ToolPageFeaturesProps) {
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="group p-5 md:p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all"
            >
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl mb-4 transition-transform group-hover:scale-110",
                `bg-gradient-to-br ${feature.gradient}`
              )}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
