import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Video, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";

const VideoSummarizer = () => {
  const [summary, setSummary] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File }) => {
    setIsLoading(true);
    setSummary("");

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
        const { transcript, title } = await transcriptResponse.json();
        textContent = transcript;
        setVideoTitle(title || "Video Summary");
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
        setVideoTitle("Audio Recording");
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
          setVideoTitle(metadata.file.name);
        } else if (content) {
          textContent = content;
          setVideoTitle(metadata.file.name);
        }
      } else if (type === "text") {
        setVideoTitle("Text Content");
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
          body: JSON.stringify({ content: textContent.slice(0, 15000), type: "video" }),
        }
      );

      if (!summaryResponse.ok) throw new Error("Failed to generate summary");

      const data = await summaryResponse.json();
      setSummary(data.summary);

      toast({
        title: "Summary Generated! 🎬",
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
    const blob = new Blob([`${videoTitle}\n\n${summary}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoTitle.replace(/[^a-z0-9]/gi, "-")}-summary.txt`;
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
              <Video className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Video Summarizer</h1>
            <p className="text-muted-foreground mt-2">
              Get summaries from YouTube videos, recordings, or any content
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ContentInputTabs
                onContentReady={handleContentReady}
                isProcessing={isLoading}
                placeholder="Paste video transcript or content here..."
                supportedFormats="PDF, TXT; Max size: 20MB"
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
                  <div>
                    <CardTitle>Summary</CardTitle>
                    {videoTitle && (
                      <CardDescription>{videoTitle}</CardDescription>
                    )}
                  </div>
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

export default VideoSummarizer;
