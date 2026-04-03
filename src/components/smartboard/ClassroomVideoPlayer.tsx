import { useState, useCallback, useEffect, useRef } from "react";
import { Search, Play, StopCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VideoResult {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
}

interface ClassroomVideoPlayerProps {
  sessionId: string;
  initialQuery?: string;
}

function formatDuration(iso: string | undefined): string {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = m[1] ? `${m[1]}:` : "";
  const min = String(m[2] || 0).padStart(h ? 2 : 1, "0");
  const sec = String(m[3] || 0).padStart(2, "0");
  return `${h}${min}:${sec}`;
}

export function ClassroomVideoPlayer({ sessionId, initialQuery }: ClassroomVideoPlayerProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState<VideoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeVideo, setActiveVideo] = useState<VideoResult | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Initialize realtime channel
  useEffect(() => {
    const channel = supabase.channel(`video-sync:${sessionId}`);
    channel.subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  // Auto-search if initialQuery provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-youtube", {
        body: { query: q, type: "explanation" },
      });
      if (error) throw error;
      setResults(data?.videos || []);
    } catch (err) {
      toast.error("Failed to search videos");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const playForClass = useCallback((video: VideoResult) => {
    setActiveVideo(video);
    setBroadcasting(true);
    channelRef.current?.send({
      type: "broadcast",
      event: "video_play",
      payload: { videoId: video.videoId, title: video.title },
    });
    toast.success("Playing video for class");
  }, []);

  const stopBroadcast = useCallback(() => {
    setBroadcasting(false);
    setActiveVideo(null);
    channelRef.current?.send({
      type: "broadcast",
      event: "video_stop",
      payload: {},
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search */}
      <div className="flex items-center gap-2 p-3 border-b border-border shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search educational videos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-8 h-9"
          />
        </div>
        <Button size="sm" onClick={() => handleSearch()} disabled={loading} className="h-9 shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </Button>
      </div>

      {/* Active player */}
      {activeVideo && (
        <div className="border-b border-border shrink-0">
          <div className="relative aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${activeVideo.videoId}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-card">
            <p className="text-xs font-medium truncate flex-1">{activeVideo.title}</p>
            <Button
              variant="destructive"
              size="sm"
              onClick={stopBroadcast}
              className="gap-1.5 shrink-0 ml-2"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {loading && results.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && results.length === 0 && query && (
          <p className="text-center text-sm text-muted-foreground py-12">
            No results. Try different keywords.
          </p>
        )}
        {results.map((v) => (
          <div
            key={v.id}
            className={cn(
              "flex gap-3 p-2 rounded-lg border border-border hover:border-primary/30 transition-colors cursor-pointer",
              activeVideo?.id === v.id && "border-primary bg-primary/5"
            )}
            onClick={() => playForClass(v)}
          >
            <div className="w-28 h-20 rounded-md overflow-hidden shrink-0 bg-muted relative">
              <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
              {v.duration && (
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                  {formatDuration(v.duration)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">{v.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{v.channelTitle}</p>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 mt-1 h-7 text-xs text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  playForClass(v);
                }}
              >
                <Play className="w-3 h-3" /> Play for Class
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
