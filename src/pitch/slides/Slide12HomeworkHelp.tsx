import { Calculator, Camera, Crop, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { VideoPlayer } from "../components/VideoPlayer";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide12HomeworkHelp() {
  return (
    <SlideShell theme="dark">
      <div className="absolute inset-x-0 top-0 flex" style={{ height: "40%" }}>
        <div className="flex-1 px-14 pt-14 pb-4 flex flex-col justify-center" style={{ maxWidth: "70%" }}>
          <motion.div variants={slideChild} className="inline-flex self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ background: "#F59E0B22", color: "#F59E0B", border: "1px solid #F59E0B55" }}>
            HOMEWORK HELP
          </motion.div>
          <motion.h1 variants={slideHeading} style={{ fontWeight: 800, fontSize: "clamp(22px,2.6vw,36px)", color: "white", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>
            From Class 6 arithmetic to JEE Advanced and B.Tech finals — Newton solves it.
          </motion.h1>
          <motion.div variants={slideChild} className="grid grid-cols-2 gap-4">
            <div>
              <div style={{ color: "#F87171", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>❌ THE PROBLEM</div>
              <div style={{ color: "#94A3B8", fontSize: 12.5, lineHeight: 1.5 }}>
                Engineering students get stuck on circuit analysis, multivariable calculus or thermodynamics at midnight. Google gives wrong answers. Tutors aren't online. The problem stays unsolved until class — and the gap compounds.
              </div>
            </div>
            <div>
              <div style={{ color: "#34D399", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>✅ NEWTON'S SOLUTION</div>
              <div style={{ color: "white", fontSize: 12.5, lineHeight: 1.5 }}>
                Snap a photo of any handwritten problem, or screenshot a question directly from any PDF. Newton reads it, identifies the concept, and solves it step-by-step with the right formula derivation — from school algebra to final-year engineering.
              </div>
            </div>
          </motion.div>
        </div>
        <div className="px-8 pt-10 pb-4 flex flex-col items-end justify-between" style={{ width: "30%" }}>
          <motion.div variants={slideChild} className="rounded-2xl flex items-center justify-center"
            style={{ width: 80, height: 80, background: "linear-gradient(135deg, #F59E0B, #B45309)", boxShadow: "0 12px 32px rgba(245,158,11,0.3)" }}>
            <Calculator size={42} color="white" strokeWidth={2} />
          </motion.div>
          <motion.div variants={slideChild} className="w-full space-y-2">
            {[
              { icon: Camera, t: "Snap any handwritten or printed problem" },
              { icon: Crop, t: "Screenshot crop directly from any class PDF" },
              { icon: Sparkles, t: "Step-by-step solution with concepts cited" },
            ].map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ width: 18, height: 18, background: "#F59E0B22" }}>
                  <h.icon size={11} color="#F59E0B" strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", lineHeight: 1.4 }}>{h.t}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-x-0 flex flex-col items-center px-8 pt-3"
        style={{ top: "40%", bottom: 52, background: "#F8FAFC" }}>
        <div className="w-full max-w-5xl mb-1.5">
          <div style={{ color: "#F59E0B", fontSize: 10, fontWeight: 700, letterSpacing: "0.25em" }}>WATCH HOW IT WORKS</div>
        </div>
        <div className="flex-1 w-full flex items-center justify-center min-h-0 pb-3 gap-6">
          {/* Visual: two input paths */}
          <div className="flex-shrink-0 flex flex-col gap-3" style={{ width: 220 }}>
            <motion.div variants={slideChild} className="rounded-2xl p-3 flex flex-col items-center"
              style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 6px 18px rgba(15,23,42,0.05)" }}>
              <div className="rounded-xl flex items-center justify-center mb-2" style={{ width: 48, height: 48, background: "#F59E0B18" }}>
                <Camera size={22} color="#F59E0B" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>Phone Camera</div>
              <div style={{ fontSize: 10, color: "#64748B", textAlign: "center", marginTop: 2, lineHeight: 1.3 }}>
                Click photo of any<br/>handwritten Q
              </div>
            </motion.div>
            <motion.div variants={slideChild} className="rounded-2xl p-3 flex flex-col items-center"
              style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 6px 18px rgba(15,23,42,0.05)" }}>
              <div className="rounded-xl flex items-center justify-center mb-2" style={{ width: 48, height: 48, background: "#6366F118" }}>
                <Crop size={22} color="#6366F1" />
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>PDF Screenshot</div>
              <div style={{ fontSize: 10, color: "#64748B", textAlign: "center", marginTop: 2, lineHeight: 1.3 }}>
                Crop directly from<br/>any open PDF
              </div>
            </motion.div>
            <div className="text-center" style={{ fontSize: 14, color: "#64748B" }}>↓</div>
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: "#0F172A", color: "white", fontSize: 11, fontWeight: 700 }}>
              Step-by-step solution
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0 h-full">
            <VideoPlayer
              toolKey="HOMEWORK_HELP"
              src={VIDEO_PATHS.HOMEWORK_HELP}
              toolName="Homework Help"
              toolIcon={<Calculator size={48} color="#F59E0B" />}
              caption="Student photographs a JEE-level rotational mechanics problem. Newton derives the moment-of-inertia step-by-step, citing every formula used."
            />
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
