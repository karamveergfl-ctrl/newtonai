import { Headphones } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide15Podcast() {
  return (
    <ToolSlideLayout
      category="AI PODCAST"
      categoryColor="#EC4899"
      toolName="Two AI friends explain any topic — casually, like a real podcast."
      problem={[
        "Textbooks are dry; lecture videos are long. Students disengage in minutes.",
        "45–90 minutes of daily commute time is wasted with nothing class-relevant to listen to.",
        "Generic audiobooks don't match what their class is actually covering.",
      ]}
      solution={[
        "Two AI hosts have a friendly back-and-forth on the student's exact topic.",
        "Students can interrupt with a doubt mid-podcast — hosts pause and answer live.",
        "Generated in 30 seconds from any topic or PDF, with two distinct natural voices.",
      ]}
      icon={<Headphones size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #EC4899, #6366F1)"
      videoKey="PODCAST"
      videoSrc={VIDEO_PATHS.PODCAST}
      videoCaption="Two AI hosts discuss 'Demand & Supply' for a Grade 12 student. She asks a doubt mid-podcast — the hosts pause and answer it in their own voice."
    />
  );
}
