import { Headphones } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide15Podcast() {
  return (
    <ToolSlideLayout
      category="AUDIO LEARNING"
      categoryColor="#EC4899"
      toolName="AI Podcast — Learn While Commuting"
      problem="Students spend 30–90 minutes commuting every day — time completely wasted for learning. Reading during travel is impractical for many. Audio content that matches exactly what was taught in their specific class simply doesn't exist."
      solution="Newton converts any class notes, chapter, or topic into a conversational two-voice podcast — a host and a guest discussing the topic as if on a podcast show. Students put on earphones during their commute and their daily travel becomes study time."
      highlights={[
        "Two distinct AI voices make it sound like a real educational podcast",
        "Scrolling transcript below highlights the sentence currently being spoken",
        "Generate from class notes, PDFs, or typed topic — ready in 30 seconds",
      ]}
      icon={<Headphones size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #EC4899, #6366F1)"
      videoSrc={VIDEO_PATHS.PODCAST}
      videoCaption="See a Grade 12 student upload her Economics class notes. Newton generates a 6-minute podcast episode with two voices discussing 'Demand and Supply' conversationally — complete with examples and a summary. She listens on her school bus."
    />
  );
}