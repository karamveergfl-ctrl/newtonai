import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eraser, FileText, Highlighter, Loader2, LogOut, Pen, PenLine, Search, Trash2, Undo2, X } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import DocumentStage from "@/components/smartboard/DocumentStage";
import AnimationResultsPanel from "@/components/smartboard/AnimationResultsPanel";
import SmartBoardVideoPlayer from "@/components/smartboard/SmartBoardVideoPlayer";
import IdleScreen from "@/components/smartboard/IdleScreen";
import { WhiteboardCanvas, type WhiteboardCanvasHandle } from "@/components/smartboard/WhiteboardCanvas";
import { useWhiteboardState } from "@/hooks/useWhiteboardState";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import newtonLogoN from "@/assets/newtonai-logo-n.png.asset.json";
import {
  clearSmartBoardSession,
  logBoardPlay,
  readSmartBoardSession,
  searchBoardVideos,
  verifyBoardSession,
  writeSmartBoardSession,
  type SmartBoardSession,
  type SmartBoardVideo,
} from "@/lib/smartboardSession";

const IDLE_MS = 10 * 60 * 1000;

export default function SmartBoardClassroom() {
  const navigate = useNavigate();
  // Read synchronously on first render so the board name paints instantly.
  const [session, setSession] = useState<SmartBoardSession | null>(() => readSmartBoardSession());
  const [clock, setClock] = useState(new Date());
  const [idle, setIdle] = useState(false);
  const [term, setTerm] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [videos, setVideos] = useState<SmartBoardVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<SmartBoardVideo | null>(null);
  const [docOpen, setDocOpen] = useState(false);
  const [mode, setMode] = useState<"document" | "whiteboard">("document");
  const [exitOpen, setExitOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const idleTimer = useRef<number | null>(null);

  const board = useWhiteboardState();
  const canvasRef = useRef<WhiteboardCanvasHandle>(null);

  const handleDocOpenChange = useCallback((open: boolean) => {
    setDocOpen(open);
  }, []);

  /* ---- session validation ---- */
  useEffect(() => {
    const local = readSmartBoardSession();
    if (!local) {
      navigate("/smartboard/activate", { replace: true });
      return;
    }
    let cancelled = false;
    verifyBoardSession(local.deviceToken).then(({ data, errorCode }) => {
      if (cancelled) return;
      if (data?.board) {
        const next = { ...local, ...data.board };
        setSession(next);
        writeSmartBoardSession(next);
      } else if (errorCode === "invalid_token") {
        clearSmartBoardSession();
        navigate("/smartboard/activate", { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  /* ---- clock ---- */
  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* ---- idle detection ---- */
  const resetIdle = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }, []);

  useEffect(() => {
    resetIdle();
    const events: (keyof WindowEventMap)[] = ["pointerdown", "mousedown", "mousemove", "touchstart", "keydown", "wheel"];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  /* ---- search ---- */
  const runSearch = useCallback(
    async (query: string, action: "search" | "select_text" = "search") => {
      const current = readSmartBoardSession();
      const cleaned = query
        .replace(/\s+/g, " ")
        .replace(/^[^\w]+|[^\w)]+$/g, "")
        .trim()
        .split(" ")
        .slice(0, 10)
        .join(" ");
      if (!current || !cleaned) return;
      setActiveQuery(cleaned);
      setTerm(cleaned);
      setLoading(true);
      setError(null);
      setResultsOpen(true);

      const { data, message } = await searchBoardVideos(current.deviceToken, cleaned, { limit: 15, action });

      setLoading(false);
      if (!data) {
        setVideos([]);
        setError(message ?? "Video search is temporarily unavailable. Please try again in a few minutes.");
        return;
      }
      setVideos(data.videos ?? []);
    },
    [],
  );

  const handlePlay = (video: SmartBoardVideo) => {
    setPlaying(video);
    const current = readSmartBoardSession();
    if (current) {
      void logBoardPlay(current.deviceToken, {
        query: activeQuery,
        videoId: video.id,
        videoTitle: video.title,
        videoChannel: video.channel,
      });
    }
  };

  const confirmExit = () => {
    clearSmartBoardSession();
    navigate("/smartboard/activate", { replace: true });
  };

  const toolButton = (
    label: string,
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    disabled?: boolean,
  ) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${
        active ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
      }`}
    >
      {icon}
    </button>
  );

  const annotationTools = (
    <div className="flex items-center gap-2">
      {toolButton("Pen", board.tool === "pen", () => board.setTool("pen"), <Pen className="h-4 w-4" />)}
      {toolButton("Highlighter", board.tool === "highlighter", () => board.setTool("highlighter"), <Highlighter className="h-4 w-4" />)}
      {toolButton("Eraser", board.tool === "eraser", () => board.setTool("eraser"), <Eraser className="h-4 w-4" />)}
      {toolButton("Clear", false, () => {
        canvasRef.current?.clear();
        board.clearStacks();
      }, <Trash2 className="h-4 w-4" />)}
      {toolButton(
        "Undo",
        false,
        () => {
          const ctx = canvasRef.current?.getCanvas()?.getContext("2d");
          if (!ctx) return;
          const prev = board.undo(ctx);
          if (prev) canvasRef.current?.restoreImageData(prev);
        },
        <Undo2 className="h-4 w-4" />,
        !board.canUndo,
      )}
    </div>
  );

  return (
    <div
      className="smartboard-classroom flex h-screen flex-col overflow-hidden bg-[#0A0F1A] text-white"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif", fontSize: 16 }}
    >
      <SEOHead
        title="SmartBoard Classroom"
        description="NewtonAI SmartBoard classroom display for instant educational animation videos."
        canonicalPath="/smartboard/classroom"
        noIndex
      />

      {/* ---- top bar ---- */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.06] bg-[#0D1117] px-4 py-2">
        <div className="flex items-center gap-3">
          <img src={newtonLogoN.url} alt="NewtonAI" className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 p-1" />
          <span className="h-5 w-px bg-white/[0.12]" />
          <div className="leading-tight">
            <p className="text-lg font-bold text-white">{session?.boardName ?? "SmartBoard"}</p>
            <p className="text-[11px] font-normal text-slate-400">{session?.institutionName ?? ""}</p>
          </div>
        </div>

        {/* mode tabs */}
        <div className="flex gap-1 rounded-xl bg-white/[0.05] p-1">
          {(["document", "whiteboard"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
                mode === m ? "bg-white text-[#0D1117] shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {m === "document" ? <FileText className="h-3.5 w-3.5" aria-hidden="true" /> : <PenLine className="h-3.5 w-3.5" aria-hidden="true" />}
              {m === "document" ? "Document" : "Whiteboard"}
            </button>
          ))}
        </div>

        {/* search strip */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(term);
          }}
          className="flex h-11 min-w-[260px] flex-1 items-center overflow-hidden rounded-[12px] border border-white/[0.08] bg-[#151C2B] focus-within:border-indigo-500/50 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        >
          <Search className="ml-3.5 h-[18px] w-[18px] shrink-0 text-slate-500" aria-hidden="true" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Search for an educational video topic"
            placeholder="Search any topic — Photosynthesis, Newton's Laws, Fractions..."
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-[15px] font-medium text-white outline-none placeholder:text-slate-600"
          />
          <div className="flex items-center gap-2 pr-1.5">
            {term && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setTerm("")}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex h-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 text-[13px] font-bold text-white transition-all hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.97] disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Search"}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3">
          <p className="text-[13px] font-medium tabular-nums text-slate-300">
            {clock.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
            {clock.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </p>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.12] px-3 py-[7px]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400">ACTIVE</span>
          </span>
          <button
            type="button"
            onClick={() => setExitOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" /> Exit
          </button>
        </div>
      </header>

      {/* ---- main ---- */}
      <main className="relative min-h-0 flex-1 overflow-hidden bg-[#0D1117]">
          {mode === "document" ? (
            <div className="h-full w-full p-4">
              <DocumentStage
                onFindVideos={(topic) => void runSearch(topic, "select_text")}
                onOpenChange={handleDocOpenChange}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col gap-3 p-4">
              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0A0F1A]">
                <WhiteboardCanvas
                  ref={canvasRef}
                  tool={board.tool}
                  color={board.color}
                  penSize={board.penSize}
                  highlighterSize={board.highlighterSize}
                  eraserSize={board.eraserSize}
                  onBeforeStroke={(ctx) => board.pushUndo(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height))}
                  className="h-full w-full"
                />
              </div>
              {annotationTools}
            </div>
          )}

        {/* animation-only results panel */}
        {resultsOpen && (
          <AnimationResultsPanel
            videos={videos}
            loading={loading}
            query={activeQuery}
            error={error}
            onPlay={handlePlay}
            onRetry={() => void runSearch(activeQuery)}
            onSuggestion={(topic) => void runSearch(topic)}
            onClose={() => setResultsOpen(false)}
          />
        )}
      </main>

      {playing && (
        <SmartBoardVideoPlayer
          video={playing}
          upNext={videos.filter((v) => v.id !== playing.id)}
          onSelect={handlePlay}
          onClose={() => setPlaying(null)}
        />
      )}

      {idle && !playing && <IdleScreen onDismiss={resetIdle} />}

      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit SmartBoard?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to enter the activation code again to use this board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmExit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Exit and Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {docOpen && <span className="sr-only">Document open</span>}
    </div>
  );
}
