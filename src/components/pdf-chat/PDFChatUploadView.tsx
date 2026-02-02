import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import SEOHead from "@/components/SEOHead";
import { ContentInputTabs } from "@/components/ContentInputTabs";
import { InlineRecents } from "@/components/InlineRecents";
import { PrimaryAdBanner } from "@/components/PrimaryAdBanner";
import { ToolPagePromoSections } from "@/components/tool-sections";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { processUploadedFile } from "@/utils/contentProcessing";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";

interface PDFChatUploadViewProps {
  onFileSelected: (file: File) => void;
  onTextContent?: (text: string, fileName: string) => void;
}

export function PDFChatUploadView({ onFileSelected, onTextContent }: PDFChatUploadViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showProcessing, hideProcessing } = useProcessingOverlay();
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "Chat with PDF", href: "/pdf-chat" },
  ];

  const handleContentReady = async (
    content: string,
    type: string,
    metadata?: { videoId?: string; file?: File; language?: string }
  ) => {
    // For PDF files, pass directly to the split view
    if (type === "upload" && metadata?.file) {
      const file = metadata.file;
      const fileType = file.type;
      
      // Check if it's a PDF
      if (fileType === "application/pdf") {
        onFileSelected(file);
        return;
      }

      // For other file types, process and create text-based chat
      abortControllerRef.current = new AbortController();
      setIsProcessing(true);
      showProcessing({
        message: "Processing document...",
        subMessage: "Extracting text content",
        variant: "overlay",
        canCancel: true,
        onCancel: handleCancelProcessing,
      });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        const textContent = await processUploadedFile(file, session.access_token);
        
        if (!textContent?.trim()) {
          throw new Error("No text content could be extracted");
        }

        hideProcessing();
        setIsProcessing(false);
        
        // Pass text content to parent for text-based chat
        if (onTextContent) {
          onTextContent(textContent, file.name);
        }
      } catch (error) {
        hideProcessing();
        setIsProcessing(false);
        
        if ((error as Error).name === 'AbortError') {
          return;
        }
        
        toast({
          title: "Processing Error",
          description: error instanceof Error ? error.message : "Failed to process document",
          variant: "destructive",
        });
      }
      return;
    }

    // For text content directly
    if (type === "text" && content.trim()) {
      if (onTextContent) {
        onTextContent(content, "Text Document");
      }
      return;
    }

    // For YouTube or other types, show not supported message
    if (type === "youtube") {
      toast({
        title: "Not Supported",
        description: "YouTube videos are not supported for PDF Chat. Please upload a document or paste text.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Invalid Input",
      description: "Please upload a PDF document or paste text content.",
      variant: "destructive",
    });
  };

  const handleCancelProcessing = () => {
    abortControllerRef.current?.abort();
    hideProcessing();
    setIsProcessing(false);
  };

  return (
    <AppLayout>
      <SEOHead
        title="Chat with PDF | NewtonAI"
        description="Upload a PDF and ask questions about its content. Get accurate, AI-powered answers with citations."
        canonicalPath="/pdf-chat"
        breadcrumbs={breadcrumbs}
        keywords="chat with PDF, PDF AI, document chat, PDF questions, study PDF"
      />
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 md:px-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div className="relative text-center mb-4 sm:mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="absolute right-0 top-0 h-9 w-9 rounded-full hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="inline-flex items-center justify-center p-2 sm:p-3 rounded-xl bg-primary/10 mb-3 sm:mb-4">
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              Chat with PDF
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 font-sans px-2 sm:px-0">
              Upload a document and ask questions about its content
            </p>
          </div>

          {/* Content Input */}
          {!isProcessing && (
            <div className="space-y-6">
              <Card className="border-border/50 shadow-lg">
                <CardContent className="pt-6">
                  <ContentInputTabs
                    onContentReady={handleContentReady}
                    isProcessing={isProcessing}
                    placeholder="Paste your document text here..."
                    supportedFormats="PDF, DOCX, TXT, Images; Max size: 20MB"
                    showYouTube={false}
                    showRecording={false}
                  />
                  
                  {/* Inline recents */}
                  <InlineRecents toolId="pdf-chat" />
                </CardContent>
              </Card>

              {/* Primary Ad Banner */}
              <PrimaryAdBanner />

              {/* Promotional sections */}
              <ToolPagePromoSections toolId="pdf-chat" />
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
