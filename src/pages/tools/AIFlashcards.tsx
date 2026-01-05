import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { Flashcard } from "@/components/Flashcard";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";

interface FlashcardData {
  id: string;
  front: string;
  back: string;
}

const AIFlashcards = () => {
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    setIsGenerating(true);
    setFlashcards([]);

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-flashcards`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            type: "text",
            content: textContent.slice(0, 8000),
            language: metadata?.language || "en",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate flashcards");

      const data = await response.json();
      setFlashcards(data.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);

      toast({
        title: "Flashcards Ready! 📚",
        description: `Generated ${data.flashcards.length} flashcards`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
    setIsFlipped(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
    setIsFlipped(false);
  };

  const currentCard = flashcards[currentIndex];

  return (
    <AppLayout>
      <div className="min-h-screen bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight">AI Flashcards</h1>
            <p className="text-muted-foreground mt-2 font-sans">
              Generate flashcards from any content for effective studying
            </p>
          </div>

          {flashcards.length === 0 ? (
            <Card className="border-border/50 shadow-lg">
              <CardContent className="pt-6">
                <ContentInputTabs
                  onContentReady={handleContentReady}
                  isProcessing={isGenerating}
                  placeholder="Paste your study content here (lecture notes, textbook excerpts, etc.)..."
                  supportedFormats="PDF, TXT, Images; Max size: 20MB"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-sans">
                  Card {currentIndex + 1} of {flashcards.length}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFlashcards([]);
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Set
                </Button>
              </div>

              {currentCard && (
                <Flashcard
                  front={currentCard.front}
                  back={currentCard.back}
                  index={currentIndex}
                  total={flashcards.length}
                  isFlipped={isFlipped}
                  onFlip={() => setIsFlipped(!isFlipped)}
                />
              )}

              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={goToPrevious}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={goToNext}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default AIFlashcards;
