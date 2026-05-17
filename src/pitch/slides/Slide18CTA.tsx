import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { Logo } from "../components/Logo";

export default function Slide18CTA() {
  return (
    <SlideShell theme="dark" noLogo bgOverride="linear-gradient(135deg, #0A1628, #1E1B4B)">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
        <div className="absolute" style={{
          width: 1000, height: 800, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(99,102,241,0.25), transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <motion.div variants={slideChild} className="relative">
          <Logo size="xl" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.2, duration: 0.6, ease: "easeOut" } }}
          className="relative mt-10"
          style={{ fontWeight: 800, fontSize: "clamp(36px,5vw,64px)", color: "white", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Ready to bring AI to your classrooms?
        </motion.h1>
        <motion.p variants={slideChild} className="relative mt-5"
          style={{ fontSize: 18, color: "#94A3B8", maxWidth: 560 }}>
          Join 1,200+ institutions already using NewtonAI to transform learning outcomes.
        </motion.p>
        <motion.div variants={slideChild} className="relative flex gap-4 mt-10">
          <button className="px-9 py-4 rounded-xl text-base font-bold transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #6366F1, #4338CA)", color: "white",
              boxShadow: "0 16px 40px rgba(99,102,241,0.45)" }}>
            Schedule a Demo →
          </button>
          <button className="px-9 py-4 rounded-xl text-base font-bold transition-all hover:bg-white hover:text-indigo-700"
            style={{ background: "transparent", color: "white", border: "1.5px solid white" }}>
            Start a Free Pilot
          </button>
        </motion.div>
        <motion.div variants={slideChild} className="relative flex items-center gap-6 mt-10" style={{ color: "#94A3B8", fontSize: 12 }}>
          <span>📧 demo@newton.ai</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>📱 +91-98100-XXXXX</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>🌐 www.newton.ai</span>
        </motion.div>
        <motion.div variants={slideChild} className="absolute bottom-20 left-1/2 -translate-x-1/2"
          style={{ color: "#6366F1", fontSize: 14, fontStyle: "italic", fontWeight: 300, fontFamily: "Cormorant Garamond, serif" }}>
          "The same force that holds planets in orbit holds ideas in mind."
        </motion.div>
      </div>
    </SlideShell>
  );
}