import { Layers } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide10Flashcards() {
  return (
    <ToolSlideLayout
      category="REVISION TOOLS"
      categoryColor="#6366F1"
      toolName="AI Flashcards — Revision That Actually Works"
      problem="Students know they should revise regularly, but making flashcards by hand from a 200-page textbook takes hours — time they don't have. Most revision is passive re-reading, which research shows is one of the least effective study strategies."
      solution="Newton generates 10–20 ready-to-study flashcards from any uploaded document, class notes, or topic in seconds. Students study using spaced repetition — Newton tracks which cards they know and which to show again, maximising retention with minimum time."
      highlights={[
        "Generated from any PDF, class notes, or topic — in under 5 seconds",
        "Spaced repetition: cards you know disappear, cards you struggle with repeat",
        "3D flip animation — front: question, back: answer with source citation",
      ]}
      icon={<Layers size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #6366F1, #4338CA)"
      videoKey="FLASHCARDS"
      videoSrc={VIDEO_PATHS.FLASHCARDS}
      videoCaption="See Newton generate 15 flashcards from a Trigonometry chapter PDF, then watch a student flip through them with the spaced repetition system — hard cards come back sooner, easy cards fade out."
    />
  );
}