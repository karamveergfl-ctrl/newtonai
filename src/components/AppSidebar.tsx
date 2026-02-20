import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useScrollContext } from "@/contexts/ScrollContext";
import { SubscriptionTierBadge } from "@/components/SubscriptionTierBadge";
import { supabase } from "@/integrations/supabase/client";

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
        {/* Home - Fixed */}
        <SidebarGroup className="pt-2 shrink-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={isActive("/dashboard")}
                  tooltip="Home"
                >
                  <motion.button
                    whileHover={{ x: isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/dashboard")}
                    className={cn(
                      "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                      isCollapsed 
                        ? "justify-center p-2.5 gap-0" 
                        : "gap-3 px-3 py-1.5",
                      isActive("/dashboard")
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    )}
                  >
                    <Home className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                    {!isCollapsed && <span>Home</span>}
                  </motion.button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Study Tools - No scroll, all visible */}
        <SidebarGroup className="mt-0 pt-0 shrink-0">
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
                    <motion.button
                      whileHover={{ x: isCollapsed ? 0 : 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(tool.path)}
                      className={cn(
                        "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                        isCollapsed 
                          ? "justify-center p-2.5 gap-0" 
                          : "gap-3 px-3 py-1.5",
                        isActive(tool.path)
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <tool.icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                      {!isCollapsed && <span>{tool.label}</span>}
                    </motion.button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Explore Section - Only visible when scrolled */}
        <AnimatePresence>
          {hasScrolled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
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
                          <motion.button
                            whileHover={{ x: isCollapsed ? 0 : 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate(link.path)}
                            className={cn(
                              "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                              isCollapsed 
                                ? "justify-center p-2.5 gap-0" 
                                : "gap-3 px-3 py-2",
                              isActive(link.path)
                                ? "bg-primary text-primary-foreground"
                                : "text-sidebar-foreground hover:bg-sidebar-accent"
                            )}
                          >
                            <link.icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                            {!isCollapsed && (
                              <>
                                <span className="flex-1">{link.label}</span>
                                {link.isNew && (
                                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    NEW
                                  </span>
                                )}
                              </>
                            )}
                          </motion.button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Section - Only visible to admins */}
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
                      <motion.button
                        whileHover={{ x: isCollapsed ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(tool.path)}
                        className={cn(
                          "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                          isCollapsed 
                            ? "justify-center p-2.5 gap-0" 
                            : "gap-3 px-3 py-2",
                          isActive(tool.path)
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent"
                        )}
                      >
                        <tool.icon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
                        {!isCollapsed && <span>{tool.label}</span>}
                      </motion.button>
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
            <motion.button
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className={cn(
                "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                isCollapsed 
                  ? "justify-center p-2.5 gap-0" 
                  : "gap-3 px-3 py-1.5",
                "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              {theme === "light" ? (
                <Moon className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              ) : (
                <Sun className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              )}
              {!isCollapsed && <span>Theme</span>}
            </motion.button>
          </SidebarMenuButton>


          {/* Profile */}
          <SidebarMenuButton asChild tooltip="Profile">
            <motion.button
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/profile")}
              className={cn(
                "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                isCollapsed 
                  ? "justify-center p-2.5 gap-0" 
                  : "gap-3 px-3 py-1.5",
                isActive("/profile")
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <User className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              {!isCollapsed && <span>Profile</span>}
            </motion.button>
          </SidebarMenuButton>

          {/* Sign Out */}
          <SidebarMenuButton asChild tooltip="Sign Out">
            <motion.button
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSignOut}
              className={cn(
                "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                isCollapsed 
                  ? "justify-center p-2.5 gap-0" 
                  : "gap-3 px-3 py-1.5",
                "text-sidebar-foreground hover:bg-destructive hover:text-destructive-foreground"
              )}
            >
              <LogOut className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              {!isCollapsed && <span>Sign Out</span>}
            </motion.button>
          </SidebarMenuButton>

          {/* Get Started Button */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-2"
            >
              <Button
                onClick={() => navigate("/pricing")}
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent text-white font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get Started
              </Button>
            </motion.div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
