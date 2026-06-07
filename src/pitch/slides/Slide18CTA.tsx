import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { Logo } from "../components/Logo";

export default function Slide18CTA() {
  return (
    <SlideShell theme="light" noLogo bgOverride="linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 50%, #FFF0F5 100%)">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
        <div className="absolute" style={{
          width: 1000, height: 800, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(99,102,241,0.18), transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <motion.div variants={slideChild} className="relative">
          <Logo size="xl" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.2, duration: 0.6, ease: "easeOut" } }}
          className="relative mt-10"
          style={{ fontWeight: 800, fontSize: "clamp(36px,5vw,64px)", color: "#0F172A", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Ready to bring AI to your classrooms?
        </motion.h1>
        <motion.p variants={slideChild} className="relative mt-5"
          style={{ fontSize: 18, color: "#475569", maxWidth: 560 }}>
          Join 20+ institutions already using NewtonAI to transform learning outcomes.
        </motion.p>
        <motion.div variants={slideChild} className="relative flex gap-4 mt-10">
          <button className="px-9 py-4 rounded-xl text-base font-bold transition-transform hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #6366F1, #4338CA)", color: "white",
              boxShadow: "0 16px 40px rgba(99,102,241,0.45)" }}>
            Schedule a Demo →
          </button>
          <button className="px-9 py-4 rounded-xl text-base font-bold transition-all hover:bg-indigo-600 hover:text-white"
            style={{ background: "white", color: "#4338CA", border: "1.5px solid #6366F1" }}>
            Start a Free Pilot
          </button>
        </motion.div>
        <motion.div variants={slideChild} className="relative flex items-center gap-6 mt-10" style={{ color: "#475569", fontSize: 12 }}>
          <span>📧 demo@newton.ai</span>
          <span style={{ color: "#94A3B8" }}>·</span>
          <span>📱 +91-98100-XXXXX</span>
          <span style={{ color: "#94A3B8" }}>·</span>
          <span>🌐 www.newton.ai</span>
        </motion.div>
        <motion.div variants={slideChild} className="absolute bottom-20 left-1/2 -translate-x-1/2"
          style={{ color: "#4338CA", fontSize: 14, fontStyle: "italic", fontWeight: 400, fontFamily: "Cormorant Garamond, serif" }}>
          "The same force that holds planets in orbit holds ideas in mind."
        </motion.div>
      </div>
    </SlideShell>
  );
}