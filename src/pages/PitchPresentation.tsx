import { useCallback, useEffect, useState, MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { SLIDES } from "@/pitch/slides";
import { BottomNav } from "@/pitch/components/BottomNav";

export default function PitchPresentation() {
  const [current, setCurrent] = useState(0);
  const [presenter, setPresenter] = useState(false);

  const total = SLIDES.length;
  const next = useCallback(() => setCurrent(c => Math.min(total - 1, c + 1)), [total]);
  const prev = useCallback(() => setCurrent(c => Math.max(0, c - 1)), []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
      else if (e.key === "p" || e.key === "P") setPresenter(p => !p);
      else if (e.key === "Home") setCurrent(0);
      else if (e.key === "End") setCurrent(total - 1);
      else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < total) setCurrent(idx);
      } else if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, total, toggleFullscreen]);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Ignore clicks on interactive elements
    if (target.closest("button, a, input, video, [data-interactive]")) return;
    if (e.clientX > window.innerWidth / 2) next();
    else prev();
  };

  const { Component, title } = SLIDES[current];

  return (
    <>
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@1,300;1,400&display=swap" rel="stylesheet" />
        <title>NewtonAI — The AI-Powered Classroom</title>
      </Helmet>
      <div className="fixed inset-0 overflow-hidden bg-[#0A1628]" onClick={handleClick}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            <Component />
          </motion.div>
        </AnimatePresence>

        <BottomNav
          current={current}
          total={total}
          title={title}
          presenterMode={presenter}
          onPrev={prev}
          onNext={next}
          onFullscreen={toggleFullscreen}
          onPresenter={() => setPresenter(p => !p)}
        />
      </div>
    </>
  );
}