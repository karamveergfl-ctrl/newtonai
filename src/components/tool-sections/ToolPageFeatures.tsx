import { cn } from "@/lib/utils";
import { FeatureItem } from "./toolPromoData";

interface ToolPageFeaturesProps {
  features: FeatureItem[];
  title?: string;
  className?: string;
}

export function ToolPageFeatures({ features, title = "Powerful Features", className }: ToolPageFeaturesProps) {
  return (
    <div className={cn("w-full", className)}>
      <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-8">
        {title}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="group p-5 md:p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div 
                className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-200",
                  `bg-gradient-to-br ${feature.gradient}`
                )}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}