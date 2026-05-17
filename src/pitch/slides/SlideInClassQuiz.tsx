import { Clock, Smartphone, CheckCircle2, BarChart3, RefreshCw } from "lucide-react";
import { SlideShell } from "../components/SlideShell";

const timeline = [
  { time: "00 → 40 min", title: "Teach", body: "Teacher delivers from PDF + smart board.", icon: Clock, color: "#6366F1" },
   { time: "40 → 45 min", title: "Auto-generate quiz", body: "Newton creates a 10-Q quiz from the exact pages/topics just taught.", icon: RefreshCw, color: "#F59E0B" },
  { time: "45 → 50 min", title: "Students answer on phones", body: "Quiz pops up on every student device. Live progress bar.", icon: Smartphone, color: "#14B8A6" },
  { time: "On submit", title: "Attendance auto-marked", body: "Submission = present. No roll-call. No proxy attendance.", icon: CheckCircle2, color: "#10B981" },
];

const sampleStudents = [
  { n: "Ananya S.", s: 92 }, { n: "Rohan M.", s: 88 }, { n: "Priya K.", s: 76 },
  { n: "Vikram D.", s: 60 }, { n: "Sneha R.", s: 48 }, { n: "Arjun P.", s: 40 },
];

const revisitTopics = [
  { t: "Newton's Third Law applications", pct: 62 },
  { t: "Friction on inclined planes", pct: 71 },
  { t: "Momentum conservation problems", pct: 55 },
];

const FONT = `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;

export default function SlideInClassQuiz() {
  return (
    <SlideShell theme="dark">
      <div className="h-full flex flex-col px-14 pt-28 pb-20 bg-inherit" style={{ fontFamily: FONT }}>
        <div
          className="inline-flex self-start items-center px-3 py-1 rounded-full"
          style={{
            background: "#14B8A622",
            color: "#14B8A6",
            border: "1px solid #14B8A655",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          For Teachers · In-Class Quiz + Auto-Attendance
        </div>
        <h1 className="mt-3 text-4xl font-extrabold" style={{ fontWeight: 800, fontSize: 34, color: "white", lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: 1080, fontFamily: FONT }}>
          5-minute quiz at the end of every class. Automatic Attendance + Class performance Analysis .
        </h1>
        <p
          className="mt-2"
          style={{ fontSize: 14, color: "#CBD5E1", lineHeight: 1.5, maxWidth: 1080 }}
        >
          From the quiz results, teachers instantly analyse student performance and identify weak topics — so they can revise exactly what the class struggled with in the next session.
        </p>

        {/* Timeline */}
        <div className="grid grid-cols-4 gap-3 mt-6 items-stretch">
          {timeline.map((t, i) => (
            <div key={t.title} className="rounded-2xl p-4 relative flex flex-col h-full"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${t.color}44` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="rounded-lg flex items-center justify-center" style={{ width: 30, height: 30, background: `${t.color}22` }}>
                  <t.icon size={15} color={t.color} strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.color, letterSpacing: "0.08em" }}>{t.time}</div>
              </div>
              <div style={{ fontWeight: 700, color: "white", fontSize: 14 }}>{t.title}</div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 3, lineHeight: 1.45 }}>{t.body}</div>
              {i < timeline.length - 1 && (
                <div className="absolute top-1/2 -right-2 text-lg" style={{ color: t.color, transform: "translateY(-50%)" }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* Result panels */}
        <div className="flex-1 grid grid-cols-2 gap-5 mt-6 min-h-0 items-stretch">
          <div className="rounded-2xl p-5 flex flex-col h-full"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F1F5F9" }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} color="#A5B4FC" />
              <div style={{ fontWeight: 700, fontSize: 14, color: "white" }}>Per-student performance · Today's quiz</div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {sampleStudents.map(s => (
                <div key={s.n} className="flex items-center gap-3">
                  <div style={{ width: 90, fontSize: 12, color: "#CBD5E1" }}>{s.n}</div>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${s.s}%`,
                      background: s.s >= 75 ? "#10B981" : s.s >= 50 ? "#F59E0B" : "#EF4444",
                    }} />
                  </div>
                  <div style={{ width: 36, textAlign: "right", fontSize: 12, fontWeight: 700, color: "white" }}>{s.s}%</div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ color: "#94A3B8" }}>Class avg: <b style={{ color: "white" }}>67%</b></span>
              <span style={{ color: "#94A3B8" }}>Attendance: <b style={{ color: "#34D399" }}>34/36 present</b></span>
              <span style={{ color: "#94A3B8" }}>At-risk: <b style={{ color: "#F87171" }}>3 students</b></span>
            </div>
          </div>

          <div className="rounded-2xl p-5 flex flex-col h-full"
            style={{ background: "linear-gradient(160deg, #6366F1, #4338CA)", color: "white", border: "1px solid rgba(99,102,241,0.5)" }}>
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw size={16} color="white" />
              <div style={{ fontWeight: 700, fontSize: 14 }}>Topics to revisit next class</div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              {revisitTopics.map(r => (
                <div key={r.t}>
                  <div className="flex items-center justify-between mb-1">
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.t}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.pct}% missed</div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "white" }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
              Newton emails this summary to the teacher + parents within 2 minutes of class ending.
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
