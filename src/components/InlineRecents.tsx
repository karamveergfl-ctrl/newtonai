import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight, FileText, Brain, Layers, Network, Podcast, BookOpen, Sparkles, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type ToolId = "quiz" | "flashcards" | "podcast" | "mind-map" | "notes" | "summarizer" | "homework-help";

interface RecentItem {
  id: string;
  title: string | null;
  tool_name: string;
  created_at: string;
}

interface InlineRecentsProps {
  toolId: ToolId;
  maxItems?: number;
  className?: string;
}

// Map toolId to tool_name in database
const toolIdToDbName: Record<ToolId, string> = {
  "quiz": "quiz",
  "flashcards": "flashcards",
  "podcast": "podcast",
  "mind-map": "mind_map",
  "notes": "lecture_notes",
  "summarizer": "summary",
  "homework-help": "homework_help",
};

// Tool icons and gradients
const toolConfig: Record<string, { icon: React.ElementType; gradient: string }> = {
  "quiz": { icon: Brain, gradient: "from-purple-500 to-violet-500" },
  "flashcards": { icon: Layers, gradient: "from-orange-500 to-amber-500" },
  "podcast": { icon: Podcast, gradient: "from-pink-500 to-rose-500" },
  "mind_map": { icon: Network, gradient: "from-cyan-500 to-blue-500" },
  "lecture_notes": { icon: FileText, gradient: "from-emerald-500 to-green-500" },
  "summary": { icon: BookOpen, gradient: "from-indigo-500 to-purple-500" },
  "homework_help": { icon: HelpCircle, gradient: "from-yellow-500 to-orange-500" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 14 },
  },
};

export function InlineRecents({ toolId, maxItems = 3, className }: InlineRecentsProps) {
  const navigate = useNavigate();
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const dbToolName = toolIdToDbName[toolId];
        const { data, error } = await supabase
          .from("generation_history")
          .select("id, title, tool_name, created_at")
          .eq("user_id", session.user.id)
          .eq("tool_name", dbToolName)
          .order("created_at", { ascending: false })
          .limit(maxItems);

        if (error) throw error;
        setRecents(data || []);
      } catch (error) {
        console.error("Failed to fetch recents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecents();
  }, [toolId, maxItems]);

  // Don't render if no recents and not loading
  if (!loading && recents.length === 0) {
    return null;
  }

  const dbToolName = toolIdToDbName[toolId];
  const config = toolConfig[dbToolName] || { icon: FileText, gradient: "from-primary to-primary/70" };
  const Icon = config.icon;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={cn("mt-6 pt-6 border-t border-border/50", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <motion.h3 
          variants={itemVariants}
          className="text-sm font-semibold text-foreground"
        >
          Your Recent Activity
        </motion.h3>
        <motion.div variants={itemVariants}>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/profile?tab=history")}
            className="text-xs text-primary hover:text-primary/80 h-7 px-2"
          >
            Go to library <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </motion.div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(maxItems)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {recents.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover={{ y: -2, scale: 1.01 }}
              className="p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-primary/30 hover:bg-muted/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div 
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-transform group-hover:scale-105",
                    `bg-gradient-to-br ${config.gradient}`
                  )}
                >
                  <Icon className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {item.title || "Untitled"}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
