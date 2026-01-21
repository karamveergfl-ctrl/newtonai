import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Network, ZoomIn, ZoomOut, GitBranch, Boxes, Clock, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VisualMindMap } from "@/components/VisualMindMap";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { useFeatureGate } from "@/components/FeatureGate";
import { ProcessingOverlay } from "@/components/ProcessingOverlay";
import { useProcessingState } from "@/hooks/useProcessingState";
import { NewtonFeedback } from "@/components/NewtonFeedback";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { cn } from "@/lib/utils";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";
import { useTemplatePreferences } from "@/hooks/useTemplatePreferences";

type MindMapStyle = "radial" | "tree" | "cluster" | "timeline";

const mindMapStyles: { id: MindMapStyle; name: string; description: string; icon: React.ElementType }[] = [
  { id: "radial", name: "Radial", description: "Central topic with branching concepts", icon: Network },
  { id: "tree", name: "Hierarchical", description: "Top-down tree structure", icon: GitBranch },
  { id: "cluster", name: "Cluster", description: "Grouped related concepts", icon: Boxes },
  { id: "timeline", name: "Timeline", description: "Sequential flow of ideas", icon: Clock },
];

interface PendingContent {
  content: string;
  type: string;
  metadata?: { videoId?: string; file?: File; language?: string };
}

const MindMap = () => {
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const { toast } = useToast();
  const { tryUseFeature, modal } = useFeatureGate("mind_map");

  // Processing animation state
  const { phase, isProcessing: isGenerating, startThinking, startWriting, complete, reset: resetProcessing } = useProcessingState();

  // Style selection state
  const [showStyleSelection, setShowStyleSelection] = useState(false);
  const [pendingContent, setPendingContent] = useState<PendingContent | null>(null);
  
  // Use persisted style preferences
  const { preferences, setMindMapStyle } = useTemplatePreferences();
  const selectedStyle = preferences.mindMapStyle;

  // Error state for confused Newton
  const [errorState, setErrorState] = useState<"confused" | null>(null);

  // Idle timeout for sleeping Newton (5 minutes)
  const { isIdle, resetIdle } = useIdleTimeout({ 
    timeout: 300000,
    enabled: !!mindMapData 
  });

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    const allowed = await tryUseFeature();
    if (!allowed) return;

    // Store pending content and show style selection
    setPendingContent({ content, type, metadata });
    setShowStyleSelection(true);
  };

  const handleConfirmGenerate = async () => {
    if (!pendingContent) return;

    const { content, type, metadata } = pendingContent;
    setShowStyleSelection(false);
    setPendingContent(null);
    startThinking(); // Start thinking animation
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

      // Switch to writing phase when API call starts
      startWriting();

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
            structure: selectedStyle,
            detailLevel: "standard",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate mind map");

      const data = await response.json();
      
      // Trigger completed animation
      complete();
      
      // Wait for animation to finish, then show results
      setTimeout(() => {
        setMindMapData(data.mindMapData || data.mindMap);
        toast({
          title: "Mind Map Ready! 🧠",
          description: `Generated ${selectedStyle} mind map`,
        });
      }, 1500);
    } catch (error) {
      resetProcessing();
      setErrorState("confused");
      
      setTimeout(() => {
        setErrorState(null);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to generate mind map. Please try again.",
          variant: "destructive",
        });
      }, 2000);
    }
  };

  const handleBackFromStyleSelection = () => {
    setShowStyleSelection(false);
    setPendingContent(null);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));


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
            isGenerating ? (
              <ProcessingOverlay
                isVisible={isGenerating}
                phase={phase}
                message={phase === "thinking" ? "Analyzing your content..." : phase === "writing" ? "Creating mind map..." : "Mind map ready!"}
                subMessage={phase === "thinking" ? "Understanding the concepts" : phase === "writing" ? "Mapping relationships" : undefined}
                variant="card"
              />
            ) : (
              <Card className="border-border/50 shadow-lg">
                <CardContent className="pt-6">
                  {showStyleSelection ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={handleBackFromStyleSelection}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="text-lg font-semibold">Choose Mind Map Style</h3>
                    </div>
                    
                    {/* 2x2 Grid of Style Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      {mindMapStyles.map((style) => {
                        const StyleIcon = style.icon;
                        return (
                          <button
                            key={style.id}
                            onClick={() => setMindMapStyle(style.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all hover:shadow-md",
                              selectedStyle === style.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                selectedStyle === style.id ? "bg-primary/20" : "bg-muted"
                              )}>
                                <StyleIcon className="h-4 w-4 text-primary" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">{style.name}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">{style.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {/* Generate Button */}
                    <Button onClick={handleConfirmGenerate} className="w-full gap-2" disabled={isGenerating}>
                      <Sparkles className="h-4 w-4" />
                      Generate {mindMapStyles.find(s => s.id === selectedStyle)?.name} Mind Map
                    </Button>
                  </motion.div>
                ) : (
                  <ContentInputTabs
                    onContentReady={handleContentReady}
                    isProcessing={isGenerating}
                    placeholder="Paste your study content here (lecture notes, concepts, topics)..."
                    supportedFormats="PDF, TXT, Images; Max size: 20MB"
                  />
                )}
              </CardContent>
            </Card>
            )
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

      {/* Confused Newton for errors */}
      <NewtonFeedback 
        state={errorState} 
        onDismiss={() => setErrorState(null)}
      />

      {/* Sleeping Newton for idle state */}
      {isIdle && mindMapData && (
        <NewtonFeedback 
          state="sleeping"
          onDismiss={resetIdle}
        />
      )}

      {modal}
    </AppLayout>
  );
};

export default MindMap;
