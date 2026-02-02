import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MessageSquare, X } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
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
import { 
  processUploadedFile, 
  getYouTubeTranscript,
  transcribeAudio 
} from "@/utils/contentProcessing";
import { useProcessingOverlay } from "@/contexts/ProcessingOverlayContext";
import { usePDFDocument } from "@/hooks/usePDFDocument";

// Configure PDF.js worker - use unpkg for reliable ESM worker loading
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFChatUploadViewProps {
  onFileSelected: (file: File, documentId: string) => void;
  onTextContent?: (text: string, fileName: string) => void;
}

export function PDFChatUploadView({ onFileSelected, onTextContent }: PDFChatUploadViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showProcessing, hideProcessing, updateProgress, updateMessage } = useProcessingOverlay();
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const {
    createDocument,
    processPages,
  } = usePDFDocument();

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Tools", href: "/tools" },
    { name: "Chat with PDF", href: "/pdf-chat" },
  ];

  // Extract text from PDF using pdfjs-dist
  const extractTextFromPDF = useCallback(async (file: File): Promise<Array<{ pageNumber: number; text: string }>> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages: Array<{ pageNumber: number; text: string }> = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      pages.push({ pageNumber: i, text });
      
      // Update progress during extraction
      const extractProgress = Math.round((i / pdf.numPages) * 50);
      updateProgress(extractProgress);
      updateMessage("Processing your PDF...", `Extracting text from page ${i} of ${pdf.numPages}`);
    }
    
    return pages;
  }, [updateProgress, updateMessage]);

  // Handle PDF upload with full processing before navigation
  const handlePDFUpload = useCallback(async (file: File) => {
    abortControllerRef.current = new AbortController();
    setIsProcessing(true);
    
    showProcessing({
      message: "Processing your PDF...",
      subMessage: "Preparing document for chat",
      variant: "overlay",
      canCancel: true,
      onCancel: handleCancelProcessing,
    });

    try {
      // Step 1: Create document record
      updateMessage("Processing your PDF...", "Creating document record");
      const documentId = await createDocument(file.name);
      
      if (!documentId) {
        throw new Error("Failed to create document record");
      }

      // Step 2: Extract text from PDF
      updateMessage("Processing your PDF...", "Extracting text content");
      const pages = await extractTextFromPDF(file);
      
      if (pages.length === 0) {
        throw new Error("No text content could be extracted from PDF");
      }

      // Step 3: Process pages into chunks
      updateMessage("Processing your PDF...", "Preparing document for chat");
      updateProgress(60);
      await processPages(documentId, pages);
      
      updateProgress(100);
      updateMessage("Processing complete!", "Opening chat view");
      
      // Brief delay to show completion
      await new Promise(resolve => setTimeout(resolve, 500));
      
      hideProcessing();
      setIsProcessing(false);
      
      // Navigate to split view with processed document
      onFileSelected(file, documentId);
    } catch (error) {
      hideProcessing();
      setIsProcessing(false);
      
      if ((error as Error).name === 'AbortError') {
        return;
      }
      
      toast({
        title: "Processing Error",
        description: error instanceof Error ? error.message : "Failed to process PDF",
        variant: "destructive",
      });
    }
  }, [createDocument, extractTextFromPDF, processPages, showProcessing, hideProcessing, updateProgress, updateMessage, onFileSelected, toast]);

  const handleContentReady = async (
    content: string,
    type: string,
    metadata?: { videoId?: string; videoTitle?: string; file?: File; language?: string }
  ) => {
    // For PDF files, use the new processing flow
    if (type === "upload" && metadata?.file) {
      const file = metadata.file;
      const fileType = file.type;
      
      // Check if it's a PDF - use new processing flow
      if (fileType === "application/pdf") {
        await handlePDFUpload(file);
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

    // For YouTube content - fetch transcript
    if (type === "youtube" && metadata?.videoId) {
      abortControllerRef.current = new AbortController();
      setIsProcessing(true);
      showProcessing({
        message: "Fetching video transcript...",
        subMessage: metadata.videoTitle || "Processing YouTube video",
        variant: "overlay",
        canCancel: true,
        onCancel: handleCancelProcessing,
      });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        const transcript = await getYouTubeTranscript(metadata.videoId, session.access_token);
        
        if (!transcript?.trim()) {
          throw new Error("No transcript available for this video");
        }

        hideProcessing();
        setIsProcessing(false);
        
        if (onTextContent) {
          const title = metadata.videoTitle || `YouTube Video (${metadata.videoId})`;
          onTextContent(transcript, title);
        }
      } catch (error) {
        hideProcessing();
        setIsProcessing(false);
        
        if ((error as Error).name === 'AbortError') {
          return;
        }
        
        toast({
          title: "Transcript Error",
          description: error instanceof Error ? error.message : "Failed to fetch video transcript",
          variant: "destructive",
        });
      }
      return;
    }

    // For audio recordings - transcribe
    if (type === "recording" && content) {
      abortControllerRef.current = new AbortController();
      setIsProcessing(true);
      showProcessing({
        message: "Transcribing audio...",
        subMessage: "Converting speech to text",
        variant: "overlay",
        canCancel: true,
        onCancel: handleCancelProcessing,
      });

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        const transcript = await transcribeAudio(content, session.access_token, undefined, metadata?.language);
        
        if (!transcript?.trim()) {
          throw new Error("No speech detected in the recording");
        }

        hideProcessing();
        setIsProcessing(false);
        
        if (onTextContent) {
          onTextContent(transcript, "Audio Recording");
        }
      } catch (error) {
        hideProcessing();
        setIsProcessing(false);
        
        if ((error as Error).name === 'AbortError') {
          return;
        }
        
        toast({
          title: "Transcription Error",
          description: error instanceof Error ? error.message : "Failed to transcribe audio",
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

    toast({
      title: "Invalid Input",
      description: "Please provide content to chat about.",
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
              Upload a document, paste text, or use YouTube videos
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
