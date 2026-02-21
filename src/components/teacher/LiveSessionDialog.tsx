import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Radio, FileText, Youtube, Type } from "lucide-react";

interface LiveSessionDialogProps {
  classId: string;
  onSessionStarted: () => void;
  children: React.ReactNode;
}

export function LiveSessionDialog({ classId, onSessionStarted, children }: LiveSessionDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [contentTab, setContentTab] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const extractFromFile = async (f: File): Promise<{ text: string; title: string }> => {
    const formData = new FormData();
    formData.append("file", f);
    const { data, error } = await supabase.functions.invoke("extract-text", { body: formData });
    if (error || !data?.text) throw new Error("Failed to extract text from file");
    return { text: data.text, title: f.name };
  };

  const extractFromYoutube = async (url: string): Promise<{ text: string; title: string }> => {
    const { data, error } = await supabase.functions.invoke("fetch-transcript", { body: { url } });
    if (error || !data?.transcript) throw new Error("Failed to fetch YouTube transcript");
    return { text: data.transcript, title: data.title || "YouTube Video" };
  };

  const handleStart = async () => {
    if (!title.trim()) { toast.error("Enter a session title"); return; }

    setLoading(true);
    try {
      let contentText = "";
      let contentTitle = "";
      let contentSource = contentTab;

      if (contentTab === "text") {
        if (!textContent.trim()) { toast.error("Paste your content"); setLoading(false); return; }
        contentText = textContent;
        contentTitle = "Pasted text";
      } else if (contentTab === "file") {
        if (!file) { toast.error("Upload a file"); setLoading(false); return; }
        setExtracting(true);
        const result = await extractFromFile(file);
        contentText = result.text;
        contentTitle = result.title;
        contentSource = "pdf";
        setExtracting(false);
      } else if (contentTab === "youtube") {
        if (!youtubeUrl.trim()) { toast.error("Enter a YouTube URL"); setLoading(false); return; }
        setExtracting(true);
        const result = await extractFromYoutube(youtubeUrl);
        contentText = result.text;
        contentTitle = result.title;
        setExtracting(false);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); setLoading(false); return; }

      const { error } = await supabase.from("live_sessions" as any).insert({
        class_id: classId,
        teacher_id: user.id,
        title: title.trim(),
        content_source: contentSource,
        content_text: contentText,
        content_title: contentTitle,
        status: "teaching",
      } as any);

      if (error) { toast.error("Failed to start session"); console.error(error); setLoading(false); return; }

      toast.success("Live session started!");
      setOpen(false);
      setTitle("");
      setTextContent("");
      setYoutubeUrl("");
      setFile(null);
      onSessionStarted();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setExtracting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500" />
            Start Live Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="session-title">Session Title</Label>
            <Input
              id="session-title"
              placeholder="e.g. Chapter 5 — Thermodynamics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label>Teaching Material</Label>
            <Tabs value={contentTab} onValueChange={setContentTab} className="mt-1.5">
              <TabsList className="grid grid-cols-3 h-9">
                <TabsTrigger value="text" className="text-xs gap-1"><Type className="h-3.5 w-3.5" /> Text</TabsTrigger>
                <TabsTrigger value="file" className="text-xs gap-1"><FileText className="h-3.5 w-3.5" /> File</TabsTrigger>
                <TabsTrigger value="youtube" className="text-xs gap-1"><Youtube className="h-3.5 w-3.5" /> YouTube</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-2">
                <Textarea
                  placeholder="Paste your lecture content, notes, or textbook text here..."
                  rows={5}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
              </TabsContent>
              <TabsContent value="file" className="mt-2">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf,.pptx,.ppt,.docx,.doc,.txt"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="session-file"
                  />
                  <label htmlFor="session-file" className="cursor-pointer">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {file ? file.name : "Click to upload PDF, PPT, or DOCX"}
                    </p>
                  </label>
                </div>
              </TabsContent>
              <TabsContent value="youtube" className="mt-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
              </TabsContent>
            </Tabs>
          </div>

          <Button onClick={handleStart} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {extracting ? "Extracting content..." : "Starting..."}
              </>
            ) : (
              <>
                <Radio className="h-4 w-4 mr-2" />
                Start Teaching
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
