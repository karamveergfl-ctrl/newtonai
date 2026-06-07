import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

const FEATURES = [
  { icon: "🖥️", label: "Smart Board OS" },
  { icon: "🤖", label: "AI Teaching Assistant" },
  { icon: "📡", label: "Live Pulse Meter" },
  { icon: "📝", label: "AI Notes Generator" },
  { icon: "✍️", label: "Handwriting OCR" },
  { icon: "🎙️", label: "Voice-to-Notes" },
  { icon: "✅", label: "Auto Attendance" },
  { icon: "🧠", label: "Quiz & Assessment AI" },
  { icon: "📊", label: "Marks & Results" },
  { icon: "📈", label: "Student Analytics" },
  { icon: "👨‍👩‍👧", label: "Parent Dashboard" },
  { icon: "🏛️", label: "Institution Dashboard" },
  { icon: "🎓", label: "Class-Specific AI Tutor" },
  { icon: "🎬", label: "AI Video Search" },
  { icon: "📑", label: "Post-Class Reports" },
  { icon: "🎧", label: "AI Podcasts" },
];

export default function Slide03Solution() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col px-14 pt-20 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideHeading}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.3em", color: "#059669", textTransform: "uppercase" }}>The Solution</div>
          <h1 style={{ fontWeight: 900, fontSize: 42, color: "#0F172A", letterSpacing: "-0.035em", lineHeight: 1.1, margin: "6px 0 0 0" }}>
            NewtonAI = <span style={{ background: "linear-gradient(135deg,#6366F1,#06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>One Platform</span> for the Entire Classroom
          </h1>
        </motion.div>

        <motion.div variants={slideChild} className="grid grid-cols-4 gap-3 mt-8 flex-1 min-h-0">
          {FEATURES.map(f => (
            <div key={f.label} className="rounded-xl p-4 backdrop-blur-sm flex items-center gap-3" style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(99,102,241,0.18)" }}>
              <div style={{ fontSize: 22 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>{f.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={slideChild} className="mt-6 rounded-2xl py-4 px-6 flex items-center justify-center gap-8" style={{ background: "linear-gradient(135deg,#6366F1,#a855f7)", color: "white", boxShadow: "0 12px 32px rgba(99,102,241,0.35)" }}>
          {["One Platform", "One Login", "One Ecosystem"].map((t, i) => (
            <div key={t} className="flex items-center gap-8">
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>{t}</span>
              {i < 2 && <span style={{ opacity: 0.5 }}>·</span>}
            </div>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}