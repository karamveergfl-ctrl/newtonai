import { useState, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Video, FileText, Lightbulb, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface VideoResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface OneTapExplainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term: string;
  gradeLevel?: string;
}

export function OneTapExplainer({ open, onOpenChange, term, gradeLevel = "high school" }: OneTapExplainerProps) {
  const [activeTab, setActiveTab] = useState("video");
  const [videos, setVideos] = useState<VideoResult[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [relatedTerms, setRelatedTerms] = useState<string[]>([]);
  const [customQuery, setCustomQuery] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [example, setExample] = useState("");
  const [loadingExample, setLoadingExample] = useState(false);
  // For nested explainer
  const [nestedTerm, setNestedTerm] = useState<string | null>(null);

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }, []);

  const searchVideos = useCallback(async (query?: string) => {
    setLoadingVideos(true);
    setPlayingVideoId(null);
    try {
      const session = await getSession();
      if (!session) return;

      const searchQuery = query || `${term} explained animation`;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-videos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ query: searchQuery, maxResults: 3 }),
        }
      );

      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setVideos(data.videos || data.items || []);
    } catch {
      setVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  }, [term, getSession]);

  const fetchExplanation = useCallback(async () => {
    setLoadingText(true);
    try {
      const session = await getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: `Explain "${term}" in 3-5 simple sentences for a ${gradeLevel} student. At the end, provide exactly 4 related terms as a JSON array on its own line, like: RELATED: ["term1", "term2", "term3", "term4"]`,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      const text = data.response || data.content || "";

      // Extract related terms
      const relatedMatch = text.match(/RELATED:\s*\[([^\]]+)\]/);
      if (relatedMatch) {
        try {
          const parsed = JSON.parse(`[${relatedMatch[1]}]`);
          setRelatedTerms(parsed);
        } catch { setRelatedTerms([]); }
      }

      setExplanation(text.replace(/RELATED:\s*\[.*\]/, "").trim());
    } catch {
      setExplanation("Unable to generate explanation. Please try again.");
    } finally {
      setLoadingText(false);
    }
  }, [term, gradeLevel, getSession]);

  const fetchExample = useCallback(async () => {
    setLoadingExample(true);
    setShowExample(true);
    try {
      const session = await getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newton-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: `Give a real-world analogy or worked example for "${term}" that a ${gradeLevel} student can relate to. Keep it under 4 sentences.`,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed");
      const data = await response.json();
      setExample(data.response || data.content || "");
    } catch {
      setExample("Unable to generate example.");
    } finally {
      setLoadingExample(false);
    }
  }, [term, gradeLevel, getSession]);

  // Fetch on tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "video" && videos.length === 0 && !loadingVideos) {
      searchVideos();
    }
    if (tab === "text" && !explanation && !loadingText) {
      fetchExplanation();
    }
  };

  // Auto-fetch videos when opened
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && videos.length === 0 && !loadingVideos) {
      searchVideos();
    }
    onOpenChange(isOpen);
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <span>{term}</span>
            </DrawerTitle>
          </DrawerHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="px-4 pb-6">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="video" className="gap-2">
                <Video className="h-4 w-4" /> Video
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" /> Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="video" className="space-y-3 max-h-[60vh] overflow-y-auto">
              {playingVideoId ? (
                <div className="space-y-2">
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPlayingVideoId(null)}>
                    ← Back to results
                  </Button>
                </div>
              ) : loadingVideos ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Searching videos...</span>
                </div>
              ) : (
                <>
                  {videos.map((video) => (
                    <Card
                      key={video.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setPlayingVideoId(video.id)}
                    >
                      <CardContent className="p-3 flex gap-3">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-32 h-20 object-cover rounded-md shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {videos.length === 0 && !loadingVideos && (
                    <p className="text-center text-muted-foreground py-8 text-sm">No videos found.</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Search something else..."
                      value={customQuery}
                      onChange={(e) => setCustomQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && customQuery.trim() && searchVideos(customQuery)}
                      className="text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => customQuery.trim() && searchVideos(customQuery)}
                      disabled={!customQuery.trim()}
                    >
                      Search
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-4 max-h-[60vh] overflow-y-auto">
              {loadingText ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Generating explanation...</span>
                </div>
              ) : (
                <>
                  <MarkdownRenderer content={explanation} className="text-sm" />

                  {!showExample && (
                    <Button variant="outline" size="sm" onClick={fetchExample} className="gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Show with Example
                    </Button>
                  )}

                  {showExample && (
                    <Card className="bg-amber-500/5 border-amber-500/20">
                      <CardContent className="pt-4">
                        {loadingExample ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Generating example...</span>
                          </div>
                        ) : (
                          <MarkdownRenderer content={example} className="text-sm" />
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {relatedTerms.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Related Terms</p>
                      <div className="flex flex-wrap gap-2">
                        {relatedTerms.map((rt) => (
                          <Badge
                            key={rt}
                            variant="secondary"
                            className="cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => setNestedTerm(rt)}
                          >
                            {rt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </DrawerContent>
      </Drawer>

      {/* Nested explainer for related terms */}
      {nestedTerm && (
        <OneTapExplainer
          open={!!nestedTerm}
          onOpenChange={(open) => !open && setNestedTerm(null)}
          term={nestedTerm}
          gradeLevel={gradeLevel}
        />
      )}
    </>
  );
}
