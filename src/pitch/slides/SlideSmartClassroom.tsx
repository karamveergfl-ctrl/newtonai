import { motion } from "framer-motion";
import { Wand2, FileText, MonitorPlay, Sparkles } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { VideoPlayer } from "../components/VideoPlayer";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function SlideSmartClassroom() {
  return (
    <SlideShell theme="light">
      <div className="h-full flex flex-col px-14 pt-28 pb-24">
        <motion.div variants={slideChild} style={{ color: "#059669", fontSize: 11, fontWeight: 800, letterSpacing: "0.3em" }}>
          SMARTBOARD · SHARED CLASSROOM TOOL
        </motion.div>
        <motion.h1 variants={slideHeading} className="mt-1 text-left"
          style={{ fontWeight: 900, fontSize: 44, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: 1200 }}>
          Click a topic → an animated explainer appears on the smart board in seconds.
        </motion.h1>
        <motion.p variants={slideChild} className="mt-2"
          style={{ fontSize: 14, color: "#475569", maxWidth: 940, lineHeight: 1.55 }}>
            Instead of static diagrams, Newton instantly generates a moving visual explanation from the teacher's PDF + notes for any concept — orbits, photosynthesis, AC circuits, mitosis — so students actually <em>see</em> what's going.
        </motion.p>

        <div className="flex-1 grid grid-cols-12 gap-5 mt-8 min-h-0">
          {/* Demo video */}
          <motion.div variants={slideChild} className="col-span-8 flex items-center justify-center min-h-0">
            <VideoPlayer toolKey="SMART_CLASSROOM" src={VIDEO_PATHS.SMART_CLASSROOM}
              toolName="Smart Classroom" toolIcon={<MonitorPlay size={32} color="#059669" />}
              caption="" maxWidth="85%" />
          </motion.div>

          {/* Side info */}
          <div className="col-span-4 flex flex-col gap-3">
            <motion.div variants={slideChild} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#05966915" }}>
                <Wand2 size={18} color="#059669" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 16 }}>Type → Animate</div>
                <div style={{ fontSize: 14, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>Teacher types a concept; Newton renders a moving visual using class PDF + notes as the source of truth.</div>
              </div>
            </motion.div>
            <motion.div variants={slideChild} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#6366F115" }}>
                <FileText size={18} color="#6366F1" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 16 }}>Grounded in your syllabus</div>
                <div style={{ fontSize: 14, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>Animations pulled from the exact pages being taught — no off-syllabus content.</div>
              </div>
            </motion.div>
            <motion.div variants={slideChild} className="rounded-xl p-4 flex gap-3"
              style={{ background: "rgba(255,255,255,0.85)", border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
              <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: "#F59E0B15" }}>
                <MonitorPlay size={18} color="#D97706" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 16 }}>Mirrors to every student device</div>
                <div style={{ fontSize: 14, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>The animation also plays on student phones/tablets so back-benchers see clearly.</div>
              </div>
            </motion.div>
            <motion.div variants={slideChild} className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #059669, #047857)", border: "1px solid #05966966", color: "white" }}>
              <Sparkles size={14} color="white" />
              <span style={{ fontSize: 14, color: "white", fontWeight: 600 }}>Every session auto-captured → fed into class AI tutor</span>
            </motion.div>
          </div>
        </div>

      </div>
    </SlideShell>
  );
}
