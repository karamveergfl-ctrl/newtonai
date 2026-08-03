import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Search, X } from "lucide-react";
import Logo from "@/components/Logo";
import SEOHead from "@/components/SEOHead";
import DocumentStage from "@/components/smartboard/DocumentStage";
import QuickTopicChips from "@/components/smartboard/QuickTopicChips";
import VideoResultsGrid from "@/components/smartboard/VideoResultsGrid";
import VideoStrip from "@/components/smartboard/VideoStrip";
import TeacherNotesPanel from "@/components/smartboard/TeacherNotesPanel";
import SmartBoardVideoPlayer from "@/components/smartboard/SmartBoardVideoPlayer";
import IdleScreen from "@/components/smartboard/IdleScreen";
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

const IDLE_MS = 5 * 60 * 1000;

export default function SmartBoardClassroom() {
  const navigate = useNavigate();
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
  const [docKey, setDocKey] = useState("");
  const idleTimer = useRef<number | null>(null);

  const handleDocOpenChange = useCallback((open: boolean, key: string) => {
    setDocOpen(open);
    setDocKey(key);
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
        // Persist the refreshed board details so the device reopens on the
        // right board even while offline.
        writeSmartBoardSession(next);
      } else if (errorCode === "invalid_token") {
        // Only a revoked/replaced device token forces re-activation. Plan or
        // network problems keep the device signed in.
        clearSmartBoardSession();
        navigate("/smartboard/activate", { replace: true });
      } else if (errorCode) {
        setError(
          "This board could not be verified right now. You can keep teaching — it will retry automatically.",
        );
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
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "wheel"];
    events.forEach((e) => window.addEventListener(e, resetIdle));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  /* ---- search ---- */
  const runSearch = useCallback(
    async (query: string, action: "search" | "select_text" = "search") => {
      const current = readSmartBoardSession();
      if (!current || !query.trim()) return;
      setActiveQuery(query);
      setTerm(query);
      setLoading(true);
      setError(null);

      const { data, message } = await searchBoardVideos(current.deviceToken, query, {
        limit: 15,
        action,
      });

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

  const handleExit = () => {
    clearSmartBoardSession();
    navigate("/smartboard/activate", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <SEOHead
        title="SmartBoard Classroom"
        description="NewtonAI SmartBoard classroom display for instant educational animation videos."
        canonicalPath="/smartboard/classroom"
        noIndex
      />

      {/* Zone 1 — top bar */}
      <header className="flex h-[60px] items-center justify-between border-b border-slate-800 bg-[#0A1628] px-5">
        <div className="flex items-center gap-4">
          <Logo size="sm" />
          <span className="h-8 w-px bg-slate-700" />
          <div>
            <p className="text-lg font-bold leading-tight text-white">{session?.boardName ?? "SmartBoard"}</p>
            <p className="text-sm leading-tight text-slate-400">{session?.institutionName ?? ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-base text-slate-300">
            {clock.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })} ·{" "}
            {clock.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </p>
          <span className="rounded-full bg-teal-900/50 px-3 py-1 text-sm font-semibold text-teal-300">● ACTIVE</span>
          <button
            type="button"
            onClick={handleExit}
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-600 px-4 text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Exit
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1800px] space-y-6 px-5 py-6">
        {/* Teaching document */}
        <DocumentStage
          onFindVideos={(topic) => void runSearch(topic, "select_text")}
          onOpenChange={handleDocOpenChange}
          topSlot={
            <VideoStrip
              videos={videos}
              loading={loading}
              query={activeQuery}
              error={error}
              onPlay={handlePlay}
              onDismiss={() => {
                setVideos([]);
                setActiveQuery("");
              }}
              onRetry={() => void runSearch(activeQuery, "select_text")}
            />
          }
          sideSlot={<TeacherNotesPanel docKey={docKey} />}
        />

        {!docOpen && (
          <>
        {/* Zone 2 — search */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0A1628] p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.18),transparent_60%)]" />
          <div className="relative flex flex-col items-center gap-3 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">Find an Educational Video</h1>
            <p className="text-lg text-slate-400">
              Type any topic to instantly find curriculum-aligned animation videos
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runSearch(term);
              }}
              className="mt-2 flex h-16 w-[min(700px,90vw)] items-center gap-3 rounded-2xl border-[1.5px] border-slate-600 bg-slate-800 px-4 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20"
            >
              <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                aria-label="Search for an educational video topic"
                placeholder="e.g. Photosynthesis, Newton's Laws, Pythagoras Theorem, Water Cycle..."
                className="h-full flex-1 bg-transparent text-lg font-medium text-white outline-none placeholder:text-slate-500"
              />
              {term && (
                <button type="button" aria-label="Clear search" onClick={() => setTerm("")} className="p-2 text-slate-400 hover:text-white">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              <button
                type="submit"
                className="h-11 shrink-0 rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white hover:bg-indigo-500"
              >
                Search
              </button>
            </form>

            <div className="mt-4 w-full">
              <QuickTopicChips onSelect={(topic) => void runSearch(topic)} />
            </div>
          </div>
        </section>

        {/* Zone 3 — results */}
        <section>
          <VideoResultsGrid
            videos={videos}
            loading={loading}
            query={activeQuery}
            error={error}
            onPlay={handlePlay}
            onRetry={() => void runSearch(activeQuery)}
            onSuggestion={(topic) => void runSearch(topic)}
          />
        </section>
          </>
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
    </div>
  );
}