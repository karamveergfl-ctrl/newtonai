import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface HighlightInfo {
  pageNumber: number;
  text: string;
}

interface PDFViewerWithHighlightProps {
  file: File | string | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTextExtracted: (pages: Array<{ pageNumber: number; text: string }>) => void;
  onTextSelected: (text: string | null) => void;
  highlight?: HighlightInfo | null;
}

export function PDFViewerWithHighlight({
  file,
  currentPage,
  onPageChange,
  onTextExtracted,
  onTextSelected,
  highlight,
}: PDFViewerWithHighlightProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [pageInputValue, setPageInputValue] = useState(String(currentPage));
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pagesTextRef = useRef<Map<number, string>>(new Map());

  // Track container dimensions for auto-fit
  useEffect(() => {
    const updateDimensions = () => {
      if (scrollAreaRef.current) {
        setContainerDimensions({
          width: scrollAreaRef.current.clientWidth,
          height: scrollAreaRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Also observe the container for size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (scrollAreaRef.current) {
      resizeObserver.observe(scrollAreaRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate page width based on auto-fit or manual scale
  const getPageWidth = useCallback(() => {
    if (!containerDimensions.width) return 600;
    
    if (isAutoFit) {
      // Use 95% of container width, accounting for padding
      const availableWidth = containerDimensions.width - 32; // subtract padding
      const availableHeight = containerDimensions.height - 32;
      // Assume typical PDF aspect ratio of ~0.77 (letter size)
      const heightBasedWidth = availableHeight * 0.77;
      return Math.min(availableWidth, heightBasedWidth, 900); // cap at 900px max
    }
    
    // Manual zoom mode - use scale percentage
    return 600 * scale;
  }, [isAutoFit, scale, containerDimensions]);

  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const onDocumentLoadSuccess = useCallback(async ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const onPageLoadSuccess = useCallback(async (page: any) => {
    try {
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      pagesTextRef.current.set(page.pageNumber, text);

      // Once all pages are loaded, extract all text
      if (pagesTextRef.current.size === numPages && numPages > 0) {
        const allPages = Array.from(pagesTextRef.current.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([pageNumber, text]) => ({ pageNumber, text }));
        onTextExtracted(allPages);
      }
    } catch (error) {
      console.error('Error extracting text:', error);
    }
  }, [numPages, onTextExtracted]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      onTextSelected(selection.toString().trim());
    } else {
      onTextSelected(null);
    }
  }, [onTextSelected]);

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const page = parseInt(pageInputValue);
      if (page >= 1 && page <= numPages) {
        onPageChange(page);
      } else {
        setPageInputValue(String(currentPage));
      }
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      onPageChange(page);
    }
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <p className="text-muted-foreground">No PDF loaded</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-background gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <Input
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onKeyDown={handlePageInput}
              className="w-12 h-8 text-center text-sm"
            />
            <span className="text-sm text-muted-foreground">/ {numPages}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsAutoFit(false);
              setScale(s => Math.max(0.5, s - 0.1));
            }}
            disabled={!isAutoFit && scale <= 0.5}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-14 text-center">
            {isAutoFit ? 'Fit' : `${Math.round(scale * 100)}%`}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setIsAutoFit(false);
              setScale(s => Math.min(2, s + 0.1));
            }}
            disabled={!isAutoFit && scale >= 2}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAutoFit(true)}
            className={isAutoFit ? 'bg-primary/10' : ''}
            title="Fit to Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div 
        ref={scrollAreaRef}
        className="flex-1 overflow-auto bg-muted/20"
      >
        <div 
          className="flex justify-center items-start p-4 min-h-full"
          onMouseUp={handleTextSelection}
          ref={containerRef}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            }
            error={
              <div className="text-center p-8 text-destructive">
                Failed to load PDF
              </div>
            }
          >
            {isLoading ? (
              <Skeleton className="w-[600px] h-[800px]" />
            ) : (
              <Page
                pageNumber={currentPage}
                width={getPageWidth()}
                onLoadSuccess={onPageLoadSuccess}
                loading={<Skeleton className="w-full h-[600px]" />}
                className="shadow-lg"
              />
            )}
          </Document>
        </div>
      </div>

      {/* Highlight overlay - shown when a citation is clicked */}
      {highlight && highlight.pageNumber === currentPage && (
        <div className="absolute bottom-4 left-4 right-4 bg-primary/10 border border-primary/30 rounded-lg p-3 backdrop-blur-sm">
          <p className="text-sm font-medium text-primary">Highlighted from Page {highlight.pageNumber}:</p>
          <p className="text-sm text-muted-foreground italic mt-1">"{highlight.text}"</p>
        </div>
      )}
    </div>
  );
}
