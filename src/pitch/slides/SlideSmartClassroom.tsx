import { motion } from "framer-motion";
import { Wand2, FileText, MonitorPlay, Sparkles } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { VideoPlayer } from "../components/VideoPlayer";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function SlideSmartClassroom() {
  return (
    <SlideShell theme="dark">
      <div className="h-full flex flex-col px-14 pt-24 pb-20">
        <motion.div variants={slideChild} style={{ color: "#14B8A6", fontSize: 11, fontWeight: 700, letterSpacing: "0.3em" }}>
          FOR TEACHERS · LIVE SMART CLASSROOM
        </motion.div>
        <motion.h1 variants={slideHeading} className="mt-2"
          style={{ fontWeight: 800, fontSize: 36, color: "white", lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: 1100 }}>
          Click a topic → an animated explainer appears on the smart board in 8 seconds.
        </motion.h1>
        <motion.p variants={slideChild} className="mt-2"
          style={{ fontSize: 14, color: "#94A3B8", maxWidth: 880, lineHeight: 1.55 }}>
          Instead of static diagrams, Newton instantly generates a moving visual explanation from the teacher's PDF + notes for any concept — orbits, photosynthesis, AC circuits, mitosis — so students actually <em>see</em> what's happening.
        </motion.p>

        <div className="flex-1 grid grid-cols-12 gap-5 mt-6 min-h-0">
          {/* Demo video */}
          <motion.div variants={slideChild} className="col-span-8 flex items-center justify-center min-h-0">
            <VideoPlayer toolKey="SMART_CLASSROOM" src={VIDEO_PATHS.SMART_CLASSROOM}
              toolName="Smart Classroom" toolIcon={<MonitorPlay size={32} color="#14B8A6" />}
              caption="" maxWidth="100%" />
          </motion.div>

          {/* Side info */}
          <div className="col-span-4 flex flex-col gap-3">
            <motion.div variants={slideChild} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#14B8A622" }}>
                <Wand2 size={18} color="#5EEAD4" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>Type → Animate</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2, lineHeight: 1.5 }}>Teacher types a concept; Newton renders a moving visual using class PDF + notes as the source of truth.</div>
              </div>
            </motion.div>
            <motion.div variants={slideChild} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#6366F122" }}>
                <FileText size={18} color="#A5B4FC" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>Grounded in your syllabus</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2, lineHeight: 1.5 }}>Animations pulled from the exact pages being taught — no off-syllabus content.</div>
              </div>
            </motion.div>
            <motion.div variants={slideChild} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#F59E0B22" }}>
                <MonitorPlay size={18} color="#FCD34D" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>Mirrors to every student device</div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2, lineHeight: 1.5 }}>The animation also plays on student phones/tablets so back-benchers see clearly.</div>
              </div>
            </motion.div>
            <motion.div variants={slideChild} className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #14B8A622, #6366F122)", border: "1px solid #14B8A655" }}>
              <Sparkles size={14} color="#5EEAD4" />
              <span style={{ fontSize: 11.5, color: "white", fontWeight: 600 }}>Every session auto-captured → fed into class AI tutor</span>
            </motion.div>
          </div>
        </div>

      </div>
    </SlideShell>
  );
}
