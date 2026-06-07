import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

const COMPETITORS: { key: string; name: string; emoji: string; highlight?: boolean }[] = [
  { key: "newton", name: "NewtonAI", emoji: "🧠", highlight: true },
  { key: "chatgpt", name: "ChatGPT", emoji: "🤖" },
  { key: "quizlet", name: "Quizlet", emoji: "🎴" },
  { key: "chegg", name: "Chegg", emoji: "📚" },
  { key: "studyfetch", name: "StudyFetch", emoji: "⚡" },
];

type Cell = boolean | string;
const ROWS: { feature: string; values: Cell[] }[] = [
  // newton, chatgpt, quizlet, chegg, studyfetch
  { feature: "AI Quiz Generator",      values: [true, true, true, true, true] },
  { feature: "AI Flashcards",          values: [true, true, true, true, true] },
  { feature: "AI Podcast / Audio",     values: [true, false, false, false, true] },
  { feature: "PDF Chat + Video Embed", values: [true, false, false, false, false] },
  { feature: "Mind Map Generator",     values: [true, "Manual", false, false, false] },
  { feature: "Homework Help (OCR)",    values: [true, true, false, true, true] },
  { feature: "Handwriting OCR",        values: [true, false, false, false, false] },
  { feature: "Class AI Tutor",         values: [true, false, false, false, true] },
  { feature: "Ad-Free Free Tier",      values: ["Yes", "Limited", "Limited", false, "Limited"] },
  { feature: "Starting Price /mo",     values: ["$10", "$20", "$7.99", "$15.95", "$19"] },
  { feature: "Company Valuation",      values: ["$840K", "$500B", "$1B", "$200M", "$10M"] },
];

function renderCell(v: Cell, highlight: boolean) {
  if (v === true) return <Check className="mx-auto" size={16} style={{ color: highlight ? "#059669" : "#10B981" }} />;
  if (v === false) return <X className="mx-auto" size={16} style={{ color: "#CBD5E1" }} />;
  return <span style={{ fontSize: 11, color: highlight ? "#0F172A" : "#475569", fontWeight: highlight ? 700 : 500 }}>{v}</span>;
}

export default function Slide04Market() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col px-12 pt-20 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideHeading}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.3em", color: "#6366F1", textTransform: "uppercase" }}>Market & Competition</div>
          <h1 style={{ fontWeight: 900, fontSize: 36, color: "#0F172A", letterSpacing: "-0.035em", lineHeight: 1.1, margin: "6px 0 0 0" }}>
            A $404B market — and a category nobody owns yet.
          </h1>
        </motion.div>

        <div className="grid grid-cols-5 gap-4 mt-6 flex-1 min-h-0">
          {/* Left: TAM/SAM/SOM */}
          <motion.div variants={slideChild} className="col-span-2 flex flex-col gap-3">
            {[
              { label: "TAM · Global EdTech", value: "$404B+", color: "#6366F1", note: "Worldwide education technology" },
              { label: "SAM · AI Learning Platforms", value: "$85B+", color: "#a855f7", note: "AI-powered learning software" },
              { label: "SOM · Smart Classroom OS", value: "$8B+", color: "#06b6d4", note: "Our beachhead segment" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.82)", border: `1px solid ${s.color}33` }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", color: s.color, textTransform: "uppercase" }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.03em", marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{s.note}</div>
              </div>
            ))}
            <div style={{ fontSize: 10, color: "#94A3B8" }}>Sources: Grand View Research · Fortune Business Insights · Gartner</div>
          </motion.div>

          {/* Right: comparison table */}
          <motion.div variants={slideChild} className="col-span-3 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div style={{ padding: "10px 14px", background: "linear-gradient(135deg,#EEF2FF,#F3F0FF)", borderBottom: "1px solid rgba(99,102,241,0.15)", fontSize: 11, fontWeight: 800, color: "#4338CA", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Student Study Tools — Feature Comparison
            </div>
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, fontWeight: 700, color: "#64748B" }}>Feature</th>
                  {COMPETITORS.map(c => (
                    <th key={c.key} style={{ padding: "8px 4px", fontSize: 11, fontWeight: 800, color: c.highlight ? "#4338CA" : "#0F172A", background: c.highlight ? "rgba(99,102,241,0.08)" : undefined }}>
                      <div style={{ fontSize: 16 }}>{c.emoji}</div>
                      <div>{c.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, i) => (
                  <tr key={row.feature} style={{ background: i % 2 ? "rgba(248,250,252,0.6)" : "transparent" }}>
                    <td style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{row.feature}</td>
                    {row.values.map((v, idx) => (
                      <td key={idx} style={{ padding: "7px 4px", textAlign: "center", background: idx === 0 ? "rgba(99,102,241,0.05)" : undefined }}>
                        {renderCell(v, idx === 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </SlideShell>
  );
}