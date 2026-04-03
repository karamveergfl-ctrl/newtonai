import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useScrollContext } from "@/contexts/ScrollContext";
import { SubscriptionTierBadge } from "@/components/SubscriptionTierBadge";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserNotifications } from "@/hooks/useUserNotifications";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  FileQuestion,
  Layers,
  Brain,
  FileText,
  Mic,
  Sparkles,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Podcast,
  BarChart3,
  Users,
  MessageSquare,
  Shield,
  Gift,
  MessageSquareText,
  Grid3X3,
  TrendingUp,
  CreditCard,
  HelpCircle,
  BookOpen,
  School,
  GraduationCap,
  Building2,
  Award,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const studyTools = [
  { id: "quiz", label: "AI Quiz", icon: Brain, path: "/tools/quiz" },
  { id: "flashcards", label: "AI Flashcards", icon: Layers, path: "/tools/flashcards" },
  { id: "podcast", label: "AI Podcast", icon: Podcast, path: "/tools/ai-podcast" },
  { id: "pdf-chat", label: "Chat with PDF", icon: MessageSquareText, path: "/pdf-chat" },
  { id: "mindmap", label: "Mind Map", icon: Sparkles, path: "/tools/mind-map" },
  { id: "lecture", label: "AI Lecture Notes", icon: Mic, path: "/tools/lecture-notes" },
  { id: "summarizer", label: "AI Summarizer", icon: FileText, path: "/tools/summarizer" },
  { id: "homework", label: "Homework Help", icon: FileQuestion, path: "/tools/homework-help" },
];

const adminTools = [
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "inquiries", label: "Inquiries", icon: MessageSquare, path: "/admin/inquiries" },
  { id: "redeem-codes", label: "Redeem Codes", icon: Gift, path: "/admin/redeem-codes" },
];

const exploreLinks = [
  { id: "all-tools", label: "All Tools", icon: Grid3X3, path: "/tools" },
  { id: "compare", label: "Compare", icon: TrendingUp, path: "/compare", isNew: true },
  { id: "pricing", label: "Pricing", icon: CreditCard, path: "/pricing" },
  { id: "faq", label: "FAQ", icon: HelpCircle, path: "/faq" },
  { id: "blog", label: "Blog", icon: BookOpen, path: "/blog" },
];

interface AppSidebarProps {
  onToolSelect?: (tool: string) => void;
  onSignOut?: () => void;
}

