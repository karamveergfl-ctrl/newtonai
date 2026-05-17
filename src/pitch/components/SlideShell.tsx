import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { PITCH_COLORS, PITCH_FONT } from "../constants/videoPaths";

interface SlideShellProps {
  theme: "dark" | "light";
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

export function SlideShell({ theme, children, noLogo, bgOverride }: SlideShellProps) {
  const bg = bgOverride ?? (theme === "dark" ? PITCH_COLORS.darkBg : PITCH_COLORS.lightBg);
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: bg, fontFamily: PITCH_FONT, color: theme === "dark" ? PITCH_COLORS.textOnDark : PITCH_COLORS.textOnLight }}
    >
      {theme === "dark" && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.04 }}>
          <defs>
            <pattern id="dotgrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid)" />
        </svg>
      )}
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