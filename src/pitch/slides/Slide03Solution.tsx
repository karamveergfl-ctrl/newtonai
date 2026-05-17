import { motion } from "framer-motion";
import {
  Brain, MessageCircle, Headphones, Layers, Search, Zap, Calculator, FileText, Network,
  Monitor, Users, BarChart3, GraduationCap, ArrowRight,
} from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

const studentTools = [
  { icon: Search, label: "Video Search" },
  { icon: Layers, label: "Flashcards" },
  { icon: Headphones, label: "AI Podcast" },
  { icon: MessageCircle, label: "Newton Chat" },
  { icon: Zap, label: "AI Quiz" },
  { icon: FileText, label: "Summariser" },
  { icon: Calculator, label: "Homework Help" },
  { icon: Network, label: "Mind Maps" },
];

const teacherTools = [
  { icon: Monitor, label: "Smart Classroom" },
  { icon: Users, label: "In-Class Quiz + Attendance" },
  { icon: BarChart3, label: "Live Analytics" },
];

const pillars = [
  { tag: "FOR STUDENTS", color: "#6366F1", icon: GraduationCap, bullets: ["24/7 AI tutor in English & Hindi", "Audio, video, flashcards, mind-maps", "Homework solved step-by-step"] },
  { tag: "FOR TEACHERS", color: "#14B8A6", icon: Monitor, bullets: ["Smart-board with instant animations", "Quiz + auto-attendance in 5 min", "Per-student weak-point reports"] },
  { tag: "FOR INSTITUTIONS", color: "#F59E0B", icon: BarChart3, bullets: ["Real-time class understanding", "Early-warning alerts on at-risk students", "Auto-generated NAAC/NBA reports"] },
];

export default function Slide03Solution() {
  return (
    <SlideShell theme="light">
      <div className="h-full flex flex-col px-14 pt-20 pb-20">
        <div className="text-center">
          <motion.div variants={slideChild} style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: "0.3em" }}>
            THE SOLUTION
          </motion.div>
          <motion.h1 variants={slideHeading} className="mt-2"
            style={{ fontWeight: 800, fontSize: 38, color: "#0F172A", letterSpacing: "-0.02em" }}>
            One AI platform. <span style={{ color: "#6366F1" }}>Every student.</span> <span style={{ color: "#14B8A6" }}>Every teacher.</span>
          </motion.h1>
          <motion.p variants={slideChild} className="mt-2 mx-auto"
            style={{ fontSize: 14, color: "#475569", maxWidth: 680, lineHeight: 1.5 }}>
            8 personalised study tools for students. 3 live-classroom tools for teachers. One dashboard for the institution. Deployed in a day, in English and Hindi.
          </motion.p>
        </div>

        {/* Orbit diagram */}
        <div className="flex-1 grid grid-cols-12 items-center gap-4 mt-4 min-h-0">
          {/* Student tools */}
          <motion.div variants={slideChild} className="col-span-4 grid grid-cols-2 gap-2">
            {studentTools.map((t, i) => (
              <motion.div key={t.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                className="rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
                <div className="rounded-md flex items-center justify-center flex-shrink-0" style={{ width: 26, height: 26, background: "#6366F118" }}>
                  <t.icon size={14} color="#6366F1" strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{t.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Center hub */}
          <motion.div variants={slideChild} className="col-span-4 flex flex-col items-center">
            <div className="relative rounded-3xl flex flex-col items-center justify-center"
              style={{ width: 220, height: 220, background: "linear-gradient(135deg, #6366F1, #4338CA)", boxShadow: "0 20px 60px rgba(99,102,241,0.4)" }}>
              <Brain size={56} color="white" strokeWidth={1.8} />
              <div style={{ fontSize: 18, fontWeight: 800, color: "white", marginTop: 8, letterSpacing: "-0.02em" }}>NewtonAI</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", marginTop: 2, letterSpacing: "0.15em" }}>ONE PLATFORM</div>
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{
                border: "2px solid rgba(99,102,241,0.3)", animation: "pulseRing 2.5s ease-out infinite",
              }} />
              <style>{`@keyframes pulseRing { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.25); opacity: 0; } }`}</style>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <ArrowRight size={12} color="#94A3B8" />
              <span style={{ fontSize: 10, color: "#64748B", letterSpacing: "0.15em", fontWeight: 600 }}>FROM CLASS NOTES → EVERYTHING</span>
              <ArrowRight size={12} color="#94A3B8" />
            </div>
          </motion.div>

          {/* Teacher tools */}
          <motion.div variants={slideChild} className="col-span-4 flex flex-col gap-2">
            {teacherTools.map((t, i) => (
              <motion.div key={t.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="rounded-xl px-3 py-2.5 flex items-center gap-2"
                style={{ background: "white", border: "1px solid #14B8A633", boxShadow: "0 4px 14px rgba(20,184,166,0.08)" }}>
                <div className="rounded-md flex items-center justify-center flex-shrink-0" style={{ width: 30, height: 30, background: "#14B8A618" }}>
                  <t.icon size={16} color="#14B8A6" strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{t.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Pillars */}
        <motion.div variants={slideChild} className="grid grid-cols-3 gap-4 mt-4">
          {pillars.map(p => (
            <div key={p.tag} className="rounded-2xl p-4" style={{ background: "white", border: `1px solid ${p.color}33`, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md flex items-center justify-center" style={{ width: 26, height: 26, background: `${p.color}1A` }}>
                  <p.icon size={14} color={p.color} strokeWidth={2.3} />
                </div>
                <div style={{ color: p.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em" }}>{p.tag}</div>
              </div>
              <ul style={{ fontSize: 12, color: "#475569", lineHeight: 1.55 }}>
                {p.bullets.map(b => <li key={b} className="flex gap-1.5"><span style={{ color: p.color }}>✓</span><span>{b}</span></li>)}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}
