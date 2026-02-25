import { memo, useRef, useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Camera, LayoutGrid, User, School } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import newtonChatAvatar from "@/assets/newton-chat-avatar-sm.webp";
import { getNewtonOpenFn } from "@/lib/newtonOpenRef";
import { supabase } from "@/integrations/supabase/client";

const PUBLIC_ROUTES = ["/", "/auth", "/onboarding", "/pricing", "/about", "/contact", "/privacy", "/terms", "/refund", "/faq", "/features", "/how-it-works", "/blog", "/guides", "/enterprise", "/compare", "/ai-for-students", "/ai-study-assistant", "/ai-notes-generator", "/pdf-study-tool", "/ai-quiz-generator", "/exam-preparation-ai", "/about-newtonai-for-ai"];

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: "newton" | "camera";
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
    label: "Newton",
    icon: null,
    action: "newton",
  },
  {
    label: "Snap",
    icon: <Camera className="w-5 h-5" />,
    action: "camera",
    match: (p) => p === "/tools/homework-help",
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

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const MobileBottomNav = memo(function MobileBottomNav() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isTeacher, isStudent } = useUserRole();

  // Check for active live sessions (student only)
  const [hasLiveSession, setHasLiveSession] = useState(false);
  useEffect(() => {
    if (!isStudent) { setHasLiveSession(false); return; }
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Find any active session in enrolled classes
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("class_id")
        .eq("student_id", user.id)
        .eq("status", "active");
      if (!enrollments || enrollments.length === 0) { setHasLiveSession(false); return; }
      const classIds = enrollments.map((e) => e.class_id);
      const { data: sessions } = await supabase
        .from("live_sessions" as any)
        .select("id")
        .in("class_id", classIds)
        .in("status", ["teaching", "quiz_active"])
        .limit(1);
      setHasLiveSession(!!(sessions && (sessions as unknown[]).length > 0));
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, [isStudent]);

  const isPublicRoute = PUBLIC_ROUTES.some(
    (r) => location.pathname === r || (r !== "/" && location.pathname.startsWith(r + "/"))
  );

  const handleCameraCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      navigate("/tools/homework-help", {
        state: {
          capturedImage: {
            imageBase64: base64.split(",")[1],
            mimeType: file.type,
          },
        },
      });
    } catch (err) {
      console.error("Failed to process captured image:", err);
    }

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [navigate]);

  if (!isMobile || isPublicRoute) return null;

  const handleNewtonPress = () => {
    const openFn = getNewtonOpenFn();
    if (openFn) openFn();
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-background/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />

      <div className="flex items-end justify-around h-16 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.match ? item.match(location.pathname) : false;
          const isCamera = item.action === "camera";
          const isNewton = item.action === "newton";

          {/* Center elevated Camera/Classes button */}
          if (isCamera) {
            // Teachers get a "Classes" tab instead of camera
            if (isTeacher) {
              const classesActive = location.pathname.startsWith("/teacher") || location.pathname.startsWith("/student/class");
              return (
                <button
                  key="classes"
                  onClick={() => navigate("/teacher")}
                  className={cn(
                    "flex flex-col items-center justify-center min-w-[56px] -mt-3 focus:outline-none",
                  )}
                  aria-label="Teacher Dashboard"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center shadow-lg mb-0.5",
                    classesActive
                      ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/25"
                      : "bg-gradient-to-br from-primary to-primary/80 shadow-primary/25"
                  )}>
                    <School className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-[10px] font-medium text-primary">Classes</span>
                </button>
              );
            }

            return (
              <button
                key="camera"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center min-w-[56px] -mt-3 focus:outline-none"
                aria-label="Open Camera"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25 mb-0.5">
                  <Camera className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-medium text-primary">Snap</span>
              </button>
            );
          }

          {/* Newton as regular tab */}
          if (isNewton) {
            return (
              <button
                key="newton"
                onClick={handleNewtonPress}
                className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] gap-0.5 focus:outline-none transition-colors text-muted-foreground"
                aria-label="Open Newton AI"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden">
                  <img
                    src={newtonChatAvatar}
                    alt="Newton"
                    width={24}
                    height={24}
                    className="w-full h-full object-cover scale-150"
                  />
                </div>
                <span className="text-[10px] font-medium">Newton</span>
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
              <div className={cn("relative transition-transform duration-200", isActive && "scale-110")}>
                {item.icon}
                {/* Live session indicator for student Home tab */}
                {hasLiveSession && item.label === "Home" && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
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
