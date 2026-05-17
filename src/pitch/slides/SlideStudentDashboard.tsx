import { motion } from "framer-motion";
import { BarChart3, GraduationCap, CheckCircle2, Target, TrendingUp, Award, BookOpen, ChevronRight } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

const summary = [
  { label: "Attendance", value: "92%", icon: CheckCircle2, color: "#10B981" },
  { label: "Avg Score", value: "87%", icon: TrendingUp, color: "#6366F1" },
  { label: "Assignments", value: "22/24", icon: Target, color: "#F59E0B" },
  { label: "Classes", value: "8", icon: GraduationCap, color: "#EC4899" },
];

const classes = [
  { name: "Class 10-A · Physics", subject: "Physics", attendance: 96, score: 91, done: 6, total: 6, grade: "A", rank: 3, of: 38 },
  { name: "Class 10-A · Maths",   subject: "Mathematics", attendance: 94, score: 89, done: 5, total: 5, grade: "A", rank: 5, of: 38 },
  { name: "Class 10-A · Chemistry", subject: "Chemistry", attendance: 88, score: 82, done: 4, total: 5, grade: "A−", rank: 8, of: 38 },
  { name: "Class 10-A · Biology", subject: "Biology", attendance: 95, score: 90, done: 3, total: 3, grade: "A", rank: 2, of: 38 },
  { name: "Class 10-A · English", subject: "English", attendance: 90, score: 84, done: 2, total: 2, grade: "A−", rank: 11, of: 38 },
  { name: "Class 10-A · Hindi",   subject: "Hindi", attendance: 92, score: 88, done: 2, total: 3, grade: "A", rank: 4, of: 38 },
];

export default function SlideStudentDashboard() {
  return (
    <SlideShell theme="dark">
      <div className="h-full flex flex-col px-12 pt-28 pb-20 bg-inherit">
        <div className="text-center mb-4">
          <motion.div variants={slideChild} className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2"
            style={{ background: "#6366F11A" }}>
            <BarChart3 size={22} color="#6366F1" />
          </motion.div>
          <motion.div variants={slideChild} style={{ color: "#6366F1", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em" }}>
            REAL APP VIEW · STUDENT DASHBOARD
          </motion.div>
          <motion.h1 variants={slideHeading} style={{ fontWeight: 800, fontSize: 30, color: "#F1F5F9", letterSpacing: "-0.02em", marginTop: 4 }}>
            My Dashboard
          </motion.h1>
          <motion.p variants={slideChild} style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
            Attendance, marks and progress across all 8 classes — updated live.
          </motion.p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {summary.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
              <s.icon size={18} color={s.color} className="mx-auto mb-1.5" />
              <div style={{ fontSize: 24, fontWeight: 800, color: "#F1F5F9", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Rank banner */}
        <motion.div variants={slideChild} className="rounded-xl p-3 mb-3 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #6366F1, #4338CA)", color: "white" }}>
          <div className="flex items-center gap-3">
            <Award size={20} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Overall Class Rank · #3 of 58</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Up 2 positions this month · top 5% of school</div>
            </div>
          </div>
          <div className="rounded-full px-3 py-1" style={{ background: "rgba(255,255,255,0.18)", fontSize: 11, fontWeight: 700 }}>
            ★ TOP PERFORMER
          </div>
        </motion.div>

        {/* Class breakdown */}
        <div className="flex items-center gap-2 mb-2">
          <BookOpen size={14} color="#6366F1" />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Class breakdown</div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2.5 min-h-0 overflow-hidden">
          {classes.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
              className="rounded-xl p-3 flex flex-col"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0">
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#F1F5F9" }}>{c.subject}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="rounded px-1.5 py-0.5" style={{ background: "rgba(255,255,255,0.06)", fontSize: 9, color: "#94A3B8", fontWeight: 600 }}>Grade {c.grade}</span>
                    <span style={{ fontSize: 9.5, color: "#94A3B8" }}>Rank {c.rank}/{c.of}</span>
                  </div>
                </div>
                <ChevronRight size={14} color="#CBD5E1" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-auto">
                <Metric label="Attend." value={`${c.attendance}%`} pct={c.attendance} color="#10B981" />
                <Metric label="Score" value={`${c.score}%`} pct={c.score} color="#6366F1" />
                <Metric label="Done" value={`${c.done}/${c.total}`} pct={(c.done / c.total) * 100} color="#F59E0B" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function Metric({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: "#94A3B8", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#F1F5F9", marginTop: 1 }}>{value}</div>
      <div className="h-1 rounded-full mt-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
