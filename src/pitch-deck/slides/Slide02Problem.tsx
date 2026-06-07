import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

const TOOLS = ["PowerPoint", "Google Classroom", "LMS", "Attendance App", "Quiz Platform", "Result System", "Comms Apps", "Gradebook"];

const COLUMNS = [
  { title: "Teachers", icon: "👩‍🏫", color: "#DC2626", points: ["Manual attendance", "Manual grading", "Juggling 7+ tools", "Low engagement", "No real-time feedback"] },
  { title: "Students", icon: "🎓", color: "#D97706", points: ["Learning gaps grow silently", "Passive lectures", "Delayed doubt-solving", "No personalized support", "Disconnected resources"] },
  { title: "Institutions", icon: "🏛️", color: "#7C3AED", points: ["Poor visibility into outcomes", "Fragmented data silos", "No predictive analytics", "Inefficient administration", "Hard to prove ROI"] },
];

export default function Slide02Problem() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col px-14 pt-20 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideHeading}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.3em", color: "#DC2626", textTransform: "uppercase" }}>The Problem</div>
          <h1 style={{ fontWeight: 900, fontSize: 42, color: "#0F172A", letterSpacing: "-0.035em", lineHeight: 1.1, margin: "6px 0 0 0" }}>
            Education runs on too many <span style={{ color: "#DC2626" }}>disconnected tools.</span>
          </h1>
        </motion.div>

        <motion.div variants={slideChild} className="mt-6 flex flex-wrap gap-2">
          {TOOLS.map(t => (
            <span key={t} className="px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.85)", border: "1px dashed rgba(220,38,38,0.4)", color: "#7F1D1D", fontSize: 12, fontWeight: 600 }}>{t}</span>
          ))}
        </motion.div>

        <motion.div variants={slideChild} className="grid grid-cols-3 gap-5 mt-7 flex-1 min-h-0">
          {COLUMNS.map(col => (
            <div key={col.title} className="rounded-2xl p-6 backdrop-blur-sm flex flex-col" style={{ background: "rgba(255,255,255,0.78)", border: `1px solid ${col.color}33` }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-xl flex items-center justify-center" style={{ width: 44, height: 44, background: `${col.color}15`, border: `1px solid ${col.color}40`, fontSize: 22 }}>{col.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: col.color, letterSpacing: "-0.02em" }}>{col.title}</div>
              </div>
              <ul className="space-y-2 m-0 p-0 list-none">
                {col.points.map(p => (
                  <li key={p} className="flex items-start gap-2" style={{ fontSize: 14, color: "#334155", lineHeight: 1.45 }}>
                    <span style={{ color: col.color, fontWeight: 800 }}>✕</span><span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <motion.div variants={slideChild} className="mt-5 text-center" style={{ fontSize: 14, color: "#64748B", fontStyle: "italic" }}>
          Traditional classrooms were not designed for the AI era.
        </motion.div>
      </div>
    </SlideShell>
  );
}