import { Headphones, Mic, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";
import { VideoPlayer } from "../components/VideoPlayer";
import { VIDEO_PATHS } from "../constants/videoPaths";

function Bars({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="w-0.5 rounded-full"
          style={{
            background: color,
            animation: `pcBar 1.1s ease-in-out ${i * 0.08}s infinite`,
            height: "100%",
          }} />
      ))}
      <style>{`@keyframes pcBar { 0%,100%{transform:scaleY(0.3);} 50%{transform:scaleY(1);} }`}</style>
    </div>
  );
}

function Bubble({ who, color, text, side }: { who: string; color: string; text: string; side: "l" | "r" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${side === "r" ? "flex-row-reverse" : ""}`}>
      <div className="rounded-full flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, background: `${color}26`, color }}>
        <Mic size={14} />
      </div>
      <div className="rounded-2xl px-3 py-1.5" style={{
        background: side === "r" ? color : "white",
        color: side === "r" ? "white" : "#0F172A",
        border: side === "r" ? "none" : "1px solid #E2E8F0",
        maxWidth: 280, fontSize: 11.5, lineHeight: 1.4,
      }}>
        <div style={{ fontWeight: 700, fontSize: 9, opacity: 0.7, letterSpacing: "0.1em", marginBottom: 2 }}>{who}</div>
        {text}
      </div>
    </motion.div>
  );
}

export default function Slide15Podcast() {
  return (
    <SlideShell theme="dark">
      <div className="absolute inset-x-0 top-0 flex" style={{ height: "40%" }}>
        <div className="flex-1 px-14 pt-14 pb-4 flex flex-col justify-center" style={{ maxWidth: "70%" }}>
          <motion.div variants={slideChild} className="inline-flex self-start px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.25em] mb-2"
            style={{ background: "#EC489922", color: "#EC4899", border: "1px solid #EC489955" }}>
            AI PODCAST
          </motion.div>
          <motion.h1 variants={slideHeading} style={{ fontWeight: 800, fontSize: "clamp(22px,2.6vw,36px)", color: "white", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 12 }}>
            Two AI friends explain any topic — casually, like a real podcast.
          </motion.h1>
          <motion.div variants={slideChild} className="grid grid-cols-2 gap-4">
            <div>
              <div style={{ color: "#F87171", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>❌ THE PROBLEM</div>
              <div style={{ color: "#94A3B8", fontSize: 12.5, lineHeight: 1.5 }}>
                Textbooks are dry. Lecture videos are long. Students disengage in minutes. 45–90 minutes of daily commute time is wasted — there's nothing to listen to that actually teaches what their class is covering.
              </div>
            </div>
            <div>
              <div style={{ color: "#34D399", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 4 }}>✅ NEWTON'S SOLUTION</div>
              <div style={{ color: "white", fontSize: 12.5, lineHeight: 1.5 }}>
                Two AI hosts have a friendly back-and-forth conversation about the student's exact topic — explaining, joking, asking each other questions. The student can interrupt with a doubt anytime and the hosts answer instantly.
              </div>
            </div>
          </motion.div>
        </div>
        <div className="px-8 pt-10 pb-4 flex flex-col items-end justify-between" style={{ width: "30%" }}>
          <motion.div variants={slideChild} className="rounded-2xl flex items-center justify-center"
            style={{ width: 80, height: 80, background: "linear-gradient(135deg, #EC4899, #6366F1)", boxShadow: "0 12px 32px rgba(236,72,153,0.3)" }}>
            <Headphones size={42} color="white" strokeWidth={2} />
          </motion.div>
          <motion.div variants={slideChild} className="w-full space-y-2">
            {[
              "Two distinct voices, natural friendly tone",
              "Generated in 30 seconds from any topic / PDF",
              "Students interrupt with doubts — hosts answer live",
            ].map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ width: 16, height: 16, background: "#EC489926" }}>
                  <Sparkles size={10} color="#EC4899" strokeWidth={2.5} />
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8", lineHeight: 1.4 }}>{h}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="absolute inset-x-0 flex flex-col items-center px-8 pt-3"
        style={{ top: "40%", bottom: 52, background: "#F8FAFC" }}>
        <div className="w-full max-w-5xl mb-1.5">
          <div style={{ color: "#EC4899", fontSize: 10, fontWeight: 700, letterSpacing: "0.25em" }}>WATCH HOW IT WORKS</div>
        </div>
        <div className="flex-1 w-full flex items-center justify-center min-h-0 pb-3 gap-6">
          {/* Conversation mock */}
          <div className="flex-shrink-0 rounded-2xl p-4 flex flex-col gap-2" style={{ width: 320, background: "white", border: "1px solid #E2E8F0", boxShadow: "0 6px 18px rgba(15,23,42,0.05)" }}>
            <div className="flex items-center justify-between mb-1">
              <div style={{ fontSize: 11, fontWeight: 700, color: "#0F172A" }}>🎙 Photosynthesis — 4 min</div>
              <Bars color="#EC4899" />
            </div>
            <Bubble who="HOST · ARYA" color="#EC4899" side="l" text="Okay so plants basically eat sunlight — wild right?" />
            <Bubble who="CO-HOST · KAI" color="#6366F1" side="l" text="Haha yeah, and they breathe out the oxygen we need. Win-win." />
            <Bubble who="STUDENT" color="#10B981" side="r" text="Wait, what does chlorophyll actually do?" />
            <Bubble who="HOST · ARYA" color="#EC4899" side="l" text="Great Q! Think of it as a tiny solar panel inside each leaf…" />
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0 h-full">
            <VideoPlayer
              videoKey="PODCAST"
              src={VIDEO_PATHS.PODCAST}
              toolName="AI Podcast"
              toolIcon={<Headphones size={48} color="#EC4899" />}
              caption="Two AI hosts discuss 'Demand & Supply' for a Grade 12 student. She asks a doubt mid-podcast — the hosts pause and answer it in their own voice."
            />
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
