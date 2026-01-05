import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisualMindMap } from "@/components/VisualMindMap";
import { ContentInputTabs } from "@/components/ContentInputTabs";

const MindMap = () => {
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    setIsGenerating(true);
    setMindMapData(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      let textContent = content;

      if (type === "youtube" && metadata?.videoId) {
        const transcriptResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-transcript`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ videoId: metadata.videoId, videoTitle: "Video" }),
          }
        );
        if (!transcriptResponse.ok) throw new Error("Failed to fetch transcript");
        const { transcript } = await transcriptResponse.json();
        textContent = transcript;
      } else if (type === "recording") {
        const transcribeResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ audio: content }),
          }
        );
        if (!transcribeResponse.ok) throw new Error("Failed to transcribe");
        const { text } = await transcribeResponse.json();
        textContent = text;
      } else if (type === "upload" && metadata?.file) {
        if (metadata.file.type === "application/pdf") {
          const formData = new FormData();
          formData.append("file", metadata.file);
          const processResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-pdf`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: formData,
            }
          );
          if (!processResponse.ok) throw new Error("Failed to process PDF");
          const { text } = await processResponse.json();
          textContent = text;
        } else if (content) {
          textContent = content;
        }
      }

      if (!textContent?.trim()) {
        throw new Error("No content to process");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-mindmap`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            content: textContent.slice(0, 10000),
            language: metadata?.language || "en",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate mind map");

      const data = await response.json();
      setMindMapData(data.mindMap);

      toast({
        title: "Mind Map Ready! 🧠",
        description: "Your visual mind map has been generated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate mind map. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Mind Map</h1>
            <p className="text-muted-foreground mt-2">
              Visualize concepts and relationships from any content
            </p>
          </div>

          {!mindMapData ? (
            <Card>
              <CardContent className="pt-6">
                <ContentInputTabs
                  onContentReady={handleContentReady}
                  isProcessing={isGenerating}
                  placeholder="Paste your study content here (lecture notes, concepts, topics)..."
                  supportedFormats="PDF, TXT; Max size: 20MB"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setMindMapData(null)}
                >
                  Create New
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground w-16 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="outline" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div 
                    className="min-h-[600px] overflow-auto"
                    style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
                  >
                    <VisualMindMap 
                      data={mindMapData} 
                      title="Mind Map"
                      onClose={() => setMindMapData(null)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default MindMap;
