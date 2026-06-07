import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

export default function SlideStudentToolsIntro() {
  return (
    <SlideShell theme="light">
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
        <motion.div
          variants={slideChild}
          className="rounded-3xl flex items-center justify-center mb-8"
          style={{
            width: 140,
            height: 140,
            background: "linear-gradient(135deg, #6366F1, #4338CA)",
            boxShadow: "0 20px 60px rgba(99,102,241,0.35)",
          }}
        >
          <GraduationCap size={70} color="white" strokeWidth={1.8} />
        </motion.div>
        <motion.div
          variants={slideChild}
          className="px-4 py-1.5 rounded-full mb-5"
          style={{
            background: "rgba(99,102,241,0.10)",
            border: "1px solid rgba(99,102,241,0.35)",
            color: "#4338CA",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: "0.4em",
          }}
        >
          SECTION ONE
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
          Student Tools
        </motion.h1>
        <motion.p
          variants={slideChild}
          className="mt-6"
          style={{
            fontSize: 22,
            color: "#475569",
            maxWidth: 760,
            lineHeight: 1.45,
          }}
        >
          Nine personalised AI study tools that help students learn faster,
          retain more, and stay focused — anytime, anywhere.
        </motion.p>
        <motion.div variants={slideChild} className="mt-10 flex gap-3 flex-wrap justify-center" style={{ maxWidth: 880 }}>
          {["AI Quiz", "Flashcards", "Podcast", "Newton Chat", "Ad-Free Videos", "Summariser", "Homework Help", "PDF Chat", "Mind Maps"].map((t) => (
            <span
              key={t}
              className="px-3.5 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "#4338CA",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </SlideShell>
  );
}