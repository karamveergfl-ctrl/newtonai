import {
  Brain, MessageCircle, Headphones, Layers, PlayCircle, Zap, Calculator, FileText, Network,
  Monitor, Users, BarChart3, GraduationCap, Tv2,
} from "lucide-react";
import { SlideShell } from "../components/SlideShell";

const FONT = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

type Audience = "student" | "teacher" | "smartboard";
const AUD = {
  student:   { label: "STUDENT",     color: "#6366F1", bg: "rgba(99,102,241,0.10)", border: "rgba(99,102,241,0.30)" },
  teacher:   { label: "TEACHER",     color: "#D97706", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" },
  smartboard:{ label: "SMARTBOARD",  color: "#059669", bg: "rgba(5,150,105,0.10)",  border: "rgba(5,150,105,0.30)" },
} as const;

const studentTools: { icon: any; label: string; aud: Audience }[] = [
  { icon: PlayCircle,    label: "Ad-Free Videos", aud: "student" },
  { icon: Layers,        label: "Flashcards",     aud: "student" },
  { icon: Headphones,    label: "AI Podcast",     aud: "student" },
  { icon: MessageCircle, label: "Newton Chat",    aud: "student" },
  { icon: Zap,           label: "AI Quiz",        aud: "student" },
  { icon: FileText,      label: "Summariser",     aud: "student" },
  { icon: Calculator,    label: "Homework Help",  aud: "student" },
  { icon: Network,       label: "Mind Maps",      aud: "student" },
];

const teacherTools: { icon: any; label: string; aud: Audience }[] = [
  { icon: Tv2,       label: "Smart Classroom",            aud: "smartboard" },
  { icon: Users,     label: "In-Class Quiz + Attendance", aud: "teacher" },
  { icon: BarChart3, label: "Live Analytics",             aud: "teacher" },
];

const pillars = [
  { tag: "FOR STUDENTS",     color: "#6366F1", icon: GraduationCap, bullets: ["24/7 AI tutor in English & Hindi", "Audio, video, flashcards, mind-maps", "Homework solved step-by-step"] },
  { tag: "FOR TEACHERS",     color: "#D97706", icon: Monitor,       bullets: ["Quiz + auto-attendance in 5 min", "Per-student weak-point reports", "Lesson planning assistant"] },
  { tag: "SMARTBOARD / SHARED", color: "#059669", icon: Tv2,        bullets: ["Instant animated explainers", "Mirrors to every student device", "Captured into class AI tutor"] },
];

export default function Slide03Solution() {
  return (
    <SlideShell theme="light">
      <div
        className="absolute inset-x-0 flex flex-col px-12 pt-24 pb-16"
        style={{ top: 0, bottom: 64, fontFamily: FONT }}
      >
        {/* Heading */}
        <div className="text-center flex-shrink-0">
          <div
            className="inline-flex items-center px-2.5 py-1 rounded-full"
            style={{
              background: "rgba(99,102,241,0.10)",
              color: "#4338CA",
              border: "1px solid rgba(99,102,241,0.35)",
              fontSize: 11,
              fontWeight: 800,
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
              color: "#0F172A",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            One AI platform.{" "}
            <span style={{ color: "#6366F1" }}>Every student.</span>{" "}
            <span style={{ color: "#059669" }}>Every teacher.</span>
          </h1>
          <p
            className="mt-2 mx-auto"
            style={{ fontSize: 13.5, color: "#475569", maxWidth: 760, lineHeight: 1.55 }}
          >
            Every tool is labelled by audience — <b style={{ color: "#6366F1" }}>Student</b>, <b style={{ color: "#D97706" }}>Teacher</b>, or <b style={{ color: "#059669" }}>Smartboard (shared)</b> — so everyone knows exactly what's for them.
          </p>
        </div>

        {/* Hub */}
        <div className="flex-1 grid grid-cols-12 items-center gap-6 mt-6 min-h-0">
          {/* Student tools */}
          <div className="col-span-4 grid grid-cols-2 gap-2.5">
            {studentTools.map((t) => (
              <ToolCard key={t.label} t={t} />
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
            <div className="mt-4 flex flex-col items-center gap-1.5">
              <Legend audience="student" />
              <Legend audience="teacher" />
              <Legend audience="smartboard" />
            </div>
          </div>

          {/* Teacher tools */}
          <div className="col-span-4 flex flex-col gap-2.5">
            {teacherTools.map((t) => (
              <ToolCard key={t.label} t={t} large />
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
                background: "rgba(255,255,255,0.8)",
                border: `1px solid ${p.color}44`,
                boxShadow: `0 4px 16px ${p.color}11`,
                backdropFilter: "blur(6px)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="rounded-md flex items-center justify-center"
                  style={{ width: 26, height: 26, background: `${p.color}1A` }}
                >
                  <p.icon size={14} color={p.color} strokeWidth={2.3} />
                </div>
                <div style={{ color: p.color, fontSize: 11, fontWeight: 800, letterSpacing: "0.18em" }}>{p.tag}</div>
              </div>
              <ul style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
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

function ToolCard({ t, large }: { t: { icon: any; label: string; aud: Audience }; large?: boolean }) {
  const a = AUD[t.aud];
  return (
    <div
      className={`rounded-xl ${large ? "px-3 py-2.5" : "px-3 py-2"} flex items-center gap-2.5`}
      style={{
        background: "rgba(255,255,255,0.85)",
        border: `1px solid ${a.border}`,
        boxShadow: `0 3px 10px ${a.color}10`,
      }}
    >
      <div
        className="rounded-md flex items-center justify-center flex-shrink-0"
        style={{ width: large ? 30 : 28, height: large ? 30 : 28, background: a.bg }}
      >
        <t.icon size={large ? 16 : 14} color={a.color} strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: large ? 12 : 11.5, fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>{t.label}</div>
        <div style={{ fontSize: 8.5, fontWeight: 800, color: a.color, letterSpacing: "0.14em", marginTop: 2 }}>{a.label}</div>
      </div>
    </div>
  );
}

function Legend({ audience }: { audience: Audience }) {
  const a = AUD[audience];
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded-full" style={{ width: 8, height: 8, background: a.color, display: "inline-block" }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.12em" }}>{a.label}</span>
    </div>
  );
}
