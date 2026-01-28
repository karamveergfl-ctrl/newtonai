import { cn } from "@/lib/utils";
import { StatItem } from "./toolPromoData";

interface ToolPageStatsBarProps {
  stats: StatItem[];
  className?: string;
}

export function ToolPageStatsBar({ stats, className }: ToolPageStatsBarProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center p-4 md:p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 mb-3">
                <Icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <span className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {stat.value}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground text-center mt-1">
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}