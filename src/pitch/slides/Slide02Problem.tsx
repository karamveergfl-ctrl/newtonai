import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, AlertTriangle, IndianRupee, Clock, TrendingDown } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

function useCount(target: number, suffix = "", duration = 1200) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return `${n.toLocaleString()}${suffix}`;
}

function StatCard({ icon: Icon, value, label, sub, accent, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="rounded-2xl p-5 flex flex-col"
      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: "rgba(239,68,68,0.18)" }}>
          <Icon size={16} color="#F87171" strokeWidth={2.5} />
        </div>
        <div style={{ color: "#F87171", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em" }}>{label}</div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "white", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 8, lineHeight: 1.45 }}>{sub}</div>
    </motion.div>
  );
}

function CounterCard({ target, suffix, ...rest }: any) {
  const v = useCount(target, suffix);
  return <StatCard {...rest} value={v} />;
}

export default function Slide02Problem() {
  return (
    <SlideShell theme="dark">
      <div className="h-full flex flex-col px-16 pt-28 pb-20">
        <motion.div variants={slideChild} style={{ color: "#F59E0B", fontSize: 10, fontWeight: 700, letterSpacing: "0.3em" }}>
          THE CHALLENGE
        </motion.div>
        <motion.h1 variants={slideHeading} className="mt-2"
          style={{ fontWeight: 800, fontSize: 42, color: "white", lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 980 }}>
          The classroom hasn't changed in 100 years.<br/>
          <span style={{ color: "#F87171" }}>The world has.</span>
        </motion.h1>

        <div className="grid grid-cols-4 gap-4 mt-7">
          <CounterCard icon={Users} target={60} suffix=":1" label="STUDENT–TEACHER RATIO" sub="One teacher cannot give 60 students personal attention." delay={0.15} />
          <CounterCard icon={IndianRupee} target={20000} suffix="/mo" label="COACHING COST" sub="Out of reach for 70% of Indian families." delay={0.25} />
          <CounterCard icon={TrendingDown} target={73} suffix="%" label="FORGOTTEN IN 7 DAYS" sub="Without active revision, most lectures vanish from memory." delay={0.35} />
          <CounterCard icon={Clock} target={45} suffix=" min" label="DAILY COMMUTE WASTED" sub="No study material designed for travel time." delay={0.45} />
        </div>

        <motion.div variants={slideChild} className="mt-8 grid grid-cols-3 gap-4">
          {[
            { t: "Teachers are exhausted", b: "Grading, lesson-planning and quiz-making consume evenings and weekends." },
            { t: "Parents are anxious", b: "No visibility into what their child actually understands until exam day." },
            { t: "Institutions fly blind", b: "No early-warning system for students falling behind. NAAC/NBA reports done manually." },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <AlertTriangle size={18} color="#F59E0B" className="flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 14 }}>{c.t}</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3, lineHeight: 1.45 }}>{c.b}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}
