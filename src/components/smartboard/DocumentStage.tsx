import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { ChevronLeft, ChevronRight, FileUp, Loader2, Sparkles, X, ZoomIn, ZoomOut } from "lucide-react";
import { ensurePdfWorkerConfigured } from "@/lib/pdfjsWorker";
import {
  extractBoardDocument,
  readSmartBoardSession,
  type ExtractedDocPage,
} from "@/lib/smartboardSession";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

interface Props {
  onFindVideos: (topic: string) => void;
}

const ACCEPTED = ".pdf,.docx,.pptx,image/png,image/jpeg,image/webp";
const OFFICE_MAX_BYTES = 15 * 1024 * 1024;
const PDF_MAX_BYTES = 50 * 1024 * 1024;

export function DocumentStage({ onFindVideos }: Props) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"pdf" | "image" | "text" | null>(null);
  const [textPages, setTextPages] = useState<ExtractedDocPage[]>([]);
  const [extracting, setExtracting] = useState(false);
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

  const acceptFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    const isOffice = lower.endsWith(".docx") || lower.endsWith(".pptx");

    if (!isPdf && !isImage && !isOffice) {
      setError("Please upload a PDF, Word (.docx), PowerPoint (.pptx) or an image.");
      return;
    }
    if (isOffice && file.size > OFFICE_MAX_BYTES) {
      setError("Word and PowerPoint files must be under 15 MB. Please export it as a PDF instead.");
      return;
    }
    if (!isOffice && file.size > PDF_MAX_BYTES) {
      setError("That file is larger than 50 MB. Please upload a smaller file.");
      return;
    }

    setError(null);
    setFileName(file.name);
    setPageNumber(1);
    setSelection("");

    if (isOffice) {
      const session = readSmartBoardSession();
      if (!session) {
        setError("This board is no longer activated. Please re-activate it to open documents.");
        return;
      }
      setExtracting(true);
      const { data, message } = await extractBoardDocument(session.deviceToken, file);
      setExtracting(false);
      if (!data?.pages?.length) {
        setError(
          `${message ?? "This document could not be read."} You can also export it as a PDF and upload that instead.`,
        );
        setFileName("");
        return;
      }
      setTextPages(data.pages);
      setNumPages(data.pages.length);
      setFileKind("text");
      setFileUrl("text");
      return;
    }

    setTextPages([]);
    setFileUrl(URL.createObjectURL(file));
    setFileKind(isPdf ? "pdf" : "image");
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
    setTextPages([]);
  };

  if (!fileUrl) {
    return (
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void acceptFile(e.dataTransfer.files?.[0]);
        }}
        className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/50 p-10 text-center"
      >
        {extracting ? (
          <Loader2 className="h-14 w-14 animate-spin text-indigo-400" aria-hidden="true" />
        ) : (
          <FileUp className="h-14 w-14 text-slate-500" aria-hidden="true" />
        )}
        <p className="text-2xl font-semibold text-white">Upload your teaching material</p>
        <p className="text-lg text-slate-400">
          {extracting
            ? "Reading your document…"
            : "Drop a PDF, Word, PowerPoint or image file here, then select any text to instantly find animation videos on that topic."}
        </p>
        {error && <p className="text-lg font-medium text-red-400">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => void acceptFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={extracting}
          className="mt-2 min-h-[64px] rounded-xl bg-indigo-600 px-10 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
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
          {(fileKind === "pdf" || fileKind === "text") && (
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
        ) : fileKind === "text" ? (
          <article
            className="mx-auto max-w-4xl space-y-5 rounded-xl bg-slate-800/60 p-8 text-slate-100"
            style={{ fontSize: `${scale}rem`, lineHeight: 1.6 }}
          >
            <h2 className="font-bold text-white" style={{ fontSize: `${scale * 1.6}rem` }}>
              {textPages[pageNumber - 1]?.title}
            </h2>
            {textPages[pageNumber - 1]?.blocks.map((block, i) => (
              <p key={i} className="text-slate-200">
                {block}
              </p>
            ))}
            {textPages[pageNumber - 1]?.blocks.length === 0 && (
              <p className="text-slate-400">This page has no additional text.</p>
            )}
          </article>
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