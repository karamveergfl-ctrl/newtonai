import { GamificationBadge } from "@/components/GamificationBadge";
import { CreditBalance } from "@/components/CreditBalance";

export function TopStatsBar() {
  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GamificationBadge />
            <CreditBalance showLabel />
          </div>
        </div>
      </div>
    </div>
  );
}
