import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/AppLayout";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Download, Copy, Check } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import {
  processUploadedFile,
  transcribeAudio,
} from "@/utils/contentProcessing";

const AISummarizer = () => {
  const [summary, setSummary] = useState<string | null>(null);
  const [contentTitle, setContentTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { checkCanUse, incrementUsage } = useFeatureUsage();

  const handleContentReady = async (
    content: string,
    type: "upload" | "recording" | "youtube" | "text",
    metadata?: { file?: File; videoId?: string; videoTitle?: string; language?: string }
  ) => {
    if (!checkCanUse("summary")) {
      toast({
        title: "Usage limit reached",
        description: "You've reached your monthly summarizer limit. Upgrade to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast({
          title: "Authentication required",
          description: "Please sign in to use this feature.",
          variant: "destructive",
        });
        return;
      }

      let textContent = content;
      let title = "";

      if (type === "youtube" && metadata?.videoId) {
        // Fetch transcript with video title
        const { data, error } = await supabase.functions.invoke("fetch-transcript", {
          body: { videoId: metadata.videoId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (error) throw error;
        
        // Validate transcript content
        if (!data?.transcript || data.transcript.length < 50) {
          throw new Error("This video doesn't have captions available. Try a different video or paste the content directly.");
        }
        
        // Check for fallback content (just title/description)
        if (data.transcript.startsWith("Video Title:") && data.transcript.length < 200) {
          throw new Error("Could not extract transcript from this video. The video may not have captions enabled.");
        }

        textContent = data.transcript;
        title = metadata?.videoTitle || data.title || "Video Summary";
      } else if (type === "recording") {
        const base64Audio = content.split(",")[1] || content;
        textContent = await transcribeAudio(base64Audio, session.access_token);
        title = "Audio Recording Summary";
      } else if (type === "upload" && metadata?.file) {
        textContent = await processUploadedFile(metadata.file, session.access_token);
        title = metadata.file.name.replace(/\.[^/.]+$/, "");
      } else if (type === "text") {
        title = "Text Summary";
      }

      if (!textContent?.trim()) {
        throw new Error("No content could be extracted. Please try again with different content.");
      }

      // Increment usage after successful content extraction
      await incrementUsage("summary");

      // Generate summary
      const { data: summaryData, error: summaryError } = await supabase.functions.invoke(
        "generate-summary",
        {
          body: {
            content: textContent,
            language: metadata?.language || "en",
          },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (summaryError) throw summaryError;

      setSummary(summaryData.summary);
      setContentTitle(title);
      toast({
        title: "Summary generated!",
        description: "Your content has been summarized successfully.",
      });
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast({
        title: "Error generating summary",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contentTitle || "summary"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">AI Summarizer</h1>
          </div>
          <p className="text-muted-foreground">
            Get concise summaries from PDFs, YouTube videos, audio recordings, or text
          </p>
        </motion.div>

        <ContentInputTabs
          onContentReady={handleContentReady}
          isProcessing={isLoading}
          acceptedFileTypes={{
            "application/pdf": [".pdf"],
            "image/*": [".png", ".jpg", ".jpeg", ".webp"],
            "text/plain": [".txt"],
          }}
          placeholder="Drop a PDF, image, or text file here"
          showLanguageSelector
        />

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Summary</CardTitle>
                    {contentTitle && (
                      <CardDescription>{contentTitle}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      {copied ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MarkdownRenderer content={summary} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default AISummarizer;
