import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";
import { Bar, BarChart, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

const DATA = [
  { year: "Y1", students: 8,   revenue: 5.3,  ebitda: -1.5 },
  { year: "Y2", students: 15,  revenue: 10,   ebitda: 1.2 },
  { year: "Y3", students: 30,  revenue: 20,   ebitda: 5.5 },
  { year: "Y4", students: 60,  revenue: 40,   ebitda: 14 },
  { year: "Y5", students: 100, revenue: 67,   ebitda: 26 },
];

export default function Slide06Financials() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col px-14 pt-20 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideHeading}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.3em", color: "#6366F1", textTransform: "uppercase" }}>5-Year Projection</div>
          <h1 style={{ fontWeight: 900, fontSize: 40, color: "#0F172A", letterSpacing: "-0.035em", lineHeight: 1.1, margin: "6px 0 0 0" }}>
            From ₹5.3 Cr → <span style={{ color: "#059669" }}>₹67 Cr+</span> in 5 years.
          </h1>
        </motion.div>

        <motion.div variants={slideChild} className="mt-6 grid grid-cols-5 gap-3">
          {DATA.map(d => (
            <div key={d.year} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#6366F1", letterSpacing: "0.2em" }}>{d.year}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#0F172A" }}>{d.students}k</div>
              <div style={{ fontSize: 10, color: "#64748B" }}>students</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#059669", marginTop: 4 }}>₹{d.revenue} Cr</div>
            </div>
          ))}
        </motion.div>

        <motion.div variants={slideChild} className="mt-5 flex-1 min-h-0 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={DATA} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="year" stroke="#64748B" style={{ fontSize: 12, fontWeight: 600 }} />
              <YAxis stroke="#64748B" style={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" name="Revenue (₹ Cr)" fill="url(#revGrad)" radius={[8,8,0,0]} barSize={42} />
              <Line type="monotone" dataKey="ebitda" name="EBITDA (₹ Cr)" stroke="#059669" strokeWidth={3} dot={{ r: 5, fill: "#059669" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={slideChild} className="mt-4 grid grid-cols-3 gap-3">
          {[
            { k: "Gross Margin", v: "75–85%" },
            { k: "EBITDA by Y3", v: "Positive" },
            { k: "5-Yr CAGR", v: "~88%" },
          ].map(s => (
            <div key={s.k} className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(238,242,255,0.7)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#6366F1", letterSpacing: "0.2em", textTransform: "uppercase" }}>{s.k}</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: "#0F172A" }}>{s.v}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}