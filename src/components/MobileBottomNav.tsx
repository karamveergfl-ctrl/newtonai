import { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Camera, LayoutGrid, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import newtonChatAvatar from "@/assets/newton-chat-avatar-sm.webp";
import { getNewtonOpenFn } from "@/lib/newtonOpenRef";

const PUBLIC_ROUTES = ["/", "/auth", "/onboarding", "/pricing", "/about", "/contact", "/privacy", "/terms", "/refund", "/faq", "/features", "/how-it-works", "/blog", "/guides", "/enterprise", "/compare", "/ai-for-students", "/ai-study-assistant", "/ai-notes-generator", "/pdf-study-tool", "/ai-quiz-generator", "/exam-preparation-ai", "/about-newtonai-for-ai"];

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: "newton";
  match?: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    icon: <Home className="w-5 h-5" />,
    path: "/dashboard",
    match: (p) => p === "/dashboard" || p === "/index",
  },
  {
    label: "Snap",
    icon: <Camera className="w-5 h-5" />,
    path: "/tools/homework-help",
    match: (p) => p === "/tools/homework-help",
  },
  {
    label: "Newton",
    icon: null,
    action: "newton",
  },
  {
    label: "Tools",
    icon: <LayoutGrid className="w-5 h-5" />,
    path: "/tools",
    match: (p) => p === "/tools" || (p.startsWith("/tools/") && p !== "/tools/homework-help"),
  },
  {
    label: "Profile",
    icon: <User className="w-5 h-5" />,
    path: "/profile",
    match: (p) => p.startsWith("/profile"),
  },
];

export const MobileBottomNav = memo(function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const isPublicRoute = PUBLIC_ROUTES.some(
    (r) => location.pathname === r || (r !== "/" && location.pathname.startsWith(r + "/"))
  );

  if (!isMobile || isPublicRoute) return null;

  const handleNewtonPress = () => {
    const openFn = getNewtonOpenFn();
    if (openFn) openFn();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-end justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match ? item.match(location.pathname) : false;
          const isNewton = item.action === "newton";

          if (isNewton) {
            return (
              <button
                key="newton"
                onClick={handleNewtonPress}
                className="flex flex-col items-center justify-center min-w-[56px] -mt-3 focus:outline-none"
                aria-label="Open Newton AI"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 mb-0.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden">
                    <img
                      src={newtonChatAvatar}
                      alt="Newton"
                      width={36}
                      height={36}
                      className="w-full h-full object-cover scale-150"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-primary">Newton</span>
              </button>
            );
          }

          return (
            <button
              key={item.label}
              onClick={() => item.path && navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 focus:outline-none transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={item.label}
            >
              <div className={cn("transition-transform duration-200", isActive && "scale-110")}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              <div className={cn(
                "w-1 h-1 rounded-full bg-primary transition-all duration-200",
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
              )} />
            </button>
          );
        })}
      </div>
    </nav>
  );
});
