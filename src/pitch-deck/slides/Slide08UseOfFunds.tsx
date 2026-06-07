import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

const ALLOCATION = [
  { name: "Product Development",     pct: 35, amount: "₹24.5 L", color: "#6366F1" },
  { name: "AI Infrastructure",       pct: 20, amount: "₹14.0 L", color: "#a855f7" },
  { name: "Sales & Marketing",       pct: 20, amount: "₹14.0 L", color: "#06b6d4" },
  { name: "Team Hiring",             pct: 15, amount: "₹10.5 L", color: "#10B981" },
  { name: "Operations & Compliance", pct: 5,  amount: "₹3.5 L",  color: "#F59E0B" },
  { name: "Working Capital",         pct: 5,  amount: "₹3.5 L",  color: "#EF4444" },
];

export default function Slide08UseOfFunds() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col px-14 pt-20 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideHeading}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.3em", color: "#6366F1", textTransform: "uppercase" }}>Use of Funds</div>
          <h1 style={{ fontWeight: 900, fontSize: 40, color: "#0F172A", letterSpacing: "-0.035em", lineHeight: 1.1, margin: "6px 0 0 0" }}>
            ₹70 Lakhs — engineered to compound.
          </h1>
        </motion.div>

        <div className="grid grid-cols-5 gap-6 mt-6 flex-1 min-h-0 items-center">
          <motion.div variants={slideChild} className="col-span-2 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ALLOCATION}
                  dataKey="pct"
                  innerRadius={70}
                  outerRadius={130}
                  paddingAngle={2}
                  stroke="none"
                  label={({ percent }) => `${Math.round((percent || 0) * 100)}%`}
                  labelLine={false}
                  style={{ fontSize: 13, fontWeight: 800, fill: "#fff" }}
                >
                  {ALLOCATION.map(a => <Cell key={a.name} fill={a.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={slideChild} className="col-span-3 grid grid-cols-1 gap-2.5">
            {ALLOCATION.map(a => (
              <div key={a.name} className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.85)", border: `1px solid ${a.color}33` }}>
                <div className="flex items-center gap-3">
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: a.color, display: "inline-block" }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{a.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#64748B" }}>{a.amount}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: a.color, minWidth: 48, textAlign: "right" }}>{a.pct}%</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </SlideShell>
  );
}