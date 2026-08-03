import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Document, Page } from "react-pdf";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  FileUp,
  ImageIcon,
  Loader2,
  Maximize2,
  Search,
  Sparkles,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
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
  /** Notifies the classroom when a document is opened/closed. */
  onOpenChange?: (open: boolean, docKey: string) => void;
  /** Rendered as a thin rail above the document (animation video results). */
  topSlot?: ReactNode;
  /** Rendered above everything while a document is open (teacher notes panel). */
  sideSlot?: ReactNode;
}

const ACCEPTED = ".pdf,.doc,.docx,.ppt,.pptx,image/png,image/jpeg,image/webp";
const OFFICE_MAX_BYTES = 15 * 1024 * 1024;
const PDF_MAX_BYTES = 50 * 1024 * 1024;

export function DocumentStage({ onFindVideos, onOpenChange, topSlot, sideSlot }: Props) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileKind, setFileKind] = useState<"pdf" | "image" | "text" | null>(null);
  const [textPages, setTextPages] = useState<ExtractedDocPage[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [fitWidth, setFitWidth] = useState(true);
  const [selection, setSelection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(1000);

  useEffect(() => {
    ensurePdfWorkerConfigured();
  }, []);

  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl !== "text") URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  useEffect(() => {
    onOpenChange?.(Boolean(fileUrl), fileName);
  }, [fileUrl, fileName, onOpenChange]);

  useEffect(() => {
    if (!fileUrl) return;
    const measure = () => setStageWidth(stageRef.current?.clientWidth ?? window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [fileUrl]);

  const acceptFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
    const isImage = file.type.startsWith("image/");
    const isOffice = /\.(docx?|pptx?)$/.test(lower);

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
    setZoom(100);
    setFitWidth(true);

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

  /* ------------------------------- upload card ------------------------------ */
  if (!fileUrl) {
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void acceptFile(e.dataTransfer.files?.[0]);
        }}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${
          dragOver ? "border-teal-400 bg-teal-500/5" : "border-teal-700/60 bg-[#0C1B33]/70"
        }`}
      >
        <span className="pointer-events-none absolute left-6 top-6 h-2 w-2 rounded-full bg-teal-500/60" />
        <span className="pointer-events-none absolute right-6 top-6 h-3 w-3 rounded-full bg-teal-400/70" />
        <span className="pointer-events-none absolute bottom-6 left-6 h-3 w-3 rounded-full bg-teal-400/70" />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={extracting}
          className="mx-auto flex min-h-[52px] items-center gap-2 rounded-full bg-teal-600 px-7 text-lg font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          Click to upload
        </button>

        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="flex h-[74px] w-[74px] items-center justify-center rounded-2xl border border-teal-700/70 bg-teal-500/5">
            {extracting ? (
              <Loader2 className="h-8 w-8 animate-spin text-teal-400" aria-hidden="true" />
            ) : (
              <Upload className="h-8 w-8 text-teal-400" aria-hidden="true" />
            )}
          </span>
          <span className="flex h-[74px] w-[74px] items-center justify-center rounded-2xl border border-teal-700/70 bg-teal-500/5">
            <ImageIcon className="h-8 w-8 text-teal-400" aria-hidden="true" />
          </span>
        </div>

        <p className="mt-6 text-3xl font-bold text-white">Upload Document</p>
        <p className="mt-2 text-lg text-slate-300">
          {extracting ? (
            "Reading your document…"
          ) : (
            <>
              Drop files here or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="underline decoration-teal-400 underline-offset-4 hover:text-teal-300"
              >
                click to browse
              </button>
            </>
          )}
        </p>
        <p className="mt-1 text-base text-slate-400">Images, PDF, Doc, Docx, PPT, PPTX • Max 50MB</p>
        {error && <p className="mt-3 text-lg font-medium text-red-400">{error}</p>}

        <div className="mx-auto mt-6 max-w-2xl space-y-3 border-t border-slate-700/70 pt-6 text-left">
          <div className="flex items-start gap-3 rounded-2xl bg-slate-800/40 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
              <Search className="h-5 w-5 text-teal-400" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-white">Topic-Based Video Search</span>
              <span className="block text-base text-slate-400">
                Select text to find curated animation videos
              </span>
            </span>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-slate-800/40 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-500/10">
              <Camera className="h-5 w-5 text-teal-400" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-semibold text-white">Teach from any material</span>
              <span className="block text-base text-slate-400">
                Open slides or notes full screen and write alongside them
              </span>
            </span>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => void acceptFile(e.target.files?.[0])}
        />
      </div>
    );
  }

  /* ---------------------------- full-screen viewer --------------------------- */
  const pageWidth = fitWidth
    ? Math.max(360, stageWidth - 48)
    : Math.max(360, ((stageWidth - 48) * zoom) / 100);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-[#0A1628]">
      {topSlot}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-2">
        <p className="max-w-[28%] truncate text-base font-semibold text-white">{fileName}</p>

        <div className="flex items-center gap-1 rounded-2xl border border-slate-700 bg-slate-800/80 px-2 py-1">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
            disabled={pageNumber <= 1}
            className="rounded-xl p-2 text-white hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="px-2 text-base tabular-nums text-slate-200">
            {pageNumber} / {numPages || "?"}
          </span>
          <button
            type="button"
            aria-label="Next page"
            onClick={() => setPageNumber((p) => Math.min(numPages || p, p + 1))}
            disabled={numPages > 0 && pageNumber >= numPages}
            className="rounded-xl p-2 text-white hover:bg-slate-700 disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <span className="mx-1 h-6 w-px bg-slate-700" />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => {
              setFitWidth(false);
              setZoom((z) => Math.max(50, z - 10));
            }}
            className="rounded-xl p-2 text-white hover:bg-slate-700"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <span className="w-14 text-center text-base tabular-nums text-slate-200">
            {fitWidth ? "Fit" : `${zoom}%`}
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => {
              setFitWidth(false);
              setZoom((z) => Math.min(300, z + 10));
            }}
            className="rounded-xl p-2 text-white hover:bg-slate-700"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Fit to width"
            onClick={() => setFitWidth(true)}
            className="rounded-xl p-2 text-white hover:bg-slate-700"
          >
            <Maximize2 className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={clearDocument}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-600 px-4 text-base font-medium text-slate-200 hover:bg-slate-800"
        >
          <X className="h-5 w-5" aria-hidden="true" /> Close document
        </button>
      </div>

      <div
        ref={stageRef}
        onMouseUp={handleSelection}
        onTouchEnd={handleSelection}
        className="flex-1 overflow-auto bg-slate-950/60 p-6"
      >
        {fileKind === "pdf" ? (
          <Document
            file={fileUrl}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setError("This PDF could not be opened.")}
            loading={<p className="p-6 text-lg text-slate-400">Loading document…</p>}
            className="flex justify-center"
          >
            <Page pageNumber={pageNumber} width={pageWidth} renderAnnotationLayer={false} renderTextLayer />
          </Document>
        ) : fileKind === "text" ? (
          <article
            className="mx-auto max-w-5xl space-y-5 rounded-2xl bg-slate-900/70 p-10 text-slate-100"
            style={{ fontSize: `${(fitWidth ? 120 : zoom) / 100}rem`, lineHeight: 1.6 }}
          >
            <h2 className="font-bold text-white" style={{ fontSize: `${((fitWidth ? 120 : zoom) / 100) * 1.6}rem` }}>
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
          <img src={fileUrl} alt={fileName} className="mx-auto" style={{ width: pageWidth }} />
        )}
        {error && <p className="mt-4 text-center text-lg text-red-400">{error}</p>}
      </div>

      {selection && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-[#0C1B33] px-4 py-3">
          <p className="max-w-[55%] truncate text-lg text-slate-300">
            Selected: <span className="font-semibold text-white">{selection}</span>
          </p>
          <button
            type="button"
            onClick={() => onFindVideos(selection)}
            className="flex min-h-[60px] items-center gap-2 rounded-xl bg-teal-600 px-8 text-lg font-semibold text-white hover:bg-teal-500"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Find animation videos
          </button>
        </div>
      )}

      {sideSlot}
    </div>
  );
}

export default DocumentStage;
