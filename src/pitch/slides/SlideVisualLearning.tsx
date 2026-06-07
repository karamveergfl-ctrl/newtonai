import { Video } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import animationVideo from "@/assets/animation_video.mp4.asset.json";

export default function SlideVisualLearning() {
  return (
    <ToolSlideLayout
      category="TEACHER · SMARTBOARD"
      categoryColor="#059669"
      toolName="Animation Videos on Smart Board in Seconds"
      problem={[
        "Teachers waste minutes searching YouTube for a clip mid-class.",
        "Ads, pop-ups and recommended videos break student focus.",
        "Hard to find a clean, on-topic explainer for every concept on the fly.",
      ]}
      solution={[
        "Search any topic and play the top educational video on the smartboard in seconds.",
        "Plays 100% ad-free, no pop-ups, no end-screen distractions.",
        "Curated from the best educational channels on YouTube.",
        "One click to cast, pause, or switch — stays inside the Newton classroom flow.",
      ]}
      icon={<Video size={44} color="#ffffff" />}
      iconGradient="linear-gradient(135deg, #059669, #047857)"
      videoSrc={animationVideo.url}
      videoKey="VISUAL_LEARNING"
      videoCaption="Search a topic → top educational video plays ad-free on the smartboard"
    />
  );
}