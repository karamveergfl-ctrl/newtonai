import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";
import { Logo } from "@/pitch/components/Logo";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

export default function Slide09ThankYou() {
  return (
    <SlideShell theme="light" noLogo>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-14" style={{ fontFamily: FONT }}>
        <motion.div variants={slideChild}>
          <Logo size="xl" />
        </motion.div>

        <motion.h1 variants={slideHeading} className="mt-8" style={{ fontWeight: 900, fontSize: "clamp(48px,7vw,88px)", color: "#0F172A", letterSpacing: "-0.045em", lineHeight: 1 }}>
          Thank <span style={{ background: "linear-gradient(135deg,#6366F1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>You.</span>
        </motion.h1>

        <motion.p variants={slideChild} className="mt-5" style={{ fontSize: 20, color: "#475569", maxWidth: 760 }}>
          The Intelligent Classroom Operating System — building the future of education through AI.
        </motion.p>

        <motion.div variants={slideChild} className="mt-10 grid grid-cols-3 gap-4 w-full max-w-3xl">
          {[
            { k: "Website", v: "newtonai.site" },
            { k: "Contact", v: "contact@newtonai.site" },
            { k: "Founder", v: "Karamveer Singh" },
          ].map(c => (
            <div key={c.k} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.26em", color: "#6366F1", textTransform: "uppercase" }}>{c.k}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>{c.v}</div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={slideChild} className="mt-10 rounded-2xl px-7 py-5 max-w-3xl" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))", border: "1px solid rgba(99,102,241,0.25)" }}>
          <div style={{ fontSize: 18, fontStyle: "italic", color: "#0F172A", lineHeight: 1.45, fontWeight: 500 }}>
            "Just as UPI transformed payments, NewtonAI aims to transform education — making every classroom intelligent, interactive, and data-driven."
          </div>
        </motion.div>
      </div>
    </SlideShell>
  );
}