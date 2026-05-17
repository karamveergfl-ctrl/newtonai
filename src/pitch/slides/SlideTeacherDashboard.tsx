import { motion } from "framer-motion";
import { GraduationCap, Users, Radio, Brain, ArrowRight, Plus, Calendar, BarChart3, Activity, Clock } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

const stats = [
  { label: "Active Classes", value: "14", icon: GraduationCap, color: "#6366F1" },
  { label: "Total Students", value: "486", icon: Users, color: "#14B8A6" },
  { label: "Sessions This Month", value: "127", icon: Radio, color: "#F59E0B" },
  { label: "Avg Understanding", value: "82%", icon: Brain, color: "#10B981" },
];

const classes = [
  { name: "Class 10-A · Physics", students: 38, attendance: 94, last: "Today 11:20 AM", color: "#6366F1" },
  { name: "Class 10-B · Physics", students: 36, attendance: 89, last: "Today 09:00 AM", color: "#6366F1" },
  { name: "Class 9-A · Science",  students: 40, attendance: 91, last: "Yesterday",      color: "#14B8A6" },
  { name: "Class 9-B · Science",  students: 39, attendance: 86, last: "Yesterday",      color: "#14B8A6" },
  { name: "Class 12 · JEE Maths", students: 28, attendance: 96, last: "Today 02:00 PM", color: "#F59E0B" },
  { name: "Class 11 · Chemistry", students: 34, attendance: 88, last: "Mon, Nov 11",    color: "#EC4899" },
];

const activity = [
  { who: "Ananya S.", what: "scored 96% on Optics quiz", when: "2 min ago", color: "#10B981" },
  { who: "Rohan M.",  what: "submitted assignment Ch.7", when: "12 min ago", color: "#6366F1" },
  { who: "Class 10-B", what: "completed live session", when: "1 hr ago", color: "#F59E0B" },
  { who: "Priya K.",  what: "asked Newton 4 questions on Friction", when: "2 hr ago", color: "#14B8A6" },
  { who: "Vikram D.", what: "flagged at-risk — 3 missed quizzes", when: "3 hr ago", color: "#EF4444" },
];

export default function SlideTeacherDashboard() {
  return (
    <SlideShell theme="dark">
      <div className="h-full flex flex-col px-12 pt-28 pb-20 bg-inherit">
        <div className="flex items-center justify-between mb-4">
          <div>
            <motion.div variants={slideChild} style={{ color: "#6366F1", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em" }}>
              REAL APP VIEW · TEACHER DASHBOARD
            </motion.div>
            <motion.h1 variants={slideHeading} style={{ fontWeight: 800, fontSize: 28, color: "#F1F5F9", letterSpacing: "-0.02em", marginTop: 4 }}>
              Every class. Every student. One dashboard.
            </motion.h1>
          </div>
          <motion.button variants={slideChild} className="rounded-lg px-4 py-2 flex items-center gap-2"
            style={{ background: "#6366F1", color: "white", fontSize: 13, fontWeight: 600 }}>
            <Plus size={14} /> New Class
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
              <div className="rounded-xl flex items-center justify-center" style={{ width: 40, height: 40, background: `${s.color}1A` }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#F1F5F9", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 3 }}>{s.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two columns */}
        <div className="flex-1 grid grid-cols-5 gap-5 min-h-0">
          {/* Classes */}
          <motion.div variants={slideChild} className="col-span-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Your Classes</div>
              <div style={{ fontSize: 11, color: "#6366F1", fontWeight: 600 }}>View all (14)</div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 flex-1">
              {classes.map(c => (
                <div key={c.name} className="rounded-xl p-3 flex flex-col"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#F1F5F9" }}>{c.name}</div>
                    <div className="rounded-full" style={{ width: 8, height: 8, background: c.color }} />
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="flex items-center gap-1" style={{ fontSize: 10.5, color: "#94A3B8" }}>
                      <Users size={11} /> {c.students}
                    </div>
                    <div className="flex items-center gap-1" style={{ fontSize: 10.5, color: "#10B981", fontWeight: 600 }}>
                      ● {c.attendance}%
                    </div>
                    <div className="flex items-center gap-1 ml-auto" style={{ fontSize: 10, color: "#94A3B8" }}>
                      <Clock size={10} /> {c.last}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Activity + reports */}
          <motion.div variants={slideChild} className="col-span-2 flex flex-col gap-3">
            <div className="rounded-xl p-3 flex-1 flex flex-col" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={13} color="#6366F1" />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>Upcoming Sessions</div>
              </div>
              <div className="space-y-1.5">
                {[
                  { c: "Class 10-A · Physics", t: "Tomorrow 09:00 AM" },
                  { c: "Class 12 · JEE Maths", t: "Tomorrow 11:30 AM" },
                  { c: "Class 9-B · Science", t: "Wed, Nov 13" },
                ].map(s => (
                  <div key={s.c} className="flex items-center justify-between rounded-lg px-2 py-1.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: 11, color: "#F1F5F9", fontWeight: 600 }}>{s.c}</div>
                    <div style={{ fontSize: 10, color: "#94A3B8" }}>{s.t}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-3 flex-1 flex flex-col" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Activity size={13} color="#F59E0B" />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>Recent Activity</div>
              </div>
              <div className="space-y-1.5 overflow-hidden">
                {activity.map(a => (
                  <div key={a.who + a.what} className="flex items-start gap-2">
                    <div className="rounded-full flex-shrink-0 mt-1.5" style={{ width: 6, height: 6, background: a.color }} />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 11, color: "#F1F5F9", lineHeight: 1.4 }}>
                        <b>{a.who}</b> {a.what}
                      </div>
                      <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{a.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #6366F1, #4338CA)", color: "white" }}>
              <BarChart3 size={14} />
              <div style={{ fontSize: 11, fontWeight: 600, flex: 1 }}>Weekly report ready for 14 classes</div>
              <ArrowRight size={14} />
            </div>
          </motion.div>
        </div>
      </div>
    </SlideShell>
  );
}
