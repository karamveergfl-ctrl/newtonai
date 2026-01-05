import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ContentInputTabs } from "@/components/ContentInputTabs";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const AIQuiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const { toast } = useToast();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File }) => {
    setIsGenerating(true);
    setQuestions([]);
    setScore(0);
    setCurrentIndex(0);
    setQuizCompleted(false);

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
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

      if (!response.ok) throw new Error("Failed to generate quiz");

      const data = await response.json();
      setQuestions(data.questions);

      toast({
        title: "Quiz Ready! 🧠",
        description: `Generated ${data.questions.length} questions`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    
    if (index === currentQuestion.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const currentQuestion = questions[currentIndex];

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
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">AI Quiz</h1>
            <p className="text-muted-foreground mt-2">
              Test your knowledge with AI-generated quizzes from any content
            </p>
          </div>

          {questions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <ContentInputTabs
                  onContentReady={handleContentReady}
                  isProcessing={isGenerating}
                  placeholder="Paste your study content here..."
                  supportedFormats="PDF, TXT, Images; Max size: 20MB"
                />
              </CardContent>
            </Card>
          ) : quizCompleted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">Quiz Complete! 🎉</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-6xl font-bold text-primary">
                    {Math.round((score / questions.length) * 100)}%
                  </div>
                  <p className="text-lg text-muted-foreground">
                    You got {score} out of {questions.length} correct
                  </p>
                  <Button onClick={resetQuiz} className="w-full max-w-xs">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Take Another Quiz
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium">
                  Score: {score}/{currentIndex + (showResult ? 1 : 0)}
                </span>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{currentQuestion?.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentQuestion?.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: showResult ? 1 : 1.01 }}
                      whileTap={{ scale: showResult ? 1 : 0.99 }}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-colors flex items-center gap-3",
                        showResult
                          ? index === currentQuestion.correctIndex
                            ? "border-green-500 bg-green-500/10"
                            : selectedAnswer === index
                            ? "border-red-500 bg-red-500/10"
                            : "border-border"
                          : "border-border hover:border-primary hover:bg-accent"
                      )}
                    >
                      {showResult && index === currentQuestion.correctIndex && (
                        <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      )}
                      {showResult && selectedAnswer === index && index !== currentQuestion.correctIndex && (
                        <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                      )}
                      <span>{option}</span>
                    </motion.button>
                  ))}
                </CardContent>
              </Card>

              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="text-sm">
                        <span className="font-medium">Explanation: </span>
                        {currentQuestion?.explanation}
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Button onClick={handleNext} className="w-full mt-4">
                    {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
                  </Button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default AIQuiz;