export function AppSidebar({ onToolSelect, onSignOut }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isAdmin } = useAdminAccess();
  const { isTeacher, isStudent, isInstitutionalAdmin, loading: roleLoading } = useUserRole();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  
  // Get scroll state from context - safely handle when not in provider
  let hasScrolled = false;
  try {
    const scrollContext = useScrollContext();
    hasScrolled = scrollContext.hasScrolled;
  } catch {
    // Not wrapped in ScrollProvider, default to not scrolled
  }

  // Fetch user's subscription tier
  useEffect(() => {
    const fetchTier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_tier")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.subscription_tier) {
          setSubscriptionTier(profile.subscription_tier);
        }
      }
    };
    fetchTier();
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const isActive = (path: string) => location.pathname === path;

  // Shared button class builder
  const btnClass = (path?: string) =>
    cn(
      "flex w-full items-center rounded-lg text-sm font-medium transition-all duration-150",
      isCollapsed
        ? "justify-center p-2.5 gap-0"
        : "gap-3 px-3 py-1.5 hover:translate-x-1 active:scale-[0.98]",
      path && isActive(path)
        ? "bg-primary/15 text-primary"
        : "text-sidebar-foreground hover:bg-sidebar-accent"
    );

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
    >
      <SidebarHeader className="px-3 pt-3 pb-0">
        <div className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && <Logo size="sm" showText={true} />}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex flex-col">
        {/* Home */}
        <SidebarGroup className="pt-2 shrink-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")} tooltip="Home">
                  <button onClick={() => navigate("/dashboard")} className={btnClass("/dashboard")}>
                    <Home className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                    {!isCollapsed && <span>Home</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* My Classes - Role-aware */}
        {!roleLoading && (isTeacher || isStudent) && (
          <SidebarGroup className="-mt-1 pt-0 shrink-0">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <School className="h-3 w-3" />
                {isTeacher ? "Teacher" : "My Classes"}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {isTeacher ? (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="My Classes">
                        <button onClick={() => navigate("/teacher")} className={btnClass("/teacher")}>
                          <GraduationCap className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && (
                            <span className="flex items-center gap-2">
                              My Classes
                            </span>
                          )}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Analytics">
                        <button onClick={() => navigate("/teacher/analytics")} className={btnClass("/teacher/analytics")}>
                          <BarChart3 className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && <span>Analytics</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Students">
                        <button onClick={() => navigate("/teacher/students")} className={btnClass("/teacher/students")}>
                          <Users className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && <span>Students</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Materials">
                        <button onClick={() => navigate("/teacher/materials")} className={btnClass("/teacher/materials")}>
                          <ScrollText className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && <span>Materials</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Newton Chat">
                        <button onClick={() => navigate("/teacher/newton-chat")} className={btnClass("/teacher/newton-chat")}>
                          <MessageSquare className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && <span>Newton Chat</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                ) : (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Dashboard">
                        <button onClick={() => navigate("/student/dashboard")} className={btnClass("/student/dashboard")}>
                          <Home className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && <span>Dashboard</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="My Classes">
                        <button onClick={() => navigate("/student/classes")} className={btnClass("/student/classes")}>
                          <GraduationCap className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && <span>My Classes</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Join Class">
                        <button onClick={() => navigate("/join-class")} className={btnClass("/join-class")}>
                          <Sparkles className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                          {!isCollapsed && <span>Join Class</span>}
                        </button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Study Tools */}
        <SidebarGroup className="-mt-1 pt-0 shrink-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Study Tools
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {studyTools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton asChild tooltip={tool.label}>
                    <button onClick={() => navigate(tool.path)} className={btnClass(tool.path)}>
                      <tool.icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>{tool.label}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Explore Section - CSS transition instead of framer-motion */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            hasScrolled ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0"
          )}
        >
          <SidebarGroup className="mt-2 shrink-0">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Explore
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {exploreLinks.map((link) => (
                  <SidebarMenuItem key={link.id}>
                    <SidebarMenuButton asChild tooltip={link.label}>
                      <button onClick={() => navigate(link.path)} className={btnClass(link.path)}>
                        <link.icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{link.label}</span>
                            {link.isNew && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                                NEW
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Institution Section */}
        {!roleLoading && isInstitutionalAdmin && (
          <SidebarGroup className="mt-2 shrink-0">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Institution
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Institution Dashboard">
                    <button onClick={() => navigate("/institution")} className={btnClass("/institution")}>
                      <Building2 className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Dashboard</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Departments">
                    <button onClick={() => navigate("/institution/departments")} className={btnClass("/institution/departments")}>
                      <Layers className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Departments</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Courses">
                    <button onClick={() => navigate("/institution/courses")} className={btnClass("/institution/courses")}>
                      <BookOpen className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Courses</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Academic Records">
                    <button onClick={() => navigate("/institution/academic-records")} className={btnClass("/institution/academic-records")}>
                      <GraduationCap className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Academic Records</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Analytics">
                    <button onClick={() => navigate("/institution/analytics")} className={btnClass("/institution/analytics")}>
                      <BarChart3 className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Analytics</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Results">
                    <button onClick={() => navigate("/institution/results")} className={btnClass("/institution/results")}>
                      <Award className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Results</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Faculty">
                    <button onClick={() => navigate("/institution/faculty")} className={btnClass("/institution/faculty")}>
                      <Users className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Faculty</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Compliance">
                    <button onClick={() => navigate("/institution/compliance")} className={btnClass("/institution/compliance")}>
                      <Shield className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Compliance</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Billing">
                    <button onClick={() => navigate("/institution/billing")} className={btnClass("/institution/billing")}>
                      <CreditCard className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>Billing</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup className="mt-2 shrink-0">
            {!isCollapsed && (
              <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminTools.map((tool) => (
                  <SidebarMenuItem key={tool.id}>
                    <SidebarMenuButton asChild tooltip={tool.label}>
                      <button onClick={() => navigate(tool.path)} className={btnClass(tool.path)}>
                        <tool.icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                        {!isCollapsed && <span>{tool.label}</span>}
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <div className="space-y-1">
          {/* Subscription Tier Badge with Upgrade CTA */}
          {!isCollapsed && (
            <div className="px-3 py-2 flex items-center gap-2">
              <SubscriptionTierBadge tier={subscriptionTier} size="sm" />
              {subscriptionTier === "free" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/pricing")}
                  className="h-6 px-2 text-xs font-medium text-primary hover:text-primary hover:bg-primary/10"
                >
                  Upgrade
                </Button>
              )}
            </div>
          )}
          
          {/* Theme Toggle */}
          <SidebarMenuButton asChild tooltip="Toggle Theme">
            <button
              onClick={toggleTheme}
              className={cn(
                "flex w-full items-center rounded-lg text-sm font-medium transition-all duration-150",
                isCollapsed
                  ? "justify-center p-2.5 gap-0"
                  : "gap-3 px-3 py-1.5 hover:translate-x-1 active:scale-[0.98]",
                "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              {theme === "light" ? (
                <Moon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              ) : (
                <Sun className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              )}
              {!isCollapsed && <span>Theme</span>}
            </button>
          </SidebarMenuButton>

          {/* Profile */}
          <SidebarMenuButton asChild tooltip="Profile">
            <button onClick={() => navigate("/profile")} className={btnClass("/profile")}>
              <User className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              {!isCollapsed && <span>Profile</span>}
            </button>
          </SidebarMenuButton>

          {/* Sign Out */}
          <SidebarMenuButton asChild tooltip="Sign Out">
            <button
              onClick={onSignOut}
              className={cn(
                "flex w-full items-center rounded-lg text-sm font-medium transition-all duration-150",
                isCollapsed
                  ? "justify-center p-2.5 gap-0"
                  : "gap-3 px-3 py-1.5 hover:translate-x-1 active:scale-[0.98]",
                "text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
              )}
            >
              <LogOut className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </SidebarMenuButton>

          {/* Get Started Button */}
          {!isCollapsed && (
            <div className="pt-2">
              <Button
                onClick={() => navigate("/pricing")}
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
