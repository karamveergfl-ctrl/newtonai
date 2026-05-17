import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { Logo } from "../components/Logo";

export default function Slide01Hero() {
  return (
    <SlideShell theme="dark" noLogo>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
        <div className="absolute" style={{
          width: 900, height: 600, borderRadius: "50%",
          background: "radial-gradient(closest-side, rgba(99,102,241,0.3), transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <motion.div variants={slideChild} className="relative">
          <Logo size="xl" />
        </motion.div>
        <motion.h1 variants={slideHeading} className="relative mt-10"
          style={{ fontWeight: 900, fontSize: "clamp(40px,6vw,80px)", color: "white",
            letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          The AI-Powered Classroom
        </motion.h1>
        <motion.p variants={slideChild} className="relative mt-5"
          style={{ fontWeight: 400, fontSize: "clamp(16px,2vw,22px)", color: "#94A3B8", maxWidth: 600 }}>
          Transforming how India's students learn — one school at a time.
        </motion.p>
        <motion.div variants={slideChild} className="relative flex gap-4 mt-12">
          {["5 Countries", "1,200+ Institutions", "98 Countries"].map((s) => (
            <div key={s} className="px-6 py-2.5 rounded-full"
              style={{ border: "1px solid rgba(99,102,241,0.4)", background: "rgba(99,102,241,0.08)",
                color: "#A5B4FC", fontSize: 13, fontWeight: 600 }}>
              {s}
            </div>
          ))}
        </motion.div>
      </div>
      <motion.div variants={slideChild} className="absolute bottom-20 right-10 px-4 py-2 rounded-full"
        style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
          color: "#FCD34D", fontSize: 11, fontWeight: 600,
          boxShadow: "0 0 24px rgba(245,158,11,0.2)" }}>
        ⭐ Backed by IIT Delhi · AIM NITI Aayog
      </motion.div>
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2" style={{ color: "#475569", fontSize: 12 }}>
        Press → or Space to begin
      </div>
    </SlideShell>
  );
}