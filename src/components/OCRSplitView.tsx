import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Download, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

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
  const [convertedPdfBytes, setConvertedPdfBytes] = useState<Uint8Array | null>(null);
  const [showLeft, setShowLeft] = useState(true);
  const [showRight, setShowRight] = useState(true);
  const { toast } = useToast();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

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
      const fileType = file.type;
      
      if (fileType === "application/pdf") {
        await loadPDF();
      } else if (fileType.startsWith("image/")) {
        await loadImage();
      }
    } catch (error) {
      console.error("Error loading document:", error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive",
      });
    }
  };

  const loadPDF = async () => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;

    // Extract all page images
    const pages: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      pages.push(canvas.toDataURL());
    }

    setOriginalPages(pages);
    setProcessedPages(pages.map((_, i) => ({
      pageNumber: i,
      text: "",
      status: "pending"
    })));

    // Initialize empty PDF
    await initializeConvertedPdf();
  };

  const loadImage = async () => {
    const imageUrl = URL.createObjectURL(file);
    setOriginalPages([imageUrl]);
    setProcessedPages([{
      pageNumber: 0,
      text: "",
      status: "pending"
    }]);

    await initializeConvertedPdf();
  };

  const initializeConvertedPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const pdfBytes = await pdfDoc.save();
    setConvertedPdfBytes(pdfBytes);
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

      // Add to converted PDF
      await addPageToConvertedPdf(text);

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

  const addPageToConvertedPdf = async (text: string) => {
    if (!convertedPdfBytes) return;

    try {
      const pdfDoc = await PDFDocument.load(convertedPdfBytes);
      
      // A4 dimensions: 595 x 842 points
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      // Margins
      const margin = 50;
      const maxWidth = 595 - (2 * margin);
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      
      // Word wrap
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        
        if (width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      // Draw text
      let y = 842 - margin;
      for (const line of lines) {
        if (y < margin) break; // Don't overflow page
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
        y -= lineHeight;
      }
      
      const updatedPdfBytes = await pdfDoc.save();
      setConvertedPdfBytes(updatedPdfBytes);
    } catch (error) {
      console.error("Error adding page to PDF:", error);
    }
  };

  const downloadConvertedPdf = () => {
    if (!convertedPdfBytes) return;

    // Convert Uint8Array to regular array for Blob
    const blob = new Blob([new Uint8Array(convertedPdfBytes)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted_${file.name.replace(/\.[^/.]+$/, "")}_A4.pdf`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Converted A4 PDF downloaded successfully",
    });
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
                <Card className="max-w-[595px] mx-auto aspect-[1/1.414] p-12 bg-white text-black shadow-lg">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {currentProcessedPage.text}
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
