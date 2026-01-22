import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarUsageWidget } from "@/components/SidebarUsageWidget";
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
  Coins,
  Moon,
  Sun,
  Podcast,
  BarChart3,
  Users,
  MessageSquare,
  Shield,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURE_COSTS } from "@/lib/creditConfig";
import { useCredits } from "@/hooks/useCredits";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const studyTools = [
  { id: "quiz", label: "AI Quiz", icon: Brain, path: "/tools/quiz", feature: "quiz" },
  { id: "flashcards", label: "AI Flashcards", icon: Layers, path: "/tools/flashcards", feature: "flashcards" },
  { id: "podcast", label: "AI Podcast", icon: Podcast, path: "/tools/ai-podcast", feature: "ai_podcast" },
  { id: "mindmap", label: "Mind Map", icon: Sparkles, path: "/tools/mind-map", feature: "mind_map" },
  { id: "lecture", label: "AI Lecture Notes", icon: Mic, path: "/tools/lecture-notes", feature: "lecture_notes" },
  { id: "summarizer", label: "AI Summarizer", icon: FileText, path: "/tools/summarizer", feature: "summary" },
  { id: "homework", label: "Homework Help", icon: FileQuestion, path: "/tools/homework-help", feature: "homework_help" },
];

const adminTools = [
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
  { id: "users", label: "Users", icon: Users, path: "/admin/users" },
  { id: "inquiries", label: "Inquiries", icon: MessageSquare, path: "/admin/inquiries" },
  { id: "redeem-codes", label: "Redeem Codes", icon: Gift, path: "/admin/redeem-codes" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const { isPremium } = useCredits();
  const { isAdmin } = useAdminAccess();
  const [theme, setTheme] = useState<"light" | "dark">("light");

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

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return studyTools;
    const query = searchQuery.toLowerCase();
    return studyTools.filter(
      (tool) =>
        tool.label.toLowerCase().includes(query) ||
        tool.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar-background"
    >
      <SidebarHeader className="p-3">
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

      <SidebarContent className="overflow-hidden">
        {/* Home */}
        <SidebarGroup className="py-0">
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
                        : "gap-3 px-3 py-2",
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

        {/* Study Tools */}
        <SidebarGroup className="mt-0">
          {!isCollapsed && (
            <SidebarGroupLabel className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Study Tools
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <AnimatePresence mode="popLayout">
                {filteredTools.map((tool) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    layout
                  >
                    <SidebarMenuItem>
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
                          {!isCollapsed && (
                            <>
                              <span className="flex-1">{tool.label}</span>
                              {!isPremium && FEATURE_COSTS[tool.feature] && (
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 h-5 font-medium gap-0.5",
                                    isActive(tool.path) 
                                      ? "bg-primary-foreground/20 text-primary-foreground" 
                                      : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                  )}
                                >
                                  <Coins className="h-3 w-3" />
                                  {FEATURE_COSTS[tool.feature]}
                                </Badge>
                              )}
                            </>
                          )}
                        </motion.button>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredTools.length === 0 && !isCollapsed && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No tools found
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <SidebarGroup className="mt-0">
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

        {/* Usage Summary Widget */}
        <SidebarGroup className="mt-auto pt-2 border-t border-sidebar-border">
          <SidebarUsageWidget isCollapsed={isCollapsed} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="space-y-0.5">
          {/* Theme Toggle - styled like other menu buttons */}
          <SidebarMenuButton asChild tooltip="Toggle Theme">
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={toggleTheme}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 shrink-0" />
              ) : (
                <Sun className="h-5 w-5 shrink-0" />
              )}
              {!isCollapsed && <span>Theme</span>}
            </motion.button>
          </SidebarMenuButton>

          {/* Credits */}
          <SidebarMenuButton asChild tooltip="Credits">
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/credits")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive("/credits")
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Coins className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Credits</span>}
            </motion.button>
          </SidebarMenuButton>

          {/* Profile */}
          <SidebarMenuButton asChild tooltip="Profile">
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/profile")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive("/profile")
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <User className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Profile</span>}
            </motion.button>
          </SidebarMenuButton>

          {/* Sign Out */}
          <SidebarMenuButton asChild tooltip="Sign Out">
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>Sign Out</span>}
            </motion.button>
          </SidebarMenuButton>

          {/* Get Started Button */}
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-1"
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
