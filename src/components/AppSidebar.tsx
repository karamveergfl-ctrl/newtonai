import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Notebook,
  Layers,
  Brain,
  FileText,
  Video,
  Mic,
  Sparkles,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FEATURE_COSTS } from "@/lib/creditConfig";
import { useCredits } from "@/hooks/useCredits";

const studyTools = [
  { id: "homework", label: "Homework Help", icon: FileQuestion, path: "/tools/homework-help", feature: "homework_help" },
  { id: "notes", label: "AI Notes", icon: Notebook, path: "/tools/ai-notes", feature: "ai_notes" },
  { id: "flashcards", label: "AI Flashcards", icon: Layers, path: "/tools/flashcards", feature: "flashcards" },
  { id: "quiz", label: "AI Quiz", icon: Brain, path: "/tools/quiz", feature: "quiz" },
  { id: "pdf", label: "PDF Summarizer", icon: FileText, path: "/tools/pdf-summarizer", feature: "summary" },
  { id: "video", label: "Video Summarizer", icon: Video, path: "/tools/video-summarizer", feature: "summary" },
  { id: "lecture", label: "AI Lecture Notes", icon: Mic, path: "/tools/lecture-notes", feature: "lecture_notes" },
  { id: "mindmap", label: "Mind Map", icon: Sparkles, path: "/tools/mind-map", feature: "mind_map" },
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
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <Logo size="sm" showText={!isCollapsed} />
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

        {/* Search Bar */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 bg-sidebar-accent/50 border-sidebar-border"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Home */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/dashboard")}
              tooltip="Home"
            >
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/dashboard")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive("/dashboard")
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                )}
              >
                <Home className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>Home</span>}
              </motion.button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Study Tools */}
        <SidebarGroup className="mt-4">
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
                          whileHover={{ x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(tool.path)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                            isActive(tool.path)
                              ? "bg-primary text-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent"
                          )}
                        >
                          <tool.icon className="h-5 w-5 shrink-0" />
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
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="space-y-2">
          {/* Theme Toggle */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <ThemeToggle />
            {!isCollapsed && (
              <span className="text-sm text-sidebar-foreground">Theme</span>
            )}
          </div>

          {/* Profile */}
          <SidebarMenuButton asChild tooltip="Profile">
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/profile")}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
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
