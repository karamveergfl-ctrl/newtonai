import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, ChevronLeft, ChevronRight, FileText, FileType, Search, Camera, Play, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

// Configure PDF.js worker from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface OCRSplitViewProps {
  file: File;
  onClose: () => void;
  onTextSelect?: (text: string) => void;
}

interface ProcessedPage {
  pageNumber: number;
  text: string;
  status: "pending" | "processing" | "completed" | "error";
}

interface VideoResult {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

interface AnalysisResult {
  topic: string;
  animationVideos: VideoResult[];
  explanationVideos: VideoResult[];
  solution: string | null;
  description: string | null;
  isQuestion: boolean;
}

export const OCRSplitView = ({ file, onClose, onTextSelect }: OCRSplitViewProps) => {
  const [originalPages, setOriginalPages] = useState<string[]>([]);
  const [processedPages, setProcessedPages] = useState<ProcessedPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [showSearchPrompt, setShowSearchPrompt] = useState(false);
  const [firstPageProcessed, setFirstPageProcessed] = useState(false);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const { toast } = useToast();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    loadDocument();
  }, [file]);

  // Process first page immediately after loading
  useEffect(() => {
    if (originalPages.length > 0 && processedPages.length > 0 && !firstPageProcessed) {
      processPage(0, true); // true = priority/fast
      setFirstPageProcessed(true);
    }
  }, [originalPages, processedPages.length, firstPageProcessed]);

  // Lazy OCR: process pages ahead when user navigates (skip first page as it's already processed)
  useEffect(() => {
    if (!firstPageProcessed) return;
    
    const pagesToProcess = [currentPage, currentPage + 1, currentPage + 2]
      .filter(p => p > 0 && p < processedPages.length && processedPages[p].status === "pending");
    
    // Stagger processing to avoid overwhelming the API
    pagesToProcess.forEach((pageNum, index) => {
      setTimeout(() => processPage(pageNum, false), index * 500);
    });
  }, [currentPage, processedPages.length, firstPageProcessed]);

  const loadDocument = async () => {
    try {
      console.log("Loading document:", file.name, "Type:", file.type);
      const fileType = file.type;
      
      if (fileType === "application/pdf") {
        console.log("Loading as PDF...");
        await loadPDF();
      } else if (fileType.startsWith("image/")) {
        console.log("Loading as image...");
        await loadImage();
      } else {
        console.log("Unknown file type, trying as image...");
        await loadImage();
      }
      
      console.log("Document loaded successfully");
    } catch (error) {
      console.error("Error loading document:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load document",
        variant: "destructive",
      });
    }
  };

  const loadPDF = async () => {
    try {
      console.log("Reading PDF file...");
      const arrayBuffer = await file.arrayBuffer();
      console.log("PDF size:", arrayBuffer.byteLength, "bytes");
      
      console.log("Initializing PDF.js...");
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      console.log("PDF loaded, pages:", numPages);

      // Extract all page images
      const pages: string[] = [];
      for (let i = 1; i <= numPages; i++) {
        console.log(`Rendering page ${i}/${numPages}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
        pages.push(canvas.toDataURL());
      }

      console.log("All pages rendered successfully");
      setOriginalPages(pages);
      const initialPages = pages.map((_, i) => ({
        pageNumber: i,
        text: "",
        status: "pending" as const
      }));
      setProcessedPages(initialPages);
      pageRefs.current = new Array(pages.length).fill(null);
    } catch (error) {
      console.error("Error in loadPDF:", error);
      throw new Error(`Failed to load PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadImage = async () => {
    // Convert image to base64 data URL (not blob URL) for AI gateway compatibility
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read image file"));
    });
    reader.readAsDataURL(file);
    
    const imageDataUrl = await base64Promise;
    setOriginalPages([imageDataUrl]);
    setProcessedPages([{
      pageNumber: 0,
      text: "",
      status: "pending"
    }]);
    pageRefs.current = [null];
  };

  const processPage = async (pageIndex: number, isPriority: boolean = false) => {
    if (pageIndex >= processedPages.length || pageIndex < 0) return;
    if (processedPages[pageIndex].status !== "pending") return;

    // Mark as processing
    setProcessedPages(prev => prev.map((p, i) => 
      i === pageIndex ? { ...p, status: "processing" as const } : p
    ));

    try {
      const imageData = originalPages[pageIndex];
      
      // Get user's access token for authenticated API call
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) {
        throw new Error("Not authenticated");
      }
      
      // Call OCR edge function with user's JWT token
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-handwriting`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
          body: JSON.stringify({ imageData }),
        }
      );

      if (!response.ok) {
        throw new Error("OCR failed");
      }

      const { text } = await response.json();

      // Update processed page
      setProcessedPages(prev => prev.map((p, i) => 
        i === pageIndex ? { ...p, text, status: "completed" as const } : p
      ));

      if (isPriority) {
        toast({
          title: "First Page Ready",
          description: "Page 1 converted - other pages loading in background",
        });
      }
    } catch (error) {
      console.error("Error processing page:", error);
      setProcessedPages(prev => prev.map((p, i) => 
        i === pageIndex ? { ...p, status: "error" as const } : p
      ));

      toast({
        title: "OCR Error",
        description: `Couldn't rewrite page ${pageIndex + 1}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Screenshot functionality
  const handleScreenshotMouseDown = useCallback((e: React.MouseEvent) => {
    if (!screenshotMode || !rightPanelRef.current) return;
    const rect = rightPanelRef.current.getBoundingClientRect();
    setSelectionStart({
      x: e.clientX - rect.left + rightPanelRef.current.scrollLeft,
      y: e.clientY - rect.top + rightPanelRef.current.scrollTop
    });
    setSelectionEnd(null);
  }, [screenshotMode]);

  const handleScreenshotMouseMove = useCallback((e: React.MouseEvent) => {
    if (!screenshotMode || !selectionStart || !rightPanelRef.current) return;
    const rect = rightPanelRef.current.getBoundingClientRect();
    setSelectionEnd({
      x: e.clientX - rect.left + rightPanelRef.current.scrollLeft,
      y: e.clientY - rect.top + rightPanelRef.current.scrollTop
    });
  }, [screenshotMode, selectionStart]);

  const handleScreenshotMouseUp = useCallback(async () => {
    if (!screenshotMode || !selectionStart || !selectionEnd || !rightPanelRef.current) return;

    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    if (width < 20 || height < 20) {
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }

    setScreenshotMode(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsAnalyzing(true);

    try {
      toast({ title: "Analyzing...", description: "Extracting text and finding solutions" });

      const canvas = await html2canvas(rightPanelRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        x: x,
        y: y,
        width: width,
        height: height,
        scrollX: -rightPanelRef.current.scrollLeft,
        scrollY: -rightPanelRef.current.scrollTop,
      });

      const imageData = canvas.toDataURL('image/png');
      
      // Send to analyze-text for full analysis (OCR + topic extraction + videos + solution)
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession?.access_token) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-text`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authSession.access_token}`,
            },
            body: JSON.stringify({ imageData }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          setAnalysisResult(result);
          toast({ 
            title: "Analysis Complete", 
            description: `Found ${result.animationVideos.length + result.explanationVideos.length} videos` 
          });
        } else {
          throw new Error("Analysis failed");
        }
      }
    } catch (error) {
      console.error("Screenshot analysis error:", error);
      toast({ title: "Error", description: "Failed to analyze screenshot", variant: "destructive" });
    }

    setIsAnalyzing(false);
  }, [screenshotMode, selectionStart, selectionEnd, toast]);

  const downloadAsPDF = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we create your A4 PDF...",
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const a4Width = 210; // mm
      const a4Height = 297; // mm
      const margin = 10; // mm margin
      let isFirstPage = true;

      for (let i = 0; i < processedPages.length; i++) {
        const page = processedPages[i];
        if (page.status !== "completed" || !pageRefs.current[i]) continue;

        const element = pageRefs.current[i];
        if (!element) continue;

        // Capture the rendered content as canvas with high quality
        const canvas = await html2canvas(element, {
          scale: 4, // Very high scale for crisp text
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions to fit A4 with margins
        const availableWidth = a4Width - (margin * 2);
        const availableHeight = a4Height - (margin * 2);
        const canvasAspect = canvas.width / canvas.height;
        const a4Aspect = availableWidth / availableHeight;
        
        let imgWidth = availableWidth;
        let imgHeight = availableHeight;
        
        if (canvasAspect > a4Aspect) {
          imgHeight = availableWidth / canvasAspect;
        } else {
          imgWidth = availableHeight * canvasAspect;
        }

        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Center the image on the page with margins
        const xOffset = (a4Width - imgWidth) / 2;
        const yOffset = margin;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      }

      pdf.save(`rewritten_${file.name.replace(/\.[^/.]+$/, "")}_A4.pdf`);

      toast({
        title: "Downloaded",
        description: "A4 PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const downloadAsTXT = () => {
    try {
      // Combine all completed pages text
      const allText = processedPages
        .filter(p => p.status === "completed")
        .map((p, i) => `--- Page ${i + 1} ---\n\n${p.text}`)
        .join('\n\n');

      if (!allText.trim()) {
        toast({
          title: "No Content",
          description: "No rewritten pages available to download",
          variant: "destructive",
        });
        return;
      }

      const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rewritten_${file.name.replace(/\.[^/.]+$/, "")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded",
        description: "Text file downloaded successfully",
      });
    } catch (error) {
      console.error("Error generating TXT:", error);
      toast({
        title: "Error",
        description: "Failed to generate text file",
        variant: "destructive",
      });
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length >= 3) {
      setSelectedText(text);
      setShowSearchPrompt(true);
    }
  };

  const handleSearch = () => {
    if (selectedText && onTextSelect) {
      onTextSelect(selectedText);
      setShowSearchPrompt(false);
      setSelectedText("");
      window.getSelection()?.removeAllRanges();
    }
  };

  const handleDismissSearch = () => {
    setShowSearchPrompt(false);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  };

  const currentProcessedPage = processedPages[currentPage];
  const hasCompletedPages = processedPages.some(p => p.status === "completed");

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="border-b p-3 flex items-center justify-between bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
          <h2 className="font-semibold text-sm">Handwritten Page Rewriter (A4)</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Screenshot button */}
          <Button
            onClick={() => setScreenshotMode(!screenshotMode)}
            variant={screenshotMode ? "default" : "outline"}
            size="sm"
          >
            <Camera className="w-4 h-4 mr-1" />
            {screenshotMode ? "Cancel" : "Screenshot"}
          </Button>

          {/* Page navigation */}
          {originalPages.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                {currentPage + 1} / {originalPages.length}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(originalPages.length - 1, currentPage + 1))}
                disabled={currentPage === originalPages.length - 1}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Download dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" size="sm" disabled={!hasCompletedPages}>
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={downloadAsPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Download as PDF (A4)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadAsTXT}>
                <FileType className="w-4 h-4 mr-2" />
                Download as TXT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Rewritten A4 */}
        {showLeft && (
          <div className="flex-1 border-r flex flex-col bg-muted/20">
            <div className="border-b p-2 flex items-center justify-between bg-card/30">
              <span className="text-sm font-medium">Rewritten (Typed A4)</span>
              <Button
                onClick={() => setShowLeft(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div
              ref={leftPanelRef}
              className="flex-1 overflow-auto p-8"
              onMouseUp={handleTextSelection}
            >
              {currentProcessedPage?.status === "processing" && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Rewriting page...</p>
                  </div>
                </div>
              )}

              {currentProcessedPage?.status === "completed" && (
                <Card 
                  ref={(el) => { pageRefs.current[currentPage] = el; }}
                  className="max-w-[595px] mx-auto aspect-[1/1.414] p-12 bg-white dark:bg-white text-black shadow-lg overflow-auto"
                >
                  <div className="max-w-none select-text cursor-text font-serif text-base leading-[1.8] text-black">
                    {/* Word-by-word rendering with preserved positioning */}
                    {currentProcessedPage.text.split('\n').map((line, lineIdx) => (
                      <div key={lineIdx} className="min-h-[1.8em]">
                        {line.trim() ? (
                          <span className="inline">
                            {line.split(/(\s+)/).map((segment, segIdx) => (
                              <span 
                                key={segIdx} 
                                className={segment.trim() ? "inline" : "whitespace-pre"}
                              >
                                {segment}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <br />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {currentProcessedPage?.status === "error" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-destructive">
                    Couldn't rewrite this page. Please try again.
                  </p>
                </div>
              )}

              {currentProcessedPage?.status === "pending" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    Waiting to process...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Original */}
        {showRight && (
          <div className="flex-1 flex flex-col bg-muted/20">
            <div className="border-b p-2 flex items-center justify-between bg-card/30">
              <span className="text-sm font-medium">Original (Handwritten)</span>
              <Button
                onClick={() => setShowRight(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div
              ref={rightPanelRef}
              className={`flex-1 overflow-auto p-4 relative ${screenshotMode ? 'cursor-crosshair' : ''}`}
              onMouseDown={handleScreenshotMouseDown}
              onMouseMove={handleScreenshotMouseMove}
              onMouseUp={handleScreenshotMouseUp}
            >
              <img
                src={originalPages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full mx-auto shadow-lg"
                draggable={false}
              />
              
              {/* Selection rectangle */}
              {screenshotMode && selectionStart && selectionEnd && (
                <div
                  className="absolute border-2 border-primary bg-primary/20 pointer-events-none"
                  style={{
                    left: Math.min(selectionStart.x, selectionEnd.x),
                    top: Math.min(selectionStart.y, selectionEnd.y),
                    width: Math.abs(selectionEnd.x - selectionStart.x),
                    height: Math.abs(selectionEnd.y - selectionStart.y),
                  }}
                />
              )}
              
              {/* Screenshot mode overlay hint */}
              {screenshotMode && !selectionStart && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 pointer-events-none">
                  <p className="text-sm font-medium bg-card px-4 py-2 rounded-lg shadow-lg">
                    Drag to select area for OCR search
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Restore buttons when panels are closed */}
        {!showLeft && showRight && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Button onClick={() => setShowLeft(true)} variant="outline" size="sm">
              Show Rewritten
            </Button>
          </div>
        )}

        {!showRight && showLeft && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Button onClick={() => setShowRight(true)} variant="outline" size="sm">
              Show Original
            </Button>
          </div>
        )}

        {/* Analysis Results Panel */}
        {(analysisResult || isAnalyzing) && (
          <div className="w-[400px] border-l flex flex-col bg-card">
            <div className="border-b p-3 flex items-center justify-between bg-card/50">
              <h3 className="font-semibold text-sm">
                {isAnalyzing ? "Analyzing..." : `🎯 ${analysisResult?.topic || "Results"}`}
              </h3>
              <Button
                onClick={() => { setAnalysisResult(null); setPlayingVideoId(null); }}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {isAnalyzing ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Finding best solutions...</p>
                </div>
              </div>
            ) : analysisResult && (
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Solution/Description with LaTeX */}
                  {(analysisResult.solution || analysisResult.description) && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        📝 {analysisResult.isQuestion ? "Step-by-Step Solution" : "Overview"}
                      </h4>
                      <Card className="p-4 bg-muted/30">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2 text-foreground" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props} />,
                              p: ({node, ...props}) => <p className="mb-2 text-sm text-foreground leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />,
                              code: ({node, ...props}) => <code className="bg-background px-1 rounded text-sm" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 text-sm" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 text-sm" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            }}
                          >
                            {analysisResult.solution || analysisResult.description || ""}
                          </ReactMarkdown>
                        </div>
                      </Card>
                    </div>
                  )}

                  {/* Animation Videos */}
                  {analysisResult.animationVideos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        🎬 Animated Explanations ({analysisResult.animationVideos.length})
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.animationVideos.slice(0, 5).map((video) => (
                          <Card 
                            key={video.id} 
                            className="p-2 cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => setPlayingVideoId(video.videoId)}
                          >
                            <div className="flex gap-2">
                              <div className="relative w-24 h-16 shrink-0">
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title}
                                  className="w-full h-full object-cover rounded"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Explanation Videos */}
                  {analysisResult.explanationVideos.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        📚 {analysisResult.isQuestion ? "Solved Examples" : "Lectures"} ({analysisResult.explanationVideos.length})
                      </h4>
                      <div className="space-y-2">
                        {analysisResult.explanationVideos.slice(0, 5).map((video) => (
                          <Card 
                            key={video.id} 
                            className="p-2 cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => setPlayingVideoId(video.videoId)}
                          >
                            <div className="flex gap-2">
                              <div className="relative w-24 h-16 shrink-0">
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title}
                                  className="w-full h-full object-cover rounded"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded">
                                  <Play className="w-6 h-6 text-white fill-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium line-clamp-2">{video.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {playingVideoId && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center">
          <div className="relative w-full h-full max-w-5xl max-h-[80vh] m-4">
            <Button
              onClick={() => setPlayingVideoId(null)}
              variant="ghost"
              className="absolute -top-12 right-0 text-white hover:text-white/80"
            >
              <X className="w-6 h-6 mr-2" />
              Close Video
            </Button>
            <iframe
              src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Search prompt for selected text */}
      {showSearchPrompt && (
        <Card className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-3 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-fade-in max-w-sm w-11/12 md:max-w-md">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">Selected text:</p>
                <p className="text-sm font-medium line-clamp-2 break-words">{selectedText}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismissSearch}
                className="h-6 w-6 shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSearch}
              className="w-full gap-2"
              size="sm"
            >
              <Search className="w-4 h-4" />
              Find Videos
            </Button>
          </div>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-center text-xs text-muted-foreground py-2 px-2 border-t">
        📷 Use Screenshot to capture & analyze any area • 💡 Select text to search for videos
      </div>
    </div>
  );
};
