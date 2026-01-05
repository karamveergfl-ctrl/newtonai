import { useState } from "react";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notebook, Upload, Loader2, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AINotes = () => {
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        const text = await file.text();
        setContent(text);
      } else {
        toast({
          title: "Unsupported file",
          description: "Please upload a text file or paste your content",
          variant: "destructive",
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast({
        title: "No content",
        description: "Please enter or upload some content first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setNotes("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-lecture-notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ content: content.slice(0, 15000) }),
        }
      );

      if (!response.ok) throw new Error("Failed to generate notes");

      const data = await response.json();
      setNotes(data.notes);

      toast({
        title: "Notes Generated! 📝",
        description: "Your AI notes are ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate notes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([notes], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-notes.txt";
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
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <Notebook className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Notes</h1>
              <p className="text-muted-foreground">Transform your content into organized study notes</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Content</CardTitle>
              <CardDescription>Paste text or upload a document to generate notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your lecture content, textbook excerpts, or any study material here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="resize-none"
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload Text File</span>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <span className="text-sm text-muted-foreground">
                  {content.length.toLocaleString()} characters
                </span>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !content.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Notes...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate AI Notes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {notes && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Generated Notes</CardTitle>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                    {notes}
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

export default AINotes;
