import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Clock, ArrowRight, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ToolId, allTools } from "./toolPromoData";

interface RecentItem {
  id: string;
  title: string | null;
  tool_name: string;
  created_at: string;
}

interface ToolPageRecentsProps {
  toolId: ToolId;
  title?: string;
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 12 },
  },
};

export function ToolPageRecents({ toolId, title = "Your Recent Activity", className }: ToolPageRecentsProps) {
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
          .limit(6);

        if (error) throw error;
        setRecents(data || []);
      } catch (error) {
        console.error("Failed to fetch recents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecents();
  }, [toolId]);

  // Don't render if no recents and not loading
  if (!loading && recents.length === 0) {
    return null;
  }

  const toolInfo = allTools.find(t => t.id === toolId);

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className={cn("w-full", className)}
    >
      <div className="flex items-center justify-between mb-6">
        <motion.h2 
          variants={itemVariants}
          className="text-xl md:text-2xl font-display font-bold"
        >
          {title}
        </motion.h2>
        <motion.div variants={itemVariants}>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/profile?tab=history")}
            className="text-primary hover:text-primary/80"
          >
            Go to library <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
        >
          {recents.map((item) => {
            const Icon = toolInfo?.icon || FileText;
            return (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
                      `bg-gradient-to-br ${toolInfo?.gradient || "from-primary to-primary/70"}`
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.title || "Untitled"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
