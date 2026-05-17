import { Wand2 } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide09AutoNotes() {
  return (
    <ToolSlideLayout
      category="AUTO CAPTURE"
      categoryColor="#10B981"
      toolName="Auto Notes — Every Word Written and Spoken, Captured"
      problem="Students scramble to copy notes from the board while simultaneously trying to understand the explanation. They miss half of what the teacher says. Teachers spend hours writing notes to share after class. Students with absences never catch up."
      solution="Newton automatically converts the teacher's handwriting on the board into digital text using OCR, and transcribes the teacher's voice in real time. After every session, an AI-written complete study guide is generated and shared with every student automatically — before they leave school."
      highlights={[
        "Live handwriting OCR — board strokes become searchable text in real time",
        "Teacher's complete lecture transcribed word-for-word with timestamps",
        "AI-compiled study guide ready within 5 minutes of session end",
      ]}
      icon={<Wand2 size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #10B981, #047857)"
      videoSrc={VIDEO_PATHS.AUTO_NOTES}
      videoCaption="Watch a teacher write a Chemistry equation on the board — Newton's OCR extracts it as text in 3 seconds. Then see the auto-generated post-session study guide that students receive, including all equations, key concepts, and a practice section."
    />
  );
}