import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const AIFlashcards = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File }) => {
    setIsGenerating(true);
    setFlashcards([]);

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
            <h1 className="text-3xl font-bold">AI Flashcards</h1>
            <p className="text-muted-foreground mt-2">
              Generate flashcards from any content for effective studying
            </p>
          </div>

          {flashcards.length === 0 ? (
            <Card>
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
                <span className="text-sm text-muted-foreground">
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

              <motion.div
                className="relative h-64 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <motion.div
                  className="absolute inset-0"
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Card 
                    className="absolute inset-0 flex items-center justify-center p-6 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">Question</p>
                      <p className="text-lg font-medium">{currentCard?.front}</p>
                    </div>
                  </Card>

                  <Card 
                    className="absolute inset-0 flex items-center justify-center p-6 bg-primary/5"
                    style={{ 
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">Answer</p>
                      <p className="text-lg">{currentCard?.back}</p>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>

              <p className="text-center text-sm text-muted-foreground">
                Click the card to flip
              </p>

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
