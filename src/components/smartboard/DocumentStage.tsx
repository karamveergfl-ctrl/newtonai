import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { ChevronLeft, ChevronRight, FileUp, Sparkles, X, ZoomIn, ZoomOut } from "lucide-react";
import { ensurePdfWorkerConfigured } from "@/lib/pdfjsWorker";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

interface Props {
  onFindVideos: (topic: string) => void;
}

const ACCEPTED = ".pdf,image/png,image/jpeg,image/webp";

export function DocumentStage({ onFindVideos }: Props) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"pdf" | "image" | null>(null);
  const [fileName, setFileName] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [selection, setSelection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ensurePdfWorkerConfigured();
  }, []);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const acceptFile = useCallback((file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      setError("Please upload a PDF or an image. Other formats are not supported on the SmartBoard.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("That file is larger than 50 MB. Please upload a smaller file.");
      return;
    }
    setError(null);
    setFileUrl(URL.createObjectURL(file));
    setFileKind(isPdf ? "pdf" : "image");
    setFileName(file.name);
    setPageNumber(1);
  }, []);

  const handleSelection = useCallback(() => {
    const text = window.getSelection()?.toString().trim() ?? "";
    setSelection(text.length >= 3 && text.length <= 120 ? text : "");
  }, []);

  const clearDocument = () => {
    setFileUrl(null);
    setFileKind(null);
    setFileName("");
    setSelection("");
    setNumPages(0);
  };

  if (!fileUrl) {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          acceptFile(e.dataTransfer.files?.[0]);
        }}
        className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/50 p-10 text-center"
      >
        <FileUp className="h-14 w-14 text-slate-500" aria-hidden="true" />
        <p className="text-2xl font-semibold text-white">Upload your teaching material</p>
        <p className="text-lg text-slate-400">
          Drop a PDF or image here, then select any text to instantly find animation videos on that topic.
        </p>
        {error && <p className="text-lg font-medium text-red-400">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 min-h-[64px] rounded-xl bg-indigo-600 px-10 text-lg font-semibold text-white hover:bg-indigo-500"
        >
          Choose a file
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700 p-3">
        <p className="max-w-[40%] truncate text-lg font-semibold text-white">{fileName}</p>
        <div className="flex items-center gap-2">
          {fileKind === "pdf" && (
            <>
              <button
                type="button"
                aria-label="Previous page"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                className="flex min-h-[52px] items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-4 text-base font-medium text-white hover:bg-slate-600"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Prev
              </button>
              <span className="px-2 text-base text-slate-300">
                Page {pageNumber} of {numPages || "…"}
              </span>
              <button
                type="button"
                aria-label="Next page"
                onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
                className="flex min-h-[52px] items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-4 text-base font-medium text-white hover:bg-slate-600"
              >
                Next <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)))}
            className="flex min-h-[52px] items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-4 text-base font-medium text-white hover:bg-slate-600"
          >
            <ZoomOut className="h-5 w-5" aria-hidden="true" /> Zoom out
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3, +(s + 0.2).toFixed(1)))}
            className="flex min-h-[52px] items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-4 text-base font-medium text-white hover:bg-slate-600"
          >
            <ZoomIn className="h-5 w-5" aria-hidden="true" /> Zoom in
          </button>
          <button
            type="button"
            onClick={clearDocument}
            className="flex min-h-[52px] items-center gap-1 rounded-lg border border-slate-600 bg-slate-700 px-4 text-base font-medium text-white hover:bg-slate-600"
          >
            <X className="h-5 w-5" aria-hidden="true" /> Close document
          </button>
        </div>
      </div>

      <div
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        className="max-h-[65vh] overflow-auto bg-slate-900 p-4"
      >
        {fileKind === "pdf" ? (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setError("This PDF could not be opened.")}
            loading={<p className="p-6 text-lg text-slate-400">Loading document…</p>}
            className="flex justify-center"
          >
            <Page pageNumber={pageNumber} scale={scale} renderAnnotationLayer={false} renderTextLayer />
          </Document>
        ) : (
          <img src={fileUrl} alt={fileName} className="mx-auto max-w-full" style={{ width: `${scale * 60}%` }} />
        )}
      </div>

      {selection && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-700 bg-slate-800 p-3">
          <p className="max-w-[55%] truncate text-lg text-slate-300">
            Selected: <span className="font-semibold text-white">{selection}</span>
          </p>
          <button
            type="button"
            onClick={() => onFindVideos(selection)}
            className="flex min-h-[64px] items-center gap-2 rounded-xl bg-teal-600 px-8 text-lg font-semibold text-white hover:bg-teal-500"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Find animation videos
          </button>
        </div>
      )}
    </div>
  );
}

export default DocumentStage;