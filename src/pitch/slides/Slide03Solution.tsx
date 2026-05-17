import {
  Brain, MessageCircle, Headphones, Layers, PlayCircle, Zap, Calculator, FileText, Network,
  Monitor, Users, BarChart3, GraduationCap,
} from "lucide-react";
import { SlideShell } from "../components/SlideShell";

const FONT = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

const studentTools = [
  { icon: PlayCircle,    label: "Ad-Free Videos" },
  { icon: Layers,        label: "Flashcards" },
  { icon: Headphones,    label: "AI Podcast" },
  { icon: MessageCircle, label: "Newton Chat" },
  { icon: Zap,           label: "AI Quiz" },
  { icon: FileText,      label: "Summariser" },
  { icon: Calculator,    label: "Homework Help" },
  { icon: Network,       label: "Mind Maps" },
];

const teacherTools = [
  { icon: Monitor, label: "Smart Classroom" },
  { icon: Users,   label: "In-Class Quiz + Attendance" },
  { icon: BarChart3, label: "Live Analytics" },
];

const pillars = [
  { tag: "FOR STUDENTS",     color: "#6366F1", icon: GraduationCap, bullets: ["24/7 AI tutor in English & Hindi", "Audio, video, flashcards, mind-maps", "Homework solved step-by-step"] },
  { tag: "FOR TEACHERS",     color: "#34D399", icon: Monitor,       bullets: ["Smart-board with instant animations", "Quiz + auto-attendance in 5 min", "Per-student weak-point reports"] },
  { tag: "FOR INSTITUTIONS", color: "#F59E0B", icon: BarChart3,     bullets: ["Real-time class understanding", "Early-warning alerts on at-risk students", "Auto-generated NAAC/NBA reports"] },
];

export default function Slide03Solution() {
  return (
    <SlideShell theme="dark">
      <div
        className="absolute inset-x-0 flex flex-col px-12 pt-14 pb-16"
        style={{ top: 0, bottom: 52, fontFamily: FONT }}
      >
        {/* Heading */}
        <div className="text-center flex-shrink-0">
          <div
            className="inline-flex items-center px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(99,102,241,0.12)",
              color: "#818CF8",
              border: "1px solid rgba(99,102,241,0.35)",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            The Solution
          </div>
          <h1
            className="mt-3"
            style={{
              fontWeight: 800,
              fontSize: "clamp(26px, 2.6vw, 36px)",
              color: "white",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            One AI platform.{" "}
            <span style={{ color: "#818CF8" }}>Every student.</span>{" "}
            <span style={{ color: "#34D399" }}>Every teacher.</span>
          </h1>
          <p
            className="mt-2 mx-auto"
            style={{ fontSize: 13.5, color: "#94A3B8", maxWidth: 720, lineHeight: 1.55 }}
          >
            8 personalised study tools for students. 3 live-classroom tools for teachers. One dashboard for the institution. Deployed in a day, in English and Hindi.
          </p>
        </div>

        {/* Hub */}
        <div className="flex-1 grid grid-cols-12 items-center gap-6 mt-6 min-h-0">
          {/* Student tools */}
          <div className="col-span-4 grid grid-cols-2 gap-2.5">
            {studentTools.map((t) => (
              <div
                key={t.label}
                className="rounded-xl px-3 py-2 flex items-center gap-2.5"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                <div
                  className="rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ width: 28, height: 28, background: "rgba(99,102,241,0.18)" }}
                >
                  <t.icon size={14} color="#A5B4FC" strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: "#F1F5F9" }}>{t.label}</div>
              </div>
            ))}
          </div>

          {/* Center hub */}
          <div className="col-span-4 flex flex-col items-center">
            <div
              className="rounded-3xl flex flex-col items-center justify-center"
              style={{
                width: 200,
                height: 200,
                background: "linear-gradient(135deg, #6366F1, #4338CA)",
                boxShadow: "0 18px 56px rgba(99,102,241,0.45)",
              }}
            >
              <Brain size={52} color="white" strokeWidth={1.8} />
              <div style={{ fontSize: 17, fontWeight: 800, color: "white", marginTop: 8, letterSpacing: "-0.02em" }}>NewtonAI</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginTop: 2, letterSpacing: "0.18em" }}>ONE PLATFORM</div>
            </div>
            <div
              className="mt-3"
              style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "0.18em", fontWeight: 600, textAlign: "center" }}
            >
              FROM CLASS NOTES → EVERYTHING
            </div>
          </div>

          {/* Teacher tools */}
          <div className="col-span-4 flex flex-col gap-2.5">
            {teacherTools.map((t) => (
              <div
                key={t.label}
                className="rounded-xl px-3 py-2.5 flex items-center gap-2.5"
                style={{
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.28)",
                }}
              >
                <div
                  className="rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ width: 30, height: 30, background: "rgba(52,211,153,0.18)" }}
                >
                  <t.icon size={16} color="#34D399" strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#F1F5F9" }}>{t.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-3 gap-4 mt-6 flex-shrink-0">
          {pillars.map((p) => (
            <div
              key={p.tag}
              className="rounded-2xl p-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${p.color}44`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="rounded-md flex items-center justify-center"
                  style={{ width: 26, height: 26, background: `${p.color}22` }}
                >
                  <p.icon size={14} color={p.color} strokeWidth={2.3} />
                </div>
                <div style={{ color: p.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.22em" }}>{p.tag}</div>
              </div>
              <ul style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.6 }}>
                {p.bullets.map((b) => (
                  <li key={b} className="flex gap-1.5">
                    <span style={{ color: p.color, fontWeight: 700 }}>✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
