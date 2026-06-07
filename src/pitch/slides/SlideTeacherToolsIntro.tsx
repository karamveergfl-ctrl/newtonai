import { motion } from "framer-motion";
import { Presentation } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

export default function SlideTeacherToolsIntro() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
        <motion.div
          variants={slideChild}
          className="rounded-3xl flex items-center justify-center mb-8"
          style={{
            width: 140,
            height: 140,
            background: "linear-gradient(135deg, #F59E0B, #B45309)",
            boxShadow: "0 20px 60px rgba(245,158,11,0.35)",
          }}
        >
          <Presentation size={70} color="white" strokeWidth={1.8} />
        </motion.div>
        <motion.div
          variants={slideChild}
          className="px-4 py-1.5 rounded-full mb-5"
          style={{
            background: "rgba(245,158,11,0.10)",
            border: "1px solid rgba(245,158,11,0.40)",
            color: "#B45309",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.4em",
          }}
        >
          SECTION TWO
        </motion.div>
        <motion.h1
          variants={slideHeading}
          style={{
            fontWeight: 900,
            fontSize: "clamp(56px, 7vw, 96px)",
            color: "#0F172A",
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          Teacher & Classroom Tools
        </motion.h1>
        <motion.p
          variants={slideChild}
          className="mt-6"
          style={{
            fontSize: 22,
            color: "#475569",
            maxWidth: 800,
            lineHeight: 1.45,
          }}
        >
          Live-classroom tools that save teachers hours, automate attendance,
          and turn any smartboard into an animated explainer.
        </motion.p>
        <motion.div variants={slideChild} className="mt-10 flex gap-3 flex-wrap justify-center" style={{ maxWidth: 700 }}>
          {[
            { t: "Smart Classroom", c: "#059669", label: "SMARTBOARD" },
            { t: "In-Class Quiz + Attendance", c: "#D97706", label: "TEACHER" },
            { t: "Teacher Dashboard", c: "#D97706", label: "TEACHER" },
          ].map((x) => (
            <span
              key={x.t}
              className="px-3.5 py-1.5 rounded-full inline-flex items-center gap-2"
              style={{
                background: "rgba(255,255,255,0.85)",
                border: `1px solid ${x.c}55`,
                color: "#0F172A",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {x.t}
              <span style={{ fontSize: 9, fontWeight: 800, color: x.c, letterSpacing: "0.16em" }}>{x.label}</span>
            </span>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}