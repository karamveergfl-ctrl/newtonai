import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { BookOpen, Search, Video, TrendingUp } from "lucide-react";

interface StudyStats {
  pdfsViewed: number;
  topicsSearched: number;
  videoTimeMinutes: number;
}

export const StudyTracker = () => {
  const [stats, setStats] = useState<StudyStats>({
    pdfsViewed: 0,
    topicsSearched: 0,
    videoTimeMinutes: 0,
  });
  const [todayTopics, setTodayTopics] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get unique PDFs viewed
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("pdf_name")
        .eq("user_id", user.id);
      
      const uniquePdfs = new Set(sessions?.map(s => s.pdf_name) || []);

      // Get total topics searched
      const { data: searches } = await supabase
        .from("search_history")
        .select("id")
        .eq("user_id", user.id);

      // Get today's topics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: todaySearches } = await supabase
        .from("search_history")
        .select("id")
        .eq("user_id", user.id)
        .gte("created_at", today.toISOString());

      // Get total video watch time
      const { data: watchTime } = await supabase
        .from("video_watch_time")
        .select("watch_duration_seconds")
        .eq("user_id", user.id);

      const totalSeconds = watchTime?.reduce((acc, curr) => acc + curr.watch_duration_seconds, 0) || 0;

      setStats({
        pdfsViewed: uniquePdfs.size,
        topicsSearched: searches?.length || 0,
        videoTimeMinutes: Math.floor(totalSeconds / 60),
      });

      setTodayTopics(todaySearches?.length || 0);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Your Study Progress</h3>
      </div>
      
      {todayTopics > 0 && (
        <div className="mb-3 p-2 bg-primary/10 rounded-md text-sm">
          🔥 You've studied <strong>{todayTopics}</strong> new topics today. Keep it up!
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
          <BookOpen className="w-4 h-4 mb-1 text-primary" />
          <div className="text-xl font-bold">{stats.pdfsViewed}</div>
          <div className="text-xs text-muted-foreground">PDFs</div>
        </div>
        
        <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
          <Search className="w-4 h-4 mb-1 text-primary" />
          <div className="text-xl font-bold">{stats.topicsSearched}</div>
          <div className="text-xs text-muted-foreground">Topics</div>
        </div>
        
        <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
          <Video className="w-4 h-4 mb-1 text-primary" />
          <div className="text-xl font-bold">{stats.videoTimeMinutes}</div>
          <div className="text-xs text-muted-foreground">Minutes</div>
        </div>
      </div>
    </Card>
  );
};
