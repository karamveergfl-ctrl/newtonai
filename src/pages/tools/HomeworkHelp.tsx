import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useFeatureGate } from "@/components/FeatureGate";
import { 
  getYouTubeTranscript, 
  transcribeAudio, 
  processUploadedFile,
  fileToBase64
} from "@/utils/contentProcessing";

const HomeworkHelp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { canUse, tryUseFeature, modal } = useFeatureGate("homework_help");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied!", description: "Solution copied to clipboard" });
  };

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File; language?: string }) => {
    // Check if user can use this feature
    const allowed = await tryUseFeature();
    if (!allowed) return;

    setIsLoading(true);
    setSolution("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      let textContent = content;
      let imageData: string | undefined;

      if (type === "youtube" && metadata?.videoId) {
        textContent = await getYouTubeTranscript(metadata.videoId, session.access_token);
      } else if (type === "recording") {
        textContent = await transcribeAudio(content, session.access_token);
      } else if (type === "upload" && metadata?.file) {
        // For homework help, we want to send images directly to analyze-text
        // as it supports multimodal input for better problem solving
        if (metadata.file.type.startsWith("image/")) {
          imageData = await fileToBase64(metadata.file);
          textContent = "";
        } else {
          textContent = await processUploadedFile(metadata.file, session.access_token);
        }
      }

      if (!textContent?.trim() && !imageData) {
        throw new Error("No content to process");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            imageData: imageData || undefined,
            text: textContent || undefined,
            stream: true,
            language: metadata?.language || "en",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to analyze");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullContent += content;
                  setSolution(fullContent);
                }
              } catch {}
            }
          }
        }
      }

      toast({
        title: "Solution Ready! ✨",
        description: "Your homework has been solved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to solve the problem. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
              <FileQuestion className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Homework Help</h1>
            <p className="text-muted-foreground mt-2">
              Get step-by-step solutions to your homework problems from any format
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <ContentInputTabs
                onContentReady={handleContentReady}
                isProcessing={isLoading}
                placeholder="Type your homework question here..."
                supportedFormats="Images, PDF, TXT; Max size: 20MB"
              />
            </CardContent>
          </Card>

          {solution && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                  <CardTitle className="text-xl font-semibold tracking-tight">
                    Solution
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <MarkdownRenderer content={solution} />
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

export default HomeworkHelp;
