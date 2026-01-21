import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Download, Copy, Check, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LectureRecorder } from "@/components/LectureRecorder";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureGate } from "@/components/FeatureGate";
import { useWebSpeechTTS } from "@/hooks/useWebSpeechTTS";

// Strip markdown formatting for cleaner TTS
const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s?/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .replace(/^\s*>/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const AILectureNotes = () => {
  const [notes, setNotes] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { modal } = useFeatureGate("lecture_notes");
  const { speak, cancel, isSpeaking, isSupported } = useWebSpeechTTS();

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      cancel();
      return;
    }

    if (!notes) return;

    const cleanText = stripMarkdown(notes);
    
    try {
      await speak(cleanText, {
        rate: 1.0,
        pitch: 1.0,
        onStart: () => {
          toast({
            title: "Reading aloud 🔊",
            description: "Tap again to stop",
          });
        },
        onError: (error) => {
          toast({
            title: "Speech Error",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("TTS error:", error);
    }
  }, [notes, isSpeaking, speak, cancel, toast]);

  const handleNotesGenerated = (generatedNotes: string, title: string) => {
    setNotes(generatedNotes);
    setNotesTitle(title);
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${notesTitle || "lecture-notes"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="text-center mb-4 sm:mb-8">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <Mic className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">AI Lecture Notes</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Record lectures or upload audio to get organized notes instantly
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <LectureRecorder onNotesGenerated={handleNotesGenerated} />
            </CardContent>
          </Card>

          {notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 border-b border-border/50 bg-muted/30">
                  <CardTitle className="font-display font-semibold text-lg sm:text-xl">
                    {notesTitle || "Lecture Notes"}
                  </CardTitle>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    {isSupported && (
                      <Button 
                        variant={isSpeaking ? "default" : "ghost"} 
                        size="sm" 
                        onClick={handleReadAloud}
                        className={`flex-1 sm:flex-none ${isSpeaking ? 'bg-primary text-primary-foreground' : ''}`}
                      >
                        {isSpeaking ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                        <span className="ml-2 sm:hidden">{isSpeaking ? "Stop" : "Listen"}</span>
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="flex-1 sm:flex-none">
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span className="ml-2 sm:hidden">Copy</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1 sm:flex-none">
                      <Download className="h-4 w-4 sm:mr-2" />
                      <span className="ml-2 sm:ml-0">Download</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <MarkdownRenderer content={notes} />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>

      {modal}
    </AppLayout>
  );
};

export default AILectureNotes;
