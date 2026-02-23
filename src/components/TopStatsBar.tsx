import { useNavigate } from "react-router-dom";
import { GamificationBadge } from "@/components/GamificationBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import Logo from "@/components/Logo";
import { useIsMobile } from "@/hooks/use-mobile";

export function TopStatsBar() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  let sidebarOpen = false;
  try {
    const sidebar = useSidebar();
    sidebarOpen = sidebar.open;
  } catch {}

  const showLogo = isMobile || !sidebarOpen;

  return (
    <div className="sticky top-0 z-40 bg-background/95 border-b border-border/50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hidden md:flex h-8 w-8" />
            {showLogo && <Logo size="xs" showText compact />}
          </div>
          <div className="flex items-center gap-2">
            <GamificationBadge />
            <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-full px-1 py-1">
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
    </div>
  );
}
