import { MonitorPlay } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide05SmartClassroom() {
  return (
    <ToolSlideLayout
      category="LIVE CLASSROOM"
      categoryColor="#14B8A6"
      toolName="Smart Board Classroom — Teach Live, Teach Smart"
      problem="Traditional teaching on a physical whiteboard cannot be recorded, searched, or shared. Students miss critical notes when they blink. There is no way to know in real time whether 38 students are actually understanding."
      solution="Newton's Smart Classroom turns any screen into an intelligent teaching board — with live student connectivity, real-time understanding tracking, AI-powered tools, and everything captured automatically."
      highlights={[
        "Teacher's writing and speech auto-captured as digital notes",
        "Students follow along on their own devices in real time",
        "Every session's content feeds into the class AI tutor instantly",
      ]}
      icon={<MonitorPlay size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #14B8A6, #0F766E)"
      videoSrc={VIDEO_PATHS.SMART_CLASSROOM}
      videoCaption="See a teacher open a live session, teach from a PDF on the smart board, annotate slides, and watch student understanding update live on screen."
    />
  );
}