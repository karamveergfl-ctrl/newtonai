import { useState, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Highlighter, Pen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnnotationLayer } from "./AnnotationLayer";
import { TextSelectionMenu } from "./TextSelectionMenu";
import { useDocumentAnnotations, type Annotation } from "@/hooks/useDocumentAnnotations";
import { cn } from "@/lib/utils";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentTeachingViewProps {
  fileUrl: string;
  sessionId: string;
  onClose?: () => void;
  onSearchVideo?: (text: string) => void;
  onGenerateQuiz?: (text: string) => void;
  onExplain?: (text: string) => void;
  onAddToNotes?: (text: string) => void;
}

export function DocumentTeachingView({
  fileUrl,
  sessionId,
  onClose,
  onSearchVideo,
  onGenerateQuiz,
  onExplain,
  onAddToNotes,
}: DocumentTeachingViewProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [annotationTool, setAnnotationTool] = useState<"draw" | "highlight">("highlight");
  const [annotationColor, setAnnotationColor] = useState("#FBBF24");
  const [pageSize, setPageSize] = useState({ width: 800, height: 600 });
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    addAnnotation,
    getPageAnnotations,
    clearPageAnnotations,
    syncAnnotationsToSpotlight,
  } = useDocumentAnnotations({ sessionId });

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    setPageSize({ width: page.width, height: page.height });
  }, []);

  const handleAnnotationAdd = useCallback(
    (annotation: Annotation) => {
      addAnnotation(currentPage, annotation);
      syncAnnotationsToSpotlight(currentPage, `Page ${currentPage + 1}`);
    },
    [addAnnotation, currentPage, syncAnnotationsToSpotlight]
  );

  const goPage = useCallback(
    (delta: number) => {
      setCurrentPage((p) => Math.max(0, Math.min(numPages - 1, p + delta)));
    },
    [numPages]
  );

  const annotationColors = ["#FBBF24", "#34D399", "#60A5FA", "#F87171"];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant={annotationTool === "highlight" ? "default" : "ghost"}
            size="sm"
            onClick={() => setAnnotationTool("highlight")}
            className="min-h-[40px] min-w-[40px]"
          >
            <Highlighter className="w-4 h-4" />
          </Button>
          <Button
            variant={annotationTool === "draw" ? "default" : "ghost"}
            size="sm"
            onClick={() => setAnnotationTool("draw")}
            className="min-h-[40px] min-w-[40px]"
          >
            <Pen className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          {annotationColors.map((c) => (
            <button
              key={c}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform",
                annotationColor === c ? "border-foreground scale-125" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
              onClick={() => setAnnotationColor(c)}
            />
          ))}
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearPageAnnotations(currentPage)}
            className="min-h-[40px]"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground tabular-nums">
            {currentPage + 1} / {numPages || "?"}
          </span>
        </div>
      </div>

      {/* Document with thumbnail strip */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Thumbnail strip */}
        {numPages > 1 && (
          <div className="w-[72px] shrink-0 border-r border-border bg-muted/30 overflow-y-auto py-2 px-1.5 space-y-1.5 scrollbar-hide">
            <Document file={fileUrl}>
              {Array.from({ length: numPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={cn(
                    "w-full rounded-md overflow-hidden border-2 transition-all",
                    currentPage === i
                      ? "border-primary ring-1 ring-primary/30 shadow-sm"
                      : "border-transparent hover:border-border"
                  )}
                >
                  <Page
                    pageNumber={i + 1}
                    width={56}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                  <span className="block text-[9px] text-muted-foreground text-center py-0.5">
                    {i + 1}
                  </span>
                </button>
              ))}
            </Document>
          </div>
        )}

        {/* Main page */}
        <div className="flex-1 overflow-auto flex items-center justify-center relative" ref={contentRef}>
          <div className="relative">
            <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
              <Page
                pageNumber={currentPage + 1}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                width={Math.min(900, window.innerWidth * 0.65)}
              />
            </Document>

            {/* Annotation overlay */}
            <AnnotationLayer
              width={pageSize.width}
              height={pageSize.height}
              annotations={getPageAnnotations(currentPage)}
              tool={annotationTool}
              color={annotationColor}
              lineWidth={annotationTool === "highlight" ? 20 : 3}
              onAnnotationAdd={handleAnnotationAdd}
              pageIndex={currentPage}
            />

            {/* Text selection floating menu */}
            <TextSelectionMenu
              containerRef={contentRef}
              onSearchVideo={onSearchVideo}
              onGenerateQuiz={onGenerateQuiz}
              onExplain={onExplain}
              onAddToNotes={onAddToNotes}
            />
          </div>
        </div>
      </div>

      {/* Page navigation */}
      <div className="flex items-center justify-center gap-4 py-3 border-t border-border bg-card shrink-0">
        <Button
          variant="outline"
          size="lg"
          onClick={() => goPage(-1)}
          disabled={currentPage <= 0}
          className="min-h-[48px] min-w-[48px]"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => goPage(1)}
          disabled={currentPage >= numPages - 1}
          className="min-h-[48px] min-w-[48px]"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
