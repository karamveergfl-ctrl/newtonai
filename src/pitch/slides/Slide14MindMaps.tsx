import { Network } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide14MindMaps() {
  return (
    <ToolSlideLayout
      category="VISUAL LEARNING"
      categoryColor="#10B981"
      toolName="AI Mind Maps — See How Every Concept Connects"
      problem="Students memorise facts in isolation without understanding how concepts relate to each other. A student may know what 'mitosis' is and what 'chromosomes' are — but cannot connect them on exam day without seeing the relationship. Textbooks show linear information, not visual connections."
      solution="Newton automatically generates a visual mind map from any content — a chapter, a set of notes, a topic name. The mind map shows every concept and how it branches and connects. Students can explore it interactively, add their own branches, and export it for revision."
      highlights={[
        "Auto-generated from any PDF, notes, or typed topic in under 8 seconds",
        "Fully interactive — drag nodes, add branches, change colors",
        "Export as PNG for printing or adding to personal notes",
      ]}
      icon={<Network size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #10B981, #047857)"
      videoSrc={VIDEO_PATHS.MIND_MAPS}
      videoCaption="Watch Newton generate a complete Biology mind map for 'The Human Circulatory System' from a chapter PDF in 7 seconds — with all sub-concepts branching interactively, ready to explore."
    />
  );
}