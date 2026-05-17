import { motion } from "framer-motion";
import { Brain, Monitor, TrendingUp, Zap, FileText } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

const caps = [
  { icon: Brain, title: "AI Tutor Available 24/7", color: "#6366F1" },
  { icon: Monitor, title: "Live Smart Classroom", color: "#14B8A6" },
  { icon: TrendingUp, title: "Real-Time Analytics", color: "#F59E0B" },
  { icon: Zap, title: "Instant Quiz & Assessment", color: "#A855F7" },
  { icon: FileText, title: "Auto Notes & Study Guides", color: "#6366F1" },
];

export default function Slide03Solution() {
  return (
    <SlideShell theme="light">
      <div className="h-full flex flex-col justify-center px-16 pt-24 pb-16">
        <div className="text-center">
          <motion.div variants={slideChild} style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: "0.3em" }}>
            THE SOLUTION
          </motion.div>
          <motion.h1 variants={slideHeading} className="mt-3"
            style={{ fontWeight: 800, fontSize: 42, color: "#0F172A", letterSpacing: "-0.02em" }}>
            One platform. Every student. Every classroom.
          </motion.h1>
          <motion.p variants={slideChild} className="mt-4 mx-auto"
            style={{ fontSize: 16, color: "#475569", maxWidth: 640, lineHeight: 1.55 }}>
            NewtonAI combines AI tutoring, smart classroom tools, and real-time analytics into a single platform your institution can deploy in one day.
          </motion.p>
        </div>

        <motion.div variants={slideChild} className="grid grid-cols-5 gap-5 mt-12">
          {caps.map((c, i) => (
            <motion.div key={i} variants={slideChild} className="rounded-2xl p-6 flex flex-col items-center text-center bg-white"
              style={{ border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
              <div className="rounded-xl flex items-center justify-center"
                style={{ width: 56, height: 56, background: `${c.color}18` }}>
                <c.icon size={28} color={c.color} strokeWidth={2} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#0F172A", marginTop: 14, lineHeight: 1.35 }}>{c.title}</div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={slideChild} className="mt-10 mx-auto px-5 py-2.5 rounded-full"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)",
            color: "#4338CA", fontSize: 13, fontWeight: 600 }}>
          Works on any device · No installation required · Supports English and Hindi
        </motion.div>
      </div>
    </SlideShell>
  );
}