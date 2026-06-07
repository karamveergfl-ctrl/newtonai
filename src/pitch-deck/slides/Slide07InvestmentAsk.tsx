import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

const CAP_TABLE = [
  { name: "Karamveer Singh", value: 81, color: "#6366F1" },
  { name: "Saif Malik",      value: 9,  color: "#06b6d4" },
  { name: "Investor",        value: 10, color: "#B45309" },
];

export default function Slide07InvestmentAsk() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col px-14 pt-20 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideHeading}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.3em", color: "#B45309", textTransform: "uppercase" }}>Investment Ask</div>
          <h1 style={{ fontWeight: 900, fontSize: 40, color: "#0F172A", letterSpacing: "-0.035em", lineHeight: 1.1, margin: "6px 0 0 0" }}>
            We're raising to scale a category we already lead.
          </h1>
        </motion.div>

        <motion.div variants={slideChild} className="grid grid-cols-3 gap-5 mt-7">
          {[
            { k: "Pre-Money Valuation", v: "₹7 Cr", color: "#6366F1", gradient: "linear-gradient(135deg,#EEF2FF,#F3F0FF)" },
            { k: "Investment Ask",       v: "₹70 Lakhs", color: "#059669", gradient: "linear-gradient(135deg,#ECFDF5,#F0FDFA)" },
            { k: "Equity Offered",       v: "10%", color: "#B45309", gradient: "linear-gradient(135deg,#FEF3C7,#FFFBEB)" },
          ].map(s => (
            <div key={s.k} className="rounded-2xl p-6" style={{ background: s.gradient, border: `1px solid ${s.color}33` }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: s.color, letterSpacing: "0.22em", textTransform: "uppercase" }}>{s.k}</div>
              <div style={{ fontSize: 44, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.04em", marginTop: 6, lineHeight: 1 }}>{s.v}</div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-2 gap-6 mt-7 flex-1 min-h-0">
          <motion.div variants={slideChild} className="rounded-2xl p-5 flex flex-col" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", color: "#6366F1", textTransform: "uppercase", marginBottom: 8 }}>Post-Investment Cap Table</div>
            <div className="flex items-center gap-4 flex-1 min-h-0">
              <div style={{ width: 180, height: 180 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={CAP_TABLE} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                      {CAP_TABLE.map(c => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {CAP_TABLE.map(c => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: c.color, display: "inline-block" }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 900, color: c.color }}>{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={slideChild} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", color: "#059669", textTransform: "uppercase", marginBottom: 10 }}>Why Invest</div>
            <ul className="space-y-2 m-0 p-0 list-none">
              {[
                "Large, fast-growing EdTech market ($404B+)",
                "AI-first product with 16+ integrated tools",
                "Owns the Smart Classroom OS category",
                "Scalable SaaS with 75–85% gross margin",
                "Strong unit economics, <6 mo payback",
                "Global expansion-ready (B2B + B2C)",
              ].map(p => (
                <li key={p} className="flex items-start gap-2" style={{ fontSize: 14, color: "#0F172A" }}>
                  <span style={{ color: "#059669", fontWeight: 800 }}>✓</span><span>{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </SlideShell>
  );
}