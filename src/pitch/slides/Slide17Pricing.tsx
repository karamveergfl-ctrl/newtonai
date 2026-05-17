import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

interface Plan {
  label: string; labelColor: string; priceValue: string; priceSub: string; features: string[];
  cta: string; popular?: boolean; ctaStyle: "indigo" | "white" | "tealOutline"; tealAccent?: boolean;
}

const plans: Plan[] = [
  { label: "FOR SCHOOLS", labelColor: "#6366F1", priceValue: "₹150", priceSub: "/student/month",
    features: ["Unlimited AI tutoring sessions","Smart classroom tools","Auto notes & study guides","Parent progress reports","Teacher analytics dashboard","CBSE & ICSE curriculum aligned"],
    cta: "Get Started for Your School", ctaStyle: "indigo" },
  { label: "FOR COACHING CENTRES", labelColor: "#F59E0B", priceValue: "₹200", priceSub: "/student/month",
    features: ["Everything in School Plan","Batch management","Custom quiz libraries","Competitive exam prep (JEE/NEET)","WhatsApp parent reports","Rank lists & report cards"],
    cta: "Start Your Free Trial", popular: true, ctaStyle: "white" },
  { label: "FOR UNIVERSITIES", labelColor: "#14B8A6", priceValue: "Custom", priceSub: "Based on enrollment and departments.",
    features: ["Everything + Department management","Faculty performance reports","NAAC/NBA audit trails","LMS integration","Dedicated support","API access"],
    cta: "Contact Us for Pricing", ctaStyle: "tealOutline", tealAccent: true },
];

export default function Slide17Pricing() {
  return (
    <SlideShell theme="dark">
      <div className="h-full flex flex-col px-16 pt-24 pb-20">
        <div className="text-center">
          <motion.div variants={slideChild} style={{ color: "#F59E0B", fontSize: 11, fontWeight: 700, letterSpacing: "0.3em" }}>
            SIMPLE PRICING
          </motion.div>
          <motion.h1 variants={slideHeading} className="mt-2" style={{ fontWeight: 800, fontSize: 38, color: "white", letterSpacing: "-0.02em" }}>
            One platform. Three ways to deploy.
          </motion.h1>
          <motion.p variants={slideChild} className="mt-2" style={{ fontSize: 15, color: "#94A3B8" }}>
            No hardware required. No IT team needed. Ready to use in one day.
          </motion.p>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-6 mt-10 items-center">
          {plans.map((p) => (
            <motion.div key={p.label} variants={slideChild}
              className="rounded-2xl p-7 flex flex-col relative"
              style={{
                background: p.popular ? "linear-gradient(160deg, #6366F1, #4338CA)" : "rgba(99,102,241,0.08)",
                border: p.popular ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(99,102,241,0.3)",
                transform: p.popular ? "scale(1.04)" : "none",
                zIndex: p.popular ? 5 : 1,
                boxShadow: p.popular ? "0 24px 60px rgba(99,102,241,0.4)" : "none",
              }}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider"
                  style={{ background: "#F59E0B", color: "#0F172A" }}>
                  MOST POPULAR
                </div>
              )}
              <div className="px-2.5 py-1 rounded-full self-start text-[10px] font-bold tracking-[0.2em]"
                style={{ background: `${p.labelColor}25`, color: p.popular ? "#FCD34D" : p.labelColor, border: `1px solid ${p.labelColor}55` }}>
                {p.label}
              </div>
              <div className="mt-4">
                <span style={{ fontSize: p.priceValue === "Custom" ? 42 : 48, fontWeight: 800, color: "white", letterSpacing: "-0.03em" }}>{p.priceValue}</span>
                {p.priceValue !== "Custom" && <span style={{ fontSize: 14, color: p.popular ? "rgba(255,255,255,0.7)" : "#94A3B8", marginLeft: 4 }}>{p.priceSub}</span>}
              </div>
              {p.priceValue === "Custom" && <div style={{ fontSize: 13, color: "rgba(148,163,184,0.9)", marginTop: 4 }}>{p.priceSub}</div>}
              <div className="mt-5 space-y-2 flex-1">
                {p.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={14} color={p.popular ? "#FCD34D" : "#10B981"} strokeWidth={3} className="mt-0.5 flex-shrink-0" />
                    <span style={{ fontSize: 12.5, color: p.popular ? "rgba(255,255,255,0.9)" : "#CBD5E1" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className="mt-5 w-full py-2.5 rounded-lg text-sm font-bold transition-transform hover:scale-[1.02]"
                style={
                  p.ctaStyle === "indigo" ? { background: "#6366F1", color: "white" } :
                  p.ctaStyle === "white" ? { background: "white", color: "#4338CA" } :
                  { background: "transparent", color: "#14B8A6", border: "1px solid #14B8A6" }
                }>
                {p.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div variants={slideChild} className="text-center mt-6" style={{ fontSize: 13, color: "#94A3B8" }}>
          🎁 First 3 months free for pilot institutions · No credit card required · Cancel anytime
        </motion.div>
      </div>
    </SlideShell>
  );
}