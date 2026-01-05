import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Loader2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

const AIFlashcards = () => {
  const [content, setContent] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast({
        title: "No content",
        description: "Please enter some content to generate flashcards",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setFlashcards([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

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
            content: content.slice(0, 8000),
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
        description: "Failed to generate flashcards. Please try again.",
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
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Flashcards</h1>
              <p className="text-muted-foreground">Generate flashcards from any content for effective studying</p>
            </div>
          </div>

          {flashcards.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Create Flashcards</CardTitle>
                <CardDescription>Enter your study material to generate flashcards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your study content here (lecture notes, textbook excerpts, etc.)..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="resize-none"
                />

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !content.trim()}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Flashcards...
                    </>
                  ) : (
                    <>
                      <Layers className="h-4 w-4 mr-2" />
                      Generate Flashcards
                    </>
                  )}
                </Button>
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
                    setContent("");
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
                  {/* Front */}
                  <Card 
                    className="absolute inset-0 flex items-center justify-center p-6 backface-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-2">Question</p>
                      <p className="text-lg font-medium">{currentCard?.front}</p>
                    </div>
                  </Card>

                  {/* Back */}
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
