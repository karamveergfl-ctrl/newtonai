import { useState, useCallback, useEffect, useRef } from "react";
import { useSpotlightSync } from "@/hooks/useSpotlightSync";
import { useSlideContent } from "@/hooks/useSlideContent";
import { SlideContentRenderer } from "./SlideContentRenderer";
import { TermDefinitionsSidebar } from "./TermDefinitionsSidebar";
import { ResyncButton } from "./ResyncButton";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SpotlightSlideViewProps {
  sessionId: string;
  role: "teacher" | "student";
}

export function SpotlightSlideView({ sessionId, role }: SpotlightSlideViewProps) {
  const {
    isSynced,
    lastViewedSlideIndex,
    teacherSlideIndex,
    teacherSlideContent,
    teacherSlideTitle,
    unlockScroll,
    resyncToTeacher,
  } = useSpotlightSync({ sessionId, role });

  const { formattedContent } = useSlideContent({
    slideContent: teacherSlideContent,
    slideTitle: teacherSlideTitle,
  });

  const [mobileTab, setMobileTab] = useState<"slide" | "terms">("slide");
  const [isResyncing, setIsResyncing] = useState(false);
  const [localSlideIndex, setLocalSlideIndex] = useState(lastViewedSlideIndex);
  const [syncFlash, setSyncFlash] = useState(false);
  const [updatedLabel, setUpdatedLabel] = useState(false);
  const prevSyncedRef = useRef(isSynced);
  const prevTeacherSlideRef = useRef(teacherSlideIndex);

  const activeSlideIndex = isSynced ? teacherSlideIndex : localSlideIndex;

  // Sync pulse when resync happens
  useEffect(() => {
    if (isSynced && !prevSyncedRef.current) {
      setSyncFlash(true);
      const timer = setTimeout(() => setSyncFlash(false), 800);
      prevSyncedRef.current = isSynced;
      return () => clearTimeout(timer);
    }
    prevSyncedRef.current = isSynced;
  }, [isSynced]);

  // "Updated ✓" flash when teacher advances while synced
  useEffect(() => {
    if (isSynced && teacherSlideIndex !== prevTeacherSlideRef.current && prevTeacherSlideRef.current !== 0) {
      setUpdatedLabel(true);
      const timer = setTimeout(() => setUpdatedLabel(false), 1500);
      prevTeacherSlideRef.current = teacherSlideIndex;
      return () => clearTimeout(timer);
    }
    prevTeacherSlideRef.current = teacherSlideIndex;
  }, [isSynced, teacherSlideIndex]);

  const handleResync = useCallback(async () => {
    setIsResyncing(true);
    await resyncToTeacher();
    setLocalSlideIndex(teacherSlideIndex);
    setIsResyncing(false);
  }, [resyncToTeacher, teacherSlideIndex]);

  const handleUnlock = useCallback(async () => {
    setLocalSlideIndex(teacherSlideIndex);
    await unlockScroll();
  }, [unlockScroll, teacherSlideIndex]);

  const navigatePrev = () => setLocalSlideIndex((i) => Math.max(0, i - 1));
  const navigateNext = () => setLocalSlideIndex((i) => Math.min(teacherSlideIndex, i + 1));

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left panel — slide content */}
        <div
          className={`flex-1 flex flex-col min-h-0 ${mobileTab === "slide" ? "flex" : "hidden"} md:flex`}
          style={{ flex: "0 0 65%" }}
        >
          <div className="flex-1 overflow-y-auto">
            <SlideContentRenderer
              formattedSlide={formattedContent}
              isLoading={!teacherSlideContent}
              slideIndex={activeSlideIndex}
            />
          </div>

          {/* Student sync bar */}
          {role === "student" && (
            <div
              className="border-t border-gray-700/50 px-4 py-3 transition-colors duration-300"
              style={syncFlash ? { animation: "sync-pulse 0.8s ease-out" } : undefined}
            >
              {isSynced ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-gray-300">
                      {updatedLabel ? (
                        <span className="text-green-400 transition-opacity duration-300">Updated ✓</span>
                      ) : (
                        <>Synced with teacher — Slide {teacherSlideIndex + 1}</>
                      )}
                    </span>
                  </div>
                  <button
                    onClick={handleUnlock}
                    className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 min-h-[44px] rounded transition-colors duration-150"
                    aria-label="Browse slides freely"
                  >
                    Browse freely
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-gray-300">
                        Browsing independently — Slide {localSlideIndex + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={navigatePrev}
                        disabled={localSlideIndex <= 0}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-colors duration-150"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={navigateNext}
                        disabled={localSlideIndex >= teacherSlideIndex}
                        className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-white disabled:opacity-30 transition-colors duration-150"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <ResyncButton
                    onResync={handleResync}
                    teacherSlideIndex={teacherSlideIndex}
                    currentSlideIndex={localSlideIndex}
                    isResyncing={isResyncing}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — terms sidebar */}
        <div
          className={`${mobileTab === "terms" ? "flex" : "hidden"} md:flex flex-col min-h-0`}
          style={{ flex: "0 0 35%" }}
        >
          <TermDefinitionsSidebar sessionId={sessionId} slideIndex={activeSlideIndex} />
        </div>
      </div>

      {/* Mobile tab toggle */}
      <div className="flex md:hidden border-t border-gray-700/50">
        <button
          onClick={() => setMobileTab("slide")}
          className={`flex-1 py-2.5 min-h-[44px] text-sm font-medium text-center transition-colors duration-150 ${
            mobileTab === "slide" ? "text-teal-400 border-b-2 border-teal-400" : "text-gray-400"
          }`}
          aria-label="View slide content"
        >
          📖 Slide
        </button>
        <button
          onClick={() => setMobileTab("terms")}
          className={`flex-1 py-2.5 min-h-[44px] text-sm font-medium text-center transition-colors duration-150 ${
            mobileTab === "terms" ? "text-teal-400 border-b-2 border-teal-400" : "text-gray-400"
          }`}
          aria-label="View key terms"
        >
          📚 Terms
        </button>
      </div>

      <style>{`
        @keyframes sync-pulse {
          0% { background-color: rgba(34,197,94,0.3); }
          100% { background-color: transparent; }
        }
      `}</style>
    </div>
  );
}
