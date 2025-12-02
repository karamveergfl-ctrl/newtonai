import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

export const OCRSplitView = ({ file, onClose, onTextSelect }: OCRSplitViewProps) => {
  const [originalPages, setOriginalPages] = useState<string[]>([]);
  const [processedPages, setProcessedPages] = useState<ProcessedPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const { toast } = useToast();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    loadDocument();
  }, [file]);

  useEffect(() => {
    // Lazy OCR: process current page + 3 ahead
    const pagesToProcess = [currentPage, currentPage + 1, currentPage + 2, currentPage + 3]
      .filter(p => p < processedPages.length && processedPages[p].status === "pending");
    
    pagesToProcess.forEach(pageNum => processPage(pageNum));
  }, [currentPage, processedPages.length]);

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
    const imageUrl = URL.createObjectURL(file);
    setOriginalPages([imageUrl]);
    setProcessedPages([{
      pageNumber: 0,
      text: "",
      status: "pending"
    }]);
    pageRefs.current = [null];
  };

  const processPage = async (pageIndex: number) => {
    if (pageIndex >= processedPages.length || pageIndex < 0) return;
    if (processedPages[pageIndex].status !== "pending") return;

    // Mark as processing
    setProcessedPages(prev => prev.map((p, i) => 
      i === pageIndex ? { ...p, status: "processing" as const } : p
    ));

    try {
      const imageData = originalPages[pageIndex];
      
      // Call OCR edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-handwriting`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      toast({
        title: "Page Rewritten",
        description: `Page ${pageIndex + 1} converted successfully`,
      });
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

  const downloadConvertedPdf = async () => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we create your PDF...",
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const a4Width = 210; // mm
      const a4Height = 297; // mm
      let isFirstPage = true;

      for (let i = 0; i < processedPages.length; i++) {
        const page = processedPages[i];
        if (page.status !== "completed" || !pageRefs.current[i]) continue;

        const element = pageRefs.current[i];
        if (!element) continue;

        // Capture the rendered content as canvas with high quality
        const canvas = await html2canvas(element, {
          scale: 3, // Higher scale for better quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions to fit A4 while maintaining aspect ratio
        const canvasAspect = canvas.width / canvas.height;
        const a4Aspect = a4Width / a4Height;
        
        let imgWidth = a4Width;
        let imgHeight = a4Height;
        
        if (canvasAspect > a4Aspect) {
          // Canvas is wider - fit to width
          imgHeight = a4Width / canvasAspect;
        } else {
          // Canvas is taller - fit to height
          imgWidth = a4Height * canvasAspect;
        }

        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;

        // Center the image on the page
        const xOffset = (a4Width - imgWidth) / 2;
        const yOffset = 0;
        
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      }

      pdf.save(`converted_${file.name.replace(/\.[^/.]+$/, "")}_A4.pdf`);

      toast({
        title: "Downloaded",
        description: "Converted A4 PDF downloaded successfully",
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


  const handleTextSelection = (panel: "left" | "right") => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && onTextSelect) {
      onTextSelect(selectedText);
    }
  };

  const currentProcessedPage = processedPages[currentPage];

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
          
          <Button onClick={downloadConvertedPdf} variant="default" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Download Converted PDF (A4)
          </Button>
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
              onMouseUp={() => handleTextSelection("left")}
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
                  className="max-w-[595px] mx-auto aspect-[1/1.414] p-12 bg-white text-black shadow-lg overflow-auto"
                >
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4 text-black" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-3 text-black" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 text-black" {...props} />,
                        p: ({node, ...props}) => <p className="mb-3 text-black leading-relaxed" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-3 text-black" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-6 mb-3 text-black" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1 text-black" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-black" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-black" {...props} />,
                        code: ({node, ...props}) => <code className="bg-gray-100 px-1 rounded text-black" {...props} />,
                        table: ({node, ...props}) => <table className="border-collapse border border-gray-300 my-3 text-black" {...props} />,
                        th: ({node, ...props}) => <th className="border border-gray-300 px-2 py-1 bg-gray-50 text-black" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-300 px-2 py-1 text-black" {...props} />,
                      }}
                    >
                      {currentProcessedPage.text}
                    </ReactMarkdown>
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
              className="flex-1 overflow-auto p-4"
              onMouseUp={() => handleTextSelection("right")}
            >
              <img
                src={originalPages[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full mx-auto shadow-lg"
              />
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
      </div>
    </div>
  );
};
