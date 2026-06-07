import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { Logo } from "../components/Logo";

export default function Slide01Hero() {
  return (
    <SlideShell theme="light" noLogo>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <div className="absolute" style={{
          width: 900, height: 600, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(99,102,241,0.18), transparent 70%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        <motion.div variants={slideChild} className="relative">
          <Logo size="xl" />
        </motion.div>
        <motion.h1 variants={slideHeading} className="relative mt-10"
          style={{ fontWeight: 900, fontSize: "clamp(40px,6vw,80px)", color: "#0F172A",
            letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          The AI-Powered Classroom
        </motion.h1>
        <motion.p variants={slideChild} className="relative mt-5"
          style={{ fontWeight: 400, fontSize: "clamp(16px,2vw,22px)", color: "#475569", maxWidth: 600 }}>
          Transforming how India's students learn — one school at a time.
        </motion.p>
        <motion.div variants={slideChild} className="relative flex gap-4 mt-12">
          {["5 Countries", "20+ Institutions", "10k+ Students"].map((s) => (
            <div key={s} className="px-6 py-2.5 rounded-full"
              style={{ border: "1px solid rgba(99,102,241,0.35)", background: "rgba(255,255,255,0.7)",
                color: "#4338CA", fontSize: 13, fontWeight: 600, backdropFilter: "blur(8px)" }}>
              {s}
            </div>
          ))}
        </motion.div>
      </div>
      <motion.div variants={slideChild} className="absolute bottom-20 right-10 px-4 py-2 rounded-full"
        style={{ background: "rgba(254,243,199,0.85)", border: "1px solid rgba(245,158,11,0.4)",
          color: "#B45309", fontSize: 11, fontWeight: 700,
          boxShadow: "0 4px 16px rgba(245,158,11,0.15)" }}>
        ⭐ Backed by IIT Delhi · AIM NITI Aayog
      </motion.div>
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2" style={{ color: "#94A3B8", fontSize: 12 }}>
        Press → or Space to begin
      </div>
    </SlideShell>
  );
}