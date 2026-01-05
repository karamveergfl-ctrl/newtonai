import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContentInputTabs } from "@/components/ContentInputTabs";

const HomeworkHelp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState("");
  const { toast } = useToast();

  const handleContentReady = async (content: string, type: string, metadata?: { videoId?: string; file?: File }) => {
    setIsLoading(true);
    setSolution("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      let textContent = content;
      let imageData: string | undefined;

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
        if (metadata.file.type.startsWith("image/")) {
          const reader = new FileReader();
          imageData = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(metadata.file!);
          });
          textContent = "";
        } else if (metadata.file.type === "application/pdf") {
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
            stream: true 
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
              <Card>
                <CardHeader>
                  <CardTitle>Solution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                    {solution}
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

export default HomeworkHelp;
