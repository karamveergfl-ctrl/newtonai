import { Calculator } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide12HomeworkHelp() {
  return (
    <ToolSlideLayout
      category="HOMEWORK HELP"
      categoryColor="#F59E0B"
      toolName="From Class 6 arithmetic to JEE Advanced and B.Tech finals — Newton solves it."
      problem={[
        "Students get stuck on tough problems at midnight with no tutor online.",
        "Google gives wrong or off-syllabus answers; the gap compounds until next class.",
        "Engineering subjects — circuits, multivariable calculus, thermodynamics — have no easy help online.",
      ]}
      solution={[
        "Snap a photo of any handwritten or printed problem from any subject.",
        "Screenshot-crop questions directly from any open class PDF.",
        "Newton solves step-by-step with the correct formula derivation and concepts cited.",
        "Works from school algebra all the way to final-year engineering.",
      ]}
      icon={<Calculator size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #F59E0B, #B45309)"
      videoKey="HOMEWORK_HELP"
      videoSrc={VIDEO_PATHS.HOMEWORK_HELP}
      videoCaption="Student photographs a JEE-level rotational mechanics problem. Newton derives the moment-of-inertia step-by-step, citing every formula used."
    />
  );
}
