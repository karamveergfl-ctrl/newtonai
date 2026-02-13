import { memo, useRef, useState, useCallback } from "react";
import { Plus, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Attachment {
  name: string;
  type: string;
  extractedText: string;
}

interface NewtonAttachmentButtonProps {
  onAttach: (attachment: Attachment) => void;
  disabled?: boolean;
  currentAttachment: Attachment | null;
  onRemove: () => void;
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp";
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export const NewtonAttachmentButton = memo(function NewtonAttachmentButton({
  onAttach,
  disabled,
  currentAttachment,
  onRemove,
}: NewtonAttachmentButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Maximum 20MB allowed.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      // Convert to base64
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      const isImage = file.type.startsWith("image/");
      
      let extractedText = "";
      
      if (file.type === "text/plain") {
        extractedText = await file.text();
      } else {
        // Use extract-text edge function
        const { data, error } = await supabase.functions.invoke("extract-text", {
          body: {
            file: base64,
            fileName: file.name,
            mimeType: file.type,
            isImage,
          },
        });

        if (error) throw error;
        extractedText = data?.text || data?.content || "";
      }

      if (!extractedText.trim()) {
        toast({ title: "Could not extract text", description: "The file might be empty or unreadable.", variant: "destructive" });
        return;
      }

      onAttach({
        name: file.name,
        type: file.type,
        extractedText: extractedText.slice(0, 15000), // Limit context size
      });
    } catch (err) {
      console.error("Attachment processing error:", err);
      toast({ title: "Upload failed", description: "Could not process the file.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [onAttach, toast]);

  if (currentAttachment) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-xs text-foreground max-w-[200px]">
        <FileText className="w-3.5 h-3.5 shrink-0 text-primary" />
        <span className="truncate">{currentAttachment.name}</span>
        <button onClick={onRemove} className="shrink-0 hover:text-destructive">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-[42px] w-[42px] shrink-0"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || isProcessing}
        title="Attach a document"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-5 h-5" />
        )}
      </Button>
    </>
  );
});
