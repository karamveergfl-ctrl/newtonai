import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureGate } from "@/components/FeatureGate";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";

const AILectureNotes = () => {
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { tryUseFeature, modal } = useFeatureGate("lecture_notes");

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    const allowed = await tryUseFeature();
    if (!allowed) return;

    setIsProcessing(true);
    setNotes("");

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

      const notesResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lecture-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            transcription: textContent,
            language: metadata?.language || "en",
          }),
        }
      );

      if (!notesResponse.ok) throw new Error("Failed to generate notes");

      const data = await notesResponse.json();
      setNotes(data.notes);

      toast({
        title: "Notes Generated! 🎤",
        description: "Your lecture notes are ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecture-notes.md";
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
      <div className="min-h-screen bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 mb-4">
              <Mic className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-bold tracking-tight">AI Lecture Notes</h1>
            <p className="text-muted-foreground mt-2 font-sans">
              Record lectures, upload content, or paste text to get organized notes
            </p>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardContent className="pt-6">
              <ContentInputTabs
                onContentReady={handleContentReady}
                isProcessing={isProcessing}
                placeholder="Paste your lecture transcript or content here..."
                supportedFormats="PDF, TXT, Images; Max size: 20MB"
              />
            </CardContent>
          </Card>

          {notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-border/50 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-muted/30">
                  <CardTitle className="font-display font-semibold">Lecture Notes</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
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
