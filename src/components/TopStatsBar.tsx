import { useNavigate } from "react-router-dom";
import { GamificationBadge } from "@/components/GamificationBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function TopStatsBar() {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile hamburger menu */}
            <SidebarTrigger className="md:hidden h-8 w-8" />
            {/* Bracket-style separator - mobile only */}
            <div className="md:hidden h-6 w-[3px] rounded-full bg-primary/20" />
            <GamificationBadge />
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-full px-1 py-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/profile")}
              className="h-8 w-8 rounded-full hover:bg-accent"
            >
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
