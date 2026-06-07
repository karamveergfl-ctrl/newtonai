import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { PITCH_FONT, PITCH_THEMES, PitchTheme } from "../constants/videoPaths";

interface SlideShellProps {
  theme: PitchTheme;
  children: ReactNode;
  noLogo?: boolean;
  bgOverride?: string;
}

export const slideContainer = {
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export const slideChild = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export const slideHeading = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function SlideShell({ theme: _theme, children, noLogo, bgOverride }: SlideShellProps) {
  // Force light theme across the entire pitch deck for readability.
  const theme: PitchTheme = "light";
  const tokens = PITCH_THEMES[theme];
  const bg = bgOverride ?? tokens.background;
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: bg, fontFamily: PITCH_FONT, color: tokens.text }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.07 }}>
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#6366F1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%", right: "-15%", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(99,102,241,0.18), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-20%", left: "-15%", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(244,114,182,0.15), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {!noLogo && (
        <div className="absolute top-6 left-8 z-20">
          <Logo size="md" />
        </div>
      )}
      <motion.div
        className="relative w-full h-full"
        variants={slideContainer}
        initial="initial"
        animate="animate"
      >
        {children}
      </motion.div>
    </div>
  );
}