import { PlayCircle } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function SlideAdFreeVideos() {
  return (
    <ToolSlideLayout
      category="STUDENT LEARNING"
      categoryColor="#A855F7"
      toolName="Ad-Free Educational Videos — Any Topic, Zero Distractions"
      problem="A student opens YouTube to learn 'Photosynthesis' and loses 4–5 minutes per video to ads, pre-rolls, clickbait thumbnails, and unrelated recommendations. Most videos aren't curriculum-aligned, and the algorithm pulls them off-topic within minutes."
      solution="Newton lets the student search any topic and instantly play curriculum-aligned educational videos inside a clean, fullscreen player — no ads, no pre-rolls, no recommendations, no comments. Just the video, ready to learn from."
      highlights={[
        "Zero ads and zero pre-rolls — learning starts in 1 second",
        "Curriculum-tagged results only, sorted by class & subject",
        "Watch history is saved to Newton Chat for follow-up questions",
      ]}
      icon={<PlayCircle size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #A855F7, #6D28D9)"
      videoKey="AD_FREE_VIDEOS"
      videoSrc={VIDEO_PATHS.AD_FREE_VIDEOS}
      videoCaption="Watch a Grade 9 student search 'Newton's Laws', pick a video, and watch it ad-free in a distraction-free player — no YouTube sidebar, no recommendations."
    />
  );
}
