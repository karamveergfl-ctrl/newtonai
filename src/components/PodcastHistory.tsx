import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Podcast, 
  Play, 
  Trash2, 
  Clock, 
  Calendar,
  ChevronRight,
  History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PodcastSegment {
  speaker: "host1" | "host2";
  name: string;
  text: string;
  emotion?: string;
  audio?: string;
}

interface SavedPodcast {
  id: string;
  title: string;
  script: { segments: PodcastSegment[] };
  audio_segments: PodcastSegment[] | null;
  duration_seconds: number;
  created_at: string;
  source_content: string | null;
}

interface PodcastHistoryProps {
  onSelectPodcast: (podcast: SavedPodcast) => void;
  refreshTrigger?: number;
}

export function PodcastHistory({ onSelectPodcast, refreshTrigger }: PodcastHistoryProps) {
  const [podcasts, setPodcasts] = useState<SavedPodcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPodcasts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Type assertion for the data
      setPodcasts((data as unknown as SavedPodcast[]) || []);
    } catch (error) {
      console.error("Error fetching podcasts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from("podcasts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setPodcasts(prev => prev.filter(p => p.id !== id));
      toast.success("Podcast deleted");
    } catch (error) {
      console.error("Error deleting podcast:", error);
      toast.error("Failed to delete podcast");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "~5 min";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Recent Podcasts</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (podcasts.length === 0) {
    return (
      <Card className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
          <Podcast className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium mb-1">No podcasts yet</h3>
        <p className="text-sm text-muted-foreground">
          Generate your first AI podcast from study materials
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Recent Podcasts</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {podcasts.length} saved
        </span>
      </div>

      <ScrollArea className="h-[300px] pr-2">
        <AnimatePresence>
          <div className="space-y-2">
            {podcasts.map((podcast, index) => (
              <motion.div
                key={podcast.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="group relative"
              >
                <div 
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onSelectPodcast(podcast)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Podcast className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate pr-8">
                      {podcast.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(podcast.created_at), "MMM d")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(podcast.duration_seconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPodcast(podcast);
                      }}
                    >
                      <Play className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                          disabled={deletingId === podcast.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete podcast?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{podcast.title}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(podcast.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </ScrollArea>
    </Card>
  );
}
