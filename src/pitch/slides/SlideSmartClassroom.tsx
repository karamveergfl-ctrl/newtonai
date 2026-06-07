import { motion } from "framer-motion";
import { Upload, FolderTree, ListChecks, PlayCircle, FileText, CheckCircle2, Clock } from "lucide-react";
import { SlideShell, slideChild, slideHeading } from "../components/SlideShell";

export default function SlideSmartClassroom() {
  return (
    <SlideShell theme="light">
      <div className="h-full flex flex-col px-14 pt-28 pb-24">
        <motion.div variants={slideChild} style={{ color: "#059669", fontSize: 11, fontWeight: 800, letterSpacing: "0.3em" }}>
          TEACHER TOOL · CLASS MATERIALS
        </motion.div>
        <motion.h1 variants={slideHeading} className="mt-1 text-left"
          style={{ fontWeight: 900, fontSize: 44, color: "#0F172A", lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: 1200 }}>
          Teacher uploads once → every student's dashboard organises itself.
        </motion.h1>
        <motion.p variants={slideChild} className="mt-2"
          style={{ fontSize: 14, color: "#475569", maxWidth: 980, lineHeight: 1.55 }}>
          Teachers drop PDFs, slides, notes or worksheets straight into the class. Newton auto-sorts them by chapter on every student's dashboard — alongside the in-class quizzes they took and the animation videos played during the lecture.
        </motion.p>

        <div className="flex-1 grid grid-cols-12 gap-5 mt-6 min-h-0">
          {/* LEFT: Teacher upload flow */}
          <div className="col-span-5 flex flex-col gap-3">
            <FeatureRow icon={<Upload size={18} color="#059669" />} bg="#05966915"
              title="One-tap upload"
              body="Drop PDFs, slides, worksheets or handwritten notes — instantly pushed to the whole class." />
            <FeatureRow icon={<FolderTree size={18} color="#6366F1" />} bg="#6366F115"
              title="Auto-structured by chapter"
              body="Newton tags each file to the right chapter & date — no folders to manage." />
            <FeatureRow icon={<Clock size={18} color="#D97706" />} bg="#F59E0B15"
              title="Today's class, always on top"
              body="Students open the app after school and see exactly what was taught today." />
            <FeatureRow icon={<ListChecks size={18} color="#EC4899" />} bg="#EC489915"
              title="Quizzes + videos auto-attached"
              body="Every in-class quiz score and animation played in class lands on the same dashboard." />
          </div>

          {/* RIGHT: Student dashboard mock */}
          <motion.div variants={slideChild} className="col-span-7 rounded-2xl p-5 flex flex-col min-h-0"
            style={{ background: "rgba(255,255,255,0.95)", border: "1px solid #E2E8F0", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6366F1", letterSpacing: "0.2em" }}>STUDENT DASHBOARD</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>Class 10-A · Physics · Today</div>
              </div>
              <div className="rounded-full px-2.5 py-1" style={{ background: "#10B98115", fontSize: 10, fontWeight: 700, color: "#059669" }}>● LIVE SYNC</div>
            </div>

            <DashSection label="CHAPTER 8 · LIGHT — REFLECTION">
              <Row icon={<FileText size={13} color="#6366F1" />} label="Chapter 8 — Notes.pdf" meta="Uploaded by Ms. Sharma · 10:42 AM" />
              <Row icon={<FileText size={13} color="#6366F1" />} label="Ray diagrams worksheet.pdf" meta="Uploaded · 10:44 AM" />
            </DashSection>

            <DashSection label="PLAYED IN CLASS TODAY">
              <Row icon={<PlayCircle size={13} color="#DC2626" />} label="How a concave mirror forms images" meta="Animation · 2:14 · rewatch" />
              <Row icon={<PlayCircle size={13} color="#DC2626" />} label="Real vs virtual images" meta="YouTube · ad-free · 3:08" />
            </DashSection>

            <DashSection label="PREVIOUS QUIZZES">
              <Row icon={<CheckCircle2 size={13} color="#10B981" />} label="In-class quiz · Reflection" meta="Score 8/10 · review answers" />
              <Row icon={<ListChecks size={13} color="#F59E0B" />} label="Practice quiz · Mirrors" meta="Auto-generated · 12 Qs" />
            </DashSection>
          </motion.div>
        </div>
      </div>
    </SlideShell>
  );
}

function FeatureRow({ icon, bg, title, body }: { icon: React.ReactNode; bg: string; title: string; body: string }) {
  return (
    <motion.div variants={slideChild} className="rounded-xl p-4 flex gap-3"
      style={{ background: "rgba(255,255,255,0.9)", border: "1px solid #E2E8F0", boxShadow: "0 4px 14px rgba(15,23,42,0.04)" }}>
      <div className="rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 36, height: 36, background: bg }}>
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 16 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "#475569", marginTop: 3, lineHeight: 1.5 }}>{body}</div>
      </div>
    </motion.div>
  );
}

function DashSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3 mb-2" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", letterSpacing: "0.12em" }}>{label}</div>
      <div className="grid grid-cols-2 gap-2 mt-2">{children}</div>
    </div>
  );
}

function Row({ icon, label, meta }: { icon: React.ReactNode; label: string; meta: string }) {
  return (
    <div className="rounded-md p-2 flex items-start gap-2" style={{ background: "white", border: "1px solid #E2E8F0" }}>
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
        <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 1 }}>{meta}</div>
      </div>
    </div>
  );
}
