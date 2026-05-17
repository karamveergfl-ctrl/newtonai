import { MessageCircle } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide04NewtonChat() {
  return (
    <ToolSlideLayout
      category="AI TUTORING"
      categoryColor="#6366F1"
      toolName="Newton Chat — Your 24/7 AI Tutor"
      problem="When a student gets stuck at 10pm before an exam, there is no teacher available. Private tutors cost thousands per month. Students either give up or find unreliable answers online."
      solution="Newton Chat is a class-trained AI tutor — available 24 hours a day, 7 days a week — that answers only from what was taught in your specific class, in both English and Hindi, by voice or text."
      highlights={[
        "Trained on your class's own notes, lectures, and materials",
        "Real-time voice conversation — talk like you would to a teacher",
        "Cites which session or slide it's answering from",
      ]}
      icon={<MessageCircle size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #6366F1, #4338CA)"
      videoKey="NEWTON_CHAT"
      videoSrc={VIDEO_PATHS.NEWTON_CHAT}
      videoCaption="Watch a Grade 10 student ask Newton Chat to explain 'Integration by Substitution' using the exact notes from their class — in Hindi, by voice."
    />
  );
}