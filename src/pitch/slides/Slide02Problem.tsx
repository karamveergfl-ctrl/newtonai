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
      style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 6px 20px rgba(239,68,68,0.06)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="rounded-lg flex items-center justify-center" style={{ width: 32, height: 32, background: "rgba(239,68,68,0.12)" }}>
          <Icon size={16} color="#DC2626" strokeWidth={2.5} />
        </div>
        <div style={{ color: "#DC2626", fontSize: 9, fontWeight: 800, letterSpacing: "0.18em" }}>{label}</div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.45 }}>{sub}</div>
    </motion.div>
  );
}

function CounterCard({ target, suffix, ...rest }: any) {
  const v = useCount(target, suffix);
  return <StatCard {...rest} value={v} />;
}

export default function Slide02Problem() {
  return (
    <SlideShell theme="light">
      <div className="h-full flex flex-col px-16 pt-28 pb-24">
        <motion.div variants={slideChild} style={{ color: "#D97706", fontSize: 11, fontWeight: 800, letterSpacing: "0.3em" }}>
          THE CHALLENGE
        </motion.div>
        <motion.h1 variants={slideHeading} className="mt-2"
          style={{ fontWeight: 800, fontSize: 42, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.02em", maxWidth: 980 }}>
          The classroom hasn't changed in 100 years.<br/>
          <span style={{ color: "#DC2626" }}>The world has.</span>
        </motion.h1>

        <div className="grid grid-cols-4 gap-4 mt-7">
          <CounterCard icon={Users} target={60} suffix=":1" label={<>STUDENT–TEACHER RATIO<sup>1</sup></>} sub="One teacher cannot give 60 students personal attention." delay={0.15} />
          <CounterCard icon={IndianRupee} target={20000} suffix="/mo" label={<>COACHING COST<sup>2</sup></>} sub="Out of reach for 70% of Indian families." delay={0.25} />
          <CounterCard icon={TrendingDown} target={73} suffix="%" label={<>FORGOTTEN IN 7 DAYS<sup>3</sup></>} sub="Without active revision, most lectures vanish from memory." delay={0.35} />
          <CounterCard icon={Clock} target={45} suffix=" min" label={<>DAILY COMMUTE WASTED<sup>4</sup></>} sub="No study material designed for travel time." delay={0.45} />
        </div>

        <motion.div variants={slideChild} className="mt-8 grid grid-cols-3 gap-4">
          {[
            { t: "Teachers are exhausted", b: "Grading, lesson-planning and quiz-making consume evenings and weekends." },
            { t: "Parents are anxious", b: "No visibility into what their child actually understands until exam day." },
            { t: "Institutions fly blind", b: "No early-warning system for students falling behind. NAAC/NBA reports done manually." },
          ].map((c, i) => (
            <div key={i} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.75)", border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
              <AlertTriangle size={18} color="#D97706" className="flex-shrink-0 mt-0.5" />
              <div>
                <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 14 }}>{c.t}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 3, lineHeight: 1.45 }}>{c.b}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Sources */}
        <div className="mt-5 pt-3" style={{ borderTop: "1px dashed #CBD5E1" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.18em", marginBottom: 4 }}>SOURCES</div>
          <div style={{ fontSize: 10.5, color: "#64748B", lineHeight: 1.55, fontStyle: "italic" }}>
            <sup>1</sup> UDISE+ Report 2022-23, Ministry of Education (India avg PTR 26:1; large govt schools up to 60:1). &nbsp;
            <sup>2</sup> ASER Centre &amp; NSO Household Education Survey 2022 (private coaching ₹15–25k/mo for STEM in tier-1 cities). &nbsp;
            <sup>3</sup> Ebbinghaus Forgetting Curve, replicated in Murre &amp; Dros, PLoS ONE 2015 (~70% forgotten within a week without revision). &nbsp;
            <sup>4</sup> NSSO Time-Use Survey 2019 (avg 45-min one-way school commute, urban India).
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
