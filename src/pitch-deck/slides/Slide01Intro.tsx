import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "@/pitch/components/SlideShell";
import { Logo } from "@/pitch/components/Logo";

const FONT = `'Plus Jakarta Sans', system-ui, sans-serif`;

function FounderCard({ name, role, points, initials, gradient }: { name: string; role: string; points: string[]; initials: string; gradient: string; }) {
  return (
    <div className="rounded-2xl p-7 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.78)", border: "1px solid rgba(99,102,241,0.18)", boxShadow: "0 10px 30px rgba(99,102,241,0.08)" }}>
      <div className="flex items-center gap-4 mb-5">
        <div className="rounded-2xl flex items-center justify-center text-white font-extrabold" style={{ width: 64, height: 64, background: gradient, fontSize: 24, boxShadow: "0 8px 20px rgba(99,102,241,0.35)" }}>{initials}</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>{name}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4338CA", letterSpacing: "0.08em", textTransform: "uppercase" }}>{role}</div>
        </div>
      </div>
      <ul className="space-y-2 m-0 p-0 list-none">
        {points.map(p => (
          <li key={p} className="flex items-start gap-2" style={{ fontSize: 14, color: "#475569" }}>
            <span style={{ color: "#6366F1", fontWeight: 800 }}>•</span><span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Slide01Intro() {
  return (
    <SlideShell theme="light" noLogo>
      <div className="absolute inset-0 flex flex-col px-16 pt-14 pb-20" style={{ fontFamily: FONT }}>
        <motion.div variants={slideChild}>
          <Logo size="lg" />
        </motion.div>
        <motion.div variants={slideHeading} className="mt-8">
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.3em", color: "#6366F1", textTransform: "uppercase" }}>NewtonAI EdTech Private Limited</div>
          <h1 style={{ fontWeight: 900, fontSize: "clamp(36px,5vw,60px)", color: "#0F172A", letterSpacing: "-0.04em", lineHeight: 1.05, margin: "10px 0 0 0" }}>
            The Intelligent <span style={{ background: "linear-gradient(135deg,#6366F1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Classroom OS</span>
          </h1>
          <p style={{ fontSize: 17, color: "#475569", marginTop: 10, maxWidth: 720 }}>
            Transforming teaching, learning, and academic management through AI — one school at a time.
          </p>
        </motion.div>

        <motion.div variants={slideChild} className="grid grid-cols-2 gap-6 mt-10">
          <FounderCard name="Karamveer Singh" role="Founder & CEO" initials="KS" gradient="linear-gradient(135deg,#6366F1,#a855f7)" points={["B.E. Mechanical Engineering (3rd Year)", "Product vision & AI architecture", "Smart classroom design", "Education innovation"]} />
          <FounderCard name="Saif Malik" role="Business Development" initials="SM" gradient="linear-gradient(135deg,#3b82f6,#06b6d4)" points={["B.E. Mechanical Engineering (3rd Year)", "Sales & institutional partnerships", "Institution acquisition", "Market expansion"]} />
        </motion.div>

        <motion.div variants={slideChild} className="mt-8 rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.06))", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.26em", color: "#6366F1", textTransform: "uppercase", marginBottom: 6 }}>Vision</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", lineHeight: 1.4 }}>
            To become the operating system powering classrooms worldwide.
          </div>
        </motion.div>
      </div>
    </SlideShell>
  );
}