import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Network, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisualMindMap } from "@/components/VisualMindMap";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { useFeatureGate } from "@/components/FeatureGate";
import { UniversalStudySettingsDialog, UniversalGenerationSettings } from "@/components/UniversalStudySettingsDialog";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";

interface PendingContent {
  content: string;
  type: string;
  metadata?: { videoId?: string; file?: File; language?: string };
}

const MindMap = () => {
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();
  const { tryUseFeature, modal } = useFeatureGate("mind_map");

  // Settings dialog state
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    const allowed = await tryUseFeature();
    if (!allowed) return;

    // Store pending content and show settings dialog
    setPendingContent({ content, type, metadata });
    setShowSettingsDialog(true);
  };

  const handleConfirmGenerate = async (settings: UniversalGenerationSettings) => {
    if (!pendingContent) return;

    const { content, type, metadata } = pendingContent;
    setPendingContent(null);
    setIsGenerating(true);
    setMindMapData(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      let textContent = content;

      if (type === "youtube" && metadata?.videoId) {
        textContent = await getYouTubeTranscript(metadata.videoId, session.access_token);
      } else if (type === "recording") {
        textContent = await transcribeAudio(content, session.access_token);
      } else if (type === "upload" && metadata?.file) {
        textContent = await processUploadedFile(metadata.file, session.access_token);
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
            detailLevel: settings.detailLevel,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate mind map");

      const data = await response.json();
      setMindMapData(data.mindMapData || data.mindMap);

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

  const getContentTitle = () => {
    if (!pendingContent) return "";
    if (pendingContent.type === "youtube") return "YouTube Video";
    if (pendingContent.type === "recording") return "Audio Recording";
    if (pendingContent.metadata?.file) return pendingContent.metadata.file.name;
    return "Text Content";
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="text-center mb-4 sm:mb-8">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <Network className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">Mind Map</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Visualize concepts and relationships from any content
            </p>
          </div>

          {!mindMapData ? (
            <Card className="border-border/50 shadow-lg">
              <CardContent className="pt-6">
                <ContentInputTabs
                  onContentReady={handleContentReady}
                  isProcessing={isGenerating}
                  placeholder="Paste your study content here (lecture notes, concepts, topics)..."
                  supportedFormats="PDF, TXT, Images; Max size: 20MB"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setMindMapData(null)}
                  className="w-full sm:w-auto"
                >
                  Create New
                </Button>
                
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-9 w-9">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs sm:text-sm text-muted-foreground w-14 text-center font-sans">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-9 w-9">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Card className="overflow-hidden border-border/50 shadow-lg">
                <CardContent className="p-0">
                  <div 
                    className="min-h-[400px] sm:min-h-[600px] overflow-auto"
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

      {/* Settings Dialog */}
      <UniversalStudySettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        type="mindmap"
        contentTitle={getContentTitle()}
        contentType={pendingContent?.type as any}
        onGenerate={handleConfirmGenerate}
      />

      {modal}
    </AppLayout>
  );
};

export default MindMap;
