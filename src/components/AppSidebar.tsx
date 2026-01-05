import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const studyTools = [
  { id: "homework", label: "Homework Help", icon: FileQuestion, action: "homework" },
  { id: "notes", label: "AI Notes", icon: Notebook, action: "notes" },
  { id: "flashcards", label: "AI Flashcards", icon: Layers, action: "flashcards" },
  { id: "quiz", label: "AI Quiz", icon: Brain, action: "quiz" },
  { id: "pdf", label: "PDF Summarizer", icon: FileText, action: "summary" },
  { id: "video", label: "Video Summarizer", icon: Video, action: "video" },
  { id: "lecture", label: "AI Lecture Notes", icon: Mic, action: "lecture" },
  { id: "mindmap", label: "Mind Map", icon: Sparkles, action: "mindmap" },
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

  const isActive = (path: string) => location.pathname === path;

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
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* Home */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/")}
              tooltip="Home"
            >
              <motion.button
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/")}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive("/")
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
              {studyTools.map((tool) => (
                <SidebarMenuItem key={tool.id}>
                  <SidebarMenuButton asChild tooltip={tool.label}>
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onToolSelect?.(tool.action)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
                    >
                      <tool.icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span>{tool.label}</span>}
                    </motion.button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
