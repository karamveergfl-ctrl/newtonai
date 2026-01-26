import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/CreditBadge";
import { FEATURE_COSTS } from "@/lib/creditConfig";

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
  MessageSquareText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const studyTools = [
  { id: "pdf-chat", label: "Chat with PDF", icon: MessageSquareText, path: "/pdf-chat", creditKey: "ai_chat" },
  { id: "quiz", label: "AI Quiz", icon: Brain, path: "/tools/quiz", creditKey: "quiz" },
  { id: "flashcards", label: "AI Flashcards", icon: Layers, path: "/tools/flashcards", creditKey: "flashcards" },
  { id: "podcast", label: "AI Podcast", icon: Podcast, path: "/tools/ai-podcast", creditKey: "ai_podcast" },
  { id: "mindmap", label: "Mind Map", icon: Sparkles, path: "/tools/mind-map", creditKey: "mind_map" },
  { id: "lecture", label: "AI Lecture Notes", icon: Mic, path: "/tools/lecture-notes", creditKey: "lecture_notes" },
  { id: "summarizer", label: "AI Summarizer", icon: FileText, path: "/tools/summarizer", creditKey: "summary" },
  { id: "homework", label: "Homework Help", icon: FileQuestion, path: "/tools/homework-help", creditKey: "homework_help" },
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

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar"
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

      <SidebarContent className="flex flex-col">
        {/* Home - Fixed */}
        <SidebarGroup className="py-0 shrink-0">
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

        {/* Study Tools - No scroll, all visible */}
        <SidebarGroup className="mt-2 shrink-0">
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
                          <span className={cn(
                            "flex items-center gap-0.5 text-xs",
                            isActive(tool.path) ? "text-primary-foreground/80" : "text-amber-500"
                          )}>
                            <Coins className="h-3.5 w-3.5" />
                            {FEATURE_COSTS[tool.creditKey] || 5}
                          </span>
                        </>
                      )}
                    </motion.button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className="space-y-1">
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
                  : "gap-3 px-3 py-2",
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

          {/* Credits */}
          <SidebarMenuButton asChild tooltip="Credits">
            <motion.button
              whileHover={{ x: isCollapsed ? 0 : 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/credits")}
              className={cn(
                "flex w-full items-center rounded-lg text-sm font-medium transition-colors",
                isCollapsed 
                  ? "justify-center p-2.5 gap-0" 
                  : "gap-3 px-3 py-2",
                isActive("/credits")
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Coins className={cn("shrink-0", isCollapsed ? "h-4 w-4" : "h-5 w-5")} />
              {!isCollapsed && <span>Credits</span>}
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
                  : "gap-3 px-3 py-2",
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
                  : "gap-3 px-3 py-2",
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
              className="pt-3"
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
