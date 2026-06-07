import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

function RevenueCard({ flag, region, tier, channel, price, arpu, color, gradient }: { flag: string; region: string; tier: string; channel: string; price: string; arpu: string; color: string; gradient: string; }) {
  return (
    <div className="rounded-2xl p-7 backdrop-blur-sm flex flex-col" style={{ background: "rgba(255,255,255,0.85)", border: `1px solid ${color}33`, boxShadow: `0 14px 36px ${color}22` }}>
      <div className="flex items-center gap-3 mb-3">
        <span style={{ fontSize: 28 }}>{flag}</span>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{region}</div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: "0.04em", color }}>{tier}</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color, textTransform: "uppercase", opacity: 0.85 }}>{channel}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl p-4" style={{ background: gradient, color: "white" }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", opacity: 0.85, textTransform: "uppercase" }}>Per Student / Month</div>
        <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{price}</div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.15em", textTransform: "uppercase" }}>Annual ARPU</div>
        <div style={{ fontSize: 22, fontWeight: 900, color }}>{arpu}</div>
      </div>
    </div>
  );
}

export default function Slide05BusinessModel() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col px-14 pt-20 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideHeading}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.3em", color: "#059669", textTransform: "uppercase" }}>Business Model</div>
          <h1 style={{ fontWeight: 900, fontSize: 40, color: "#0F172A", letterSpacing: "-0.035em", lineHeight: 1.1, margin: "6px 0 0 0" }}>
            A SaaS engine — priced for India, scaled for the world.
          </h1>
        </motion.div>

        <motion.div variants={slideChild} className="grid grid-cols-2 gap-6 mt-8">
          <RevenueCard flag="🇮🇳" region="India" tier="B2B" channel="· Schools · Colleges · Coaching" price="$10/mo" arpu="$80/yr" color="#6366F1" gradient="linear-gradient(135deg,#6366F1,#a855f7)" />
          <RevenueCard flag="🌍" region="Global" tier="B2C" channel="· USA · UK · CA · AU · EU" price="$10/mo" arpu="$80/yr" color="#06b6d4" gradient="linear-gradient(135deg,#06b6d4,#3b82f6)" />
        </motion.div>

        <motion.div variants={slideChild} className="mt-8">
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.26em", color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Additional Revenue Streams</div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Enterprise Licensing", icon: "🏢" },
              { label: "White-Label Solutions", icon: "🎨" },
              { label: "Premium AI Credits", icon: "⚡" },
              { label: "Institutional Analytics", icon: "📊" },
              { label: "API Licensing", icon: "🔌" },
            ].map(c => (
              <div key={c.label} className="px-4 py-2.5 rounded-full flex items-center gap-2" style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(99,102,241,0.25)" }}>
                <span>{c.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{c.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={slideChild} className="mt-auto grid grid-cols-3 gap-4">
          {[
            { k: "SaaS Gross Margin", v: "75–85%" },
            { k: "Payback Period", v: "<6 months" },
            { k: "Net Revenue Retention", v: "120%+" },
          ].map(s => (
            <div key={s.k} className="rounded-xl p-4" style={{ background: "rgba(238,242,255,0.7)", border: "1px solid rgba(99,102,241,0.2)" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.22em", color: "#6366F1", textTransform: "uppercase" }}>{s.k}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0F172A", letterSpacing: "-0.02em" }}>{s.v}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}