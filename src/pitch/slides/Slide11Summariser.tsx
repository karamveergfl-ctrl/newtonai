import { FileText } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide11Summariser() {
  return (
    <ToolSlideLayout
      category="COMPREHENSION"
      categoryColor="#14B8A6"
      toolName="AI Summariser — Any Chapter, Any Length, In Seconds"
      problem="A student has a 60-page chapter to cover before tomorrow's exam. Re-reading everything is impossible. Chapter summaries in textbooks are too brief and not adapted to what was actually emphasised in class. Students don't know what to focus on."
      solution="Newton summarises any document — PDF chapters, lecture notes, YouTube video transcripts — at the student's chosen length: a 3-sentence brief, a standard paragraph, a structured study guide with headings and key terms. Always aligned to what was taught in class."
      highlights={[
        "Summarise PDFs, class notes, or any YouTube video URL",
        "Choose length: Brief (3 sentences) → Detailed (structured with headings)",
        "Key terms automatically highlighted in the summary",
      ]}
      icon={<FileText size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #14B8A6, #0F766E)"
      videoKey="SUMMARISER"
      videoSrc={VIDEO_PATHS.SUMMARISER}
      videoCaption="Watch Newton summarise a 45-page Chemistry chapter into a 5-section structured study guide in 12 seconds — complete with highlighted key terms, a formula section, and 3 practice questions."
    />
  );
}