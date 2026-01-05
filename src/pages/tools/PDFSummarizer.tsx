import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile 
} from "@/utils/contentProcessing";

const PDFSummarizer = () => {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    setIsLoading(true);
    setSummary("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      let textContent = content;

      if (type === "youtube" && metadata?.videoId) {
        textContent = await getYouTubeTranscript(metadata.videoId, session.access_token);
      } else if (type === "recording") {
        textContent = await transcribeAudio(content, session.access_token);
      } else if (type === "upload" && metadata?.file) {
        setFileName(metadata.file.name);
        textContent = await processUploadedFile(metadata.file, session.access_token);
      }

      if (!textContent?.trim()) {
        throw new Error("No content to process");
      }

      const summaryResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            content: textContent.slice(0, 15000),
            language: metadata?.language || "en",
          }),
        }
      );

      if (!summaryResponse.ok) throw new Error("Failed to generate summary");

      const data = await summaryResponse.json();
      setSummary(data.summary);

      toast({
        title: "Summary Generated! 📄",
        description: "Your content has been summarized",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to summarize. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? `${fileName.replace(/\.[^/.]+$/, "")}-summary.txt` : "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
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
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">PDF Summarizer</h1>
            <p className="text-muted-foreground mt-2">
              Get concise summaries from PDFs, videos, recordings, or text
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ContentInputTabs
                onContentReady={handleContentReady}
                isProcessing={isLoading}
                placeholder="Paste your content here to summarize..."
                supportedFormats="PDF, TXT, Images; Max size: 20MB"
              />
            </CardContent>
          </Card>

          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Summary</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                    {summary}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default PDFSummarizer;
