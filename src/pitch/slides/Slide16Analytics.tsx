import { motion } from "framer-motion";
import { Fragment } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

const trend = [
  { d: "Sep 12", v: 38 }, { d: "Sep 19", v: 47 }, { d: "Sep 26", v: 55 },
  { d: "Oct 3", v: 62 }, { d: "Oct 10", v: 71 }, { d: "Oct 17", v: 68 },
  { d: "Oct 24", v: 78 }, { d: "Oct 31", v: 84 },
];
const barColor = (v: number) => v < 50 ? "#EF4444" : v < 65 ? "#F59E0B" : "#10B981";
const topics = ["Algebra", "Geometry", "Calculus", "Statistics", "Trigonometry"];
const students = ["S1","S2","S3","S4","S5","S6"];
const heatColors = ["#10B981", "#F59E0B", "#EF4444", "#E2E8F0"];
const heatGrid: number[][] = [
  [0,0,1,2,1],[0,1,1,0,2],[1,0,0,1,1],[2,2,1,0,3],[0,1,2,1,0],[1,0,1,2,1],
];

export default function Slide16Analytics() {
  return (
    <SlideShell theme="light">
      <div className="h-full flex flex-col px-14 pt-24 pb-16">
        <div>
          <motion.div variants={slideChild} style={{ color: "#6366F1", fontSize: 11, fontWeight: 700, letterSpacing: "0.3em" }}>
            INSTITUTION DASHBOARD
          </motion.div>
          <motion.h1 variants={slideHeading} className="mt-2" style={{ fontWeight: 800, fontSize: 36, color: "#0F172A", letterSpacing: "-0.02em" }}>
            Every teacher. Every class. Every student. All in one view.
          </motion.h1>
          <motion.p variants={slideChild} className="mt-2" style={{ fontSize: 15, color: "#475569", maxWidth: 760 }}>
            NewtonAI gives your institution real-time performance data, early warning alerts, and NAAC/NBA-ready compliance reports — automatically.
          </motion.p>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-5 mt-6 min-h-0">
          <motion.div variants={slideChild} className="col-span-3 flex flex-col gap-3">
            <StatCard label="Class Average Understanding" value="74%" trend="↑" trendColor="#10B981" />
            <StatCard label="Sessions This Month" value="48" trend="—" trendColor="#6366F1" sparkline />
            <StatCard label="Students At Risk" value="3" trend="⚠" trendColor="#EF4444" warn />
            <StatCard label="Quiz Completion Rate" value="91%" trend="↑" trendColor="#10B981" />
          </motion.div>

          <motion.div variants={slideChild} className="col-span-6 rounded-2xl p-5 flex flex-col"
            style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0F172A" }}>Understanding Trend — Last 8 Sessions</div>
            <div className="flex-1 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trend} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="d" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={50} stroke="#EF4444" strokeDasharray="4 4" label={{ value: "Alert threshold", fontSize: 10, fill: "#EF4444", position: "insideTopRight" }} />
                  <Bar dataKey="v" radius={[6,6,0,0]}>
                    {trend.map((t, i) => <Cell key={i} fill={barColor(t.v)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={slideChild} className="col-span-3 rounded-2xl p-4 flex flex-col"
            style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 8px 24px rgba(15,23,42,0.05)" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>Knowledge Gap Heatmap</div>
            <div className="grid mt-3" style={{ gridTemplateColumns: `60px repeat(${topics.length}, 1fr)`, gap: 4 }}>
              <div />
              {topics.map(t => <div key={t} style={{ fontSize: 9, color: "#64748B", textAlign: "center", transform: "rotate(-25deg)", transformOrigin: "center" }}>{t}</div>)}
              {students.map((s, r) => (
                <Fragment key={s}>
                  <div style={{ fontSize: 10, color: "#64748B", display: "flex", alignItems: "center" }}>{s}</div>
                  {topics.map((_, c) => (
                    <div key={`${r}-${c}`} className="rounded" style={{ aspectRatio: "1", background: heatColors[heatGrid[r][c]] }} />
                  ))}
                </Fragment>
              ))}
            </div>
            <div className="mt-auto pt-3 flex items-center gap-2 text-[10px]" style={{ color: "#64748B" }}>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#10B981" }} />Mastered</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#F59E0B" }} />Partial</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ background: "#EF4444" }} />Struggling</span>
            </div>
          </motion.div>
        </div>

        <motion.div variants={slideChild} className="flex gap-3 justify-center mt-5">
          {["📊 NAAC/NBA Compliant Reports", "⚠ Auto Red Flag Alerts", "📧 Weekly Reports to Parents"].map(p => (
            <div key={p} className="px-4 py-2 rounded-full" style={{ background: "rgba(99,102,241,0.1)", color: "#4338CA", fontSize: 12, fontWeight: 600 }}>{p}</div>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}

function StatCard({ label, value, trend, trendColor, sparkline, warn }: { label: string; value: string; trend: string; trendColor: string; sparkline?: boolean; warn?: boolean; }) {
  return (
    <div className="rounded-2xl p-4 flex-1"
      style={{ background: "white", border: `1px solid ${warn ? "rgba(239,68,68,0.3)" : "#E2E8F0"}`, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}>
      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{label}</div>
      <div className="flex items-end justify-between mt-1">
        <div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>{value}</div>
        <div style={{ fontSize: 18, color: trendColor, fontWeight: 700 }}>{trend}</div>
      </div>
      {sparkline && (
        <svg viewBox="0 0 100 24" className="mt-1 w-full h-6">
          <polyline points="0,18 14,14 28,16 42,10 56,12 70,6 84,8 100,4"
            fill="none" stroke="#6366F1" strokeWidth="2" />
        </svg>
      )}
    </div>
  );
}