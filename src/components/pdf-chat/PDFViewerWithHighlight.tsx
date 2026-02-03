import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker is configured globally in src/lib/pdfjsWorker.ts (imported in main.tsx)

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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ page: number; index: number }>>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [highlightAnimation, setHighlightAnimation] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (scrollAreaRef.current) {
      resizeObserver.observe(scrollAreaRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  // Trigger highlight animation when highlight changes
  useEffect(() => {
    if (highlight) {
      setHighlightAnimation(true);
      const timer = setTimeout(() => setHighlightAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlight]);

  // Calculate page width based on auto-fit or manual scale (width-first approach)
  const getPageWidth = useCallback(() => {
    if (!containerDimensions.width) return 600;
    
    if (isAutoFit) {
      // Width-first approach - fill 95% of available width for better readability
      const availableWidth = (containerDimensions.width - 32) * 0.95;
      return Math.max(availableWidth, 400); // Minimum 400px width
    }
    
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

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results: Array<{ page: number; index: number }> = [];
    const query = searchQuery.toLowerCase();

    pagesTextRef.current.forEach((text, pageNumber) => {
      let index = 0;
      let pos = text.toLowerCase().indexOf(query);
      while (pos !== -1) {
        results.push({ page: pageNumber, index });
        index++;
        pos = text.toLowerCase().indexOf(query, pos + 1);
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(0);

    if (results.length > 0) {
      onPageChange(results[0].page);
    }
  }, [searchQuery, onPageChange]);

  const navigateSearch = (direction: 'next' | 'prev') => {
    if (searchResults.length === 0) return;

    let newIndex = currentSearchIndex;
    if (direction === 'next') {
      newIndex = (currentSearchIndex + 1) % searchResults.length;
    } else {
      newIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentSearchIndex(newIndex);
    onPageChange(searchResults[newIndex].page);
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20">
        <p className="text-muted-foreground">No PDF loaded</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10 relative">
      {/* Search Bar */}
      {showSearch && (
        <div className="absolute top-14 right-4 z-20 flex items-center gap-2 bg-popover border rounded-lg shadow-lg p-2 animate-in slide-in-from-top-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Find in document..."
            className="w-48 h-8"
          />
          {searchResults.length > 0 && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {currentSearchIndex + 1} / {searchResults.length}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateSearch('prev')}
            disabled={searchResults.length === 0}
            className="h-8 w-8"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateSearch('next')}
            disabled={searchResults.length === 0}
            className="h-8 w-8"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

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
            onClick={() => setShowSearch(!showSearch)}
            className={showSearch ? 'bg-primary/10' : ''}
            title="Search (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
          </Button>
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
          onTouchEnd={handleTextSelection}
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
        <div 
          className={cn(
            "absolute bottom-4 left-4 right-4 border rounded-lg p-3 backdrop-blur-sm transition-all duration-500",
            highlightAnimation 
              ? "bg-primary/20 border-primary shadow-lg shadow-primary/20 animate-pulse" 
              : "bg-primary/10 border-primary/30"
          )}
        >
          <p className="text-sm font-medium text-primary">Cited from Page {highlight.pageNumber}:</p>
          <p className="text-sm text-muted-foreground italic mt-1 line-clamp-3">"{highlight.text}"</p>
        </div>
      )}
    </div>
  );
}
