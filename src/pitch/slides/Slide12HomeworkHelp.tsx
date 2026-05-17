import { Calculator } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide12HomeworkHelp() {
  return (
    <ToolSlideLayout
      category="HOMEWORK"
      categoryColor="#F59E0B"
      toolName="Homework Help — Step-by-Step, Not Just Answers"
      problem="When a student gets stuck on a problem at home, they search for the answer online — they copy it without understanding, or they find an explanation so advanced it confuses them more. Parents can't always help. The learning opportunity is lost."
      solution="Newton doesn't just give answers — it teaches. It walks the student through every step of a problem using Socratic questioning, building understanding rather than dependence. Students can also take a photo of any handwritten problem and Newton reads it."
      highlights={[
        "Photo of any handwritten question → Newton reads it using OCR and solves it",
        "Socratic mode: Newton asks guiding questions before revealing each step",
        "All mathematical steps beautifully formatted with proper equations",
      ]}
      icon={<Calculator size={48} color="white" strokeWidth={2} />}
      iconGradient="linear-gradient(135deg, #F59E0B, #B45309)"
      videoSrc={VIDEO_PATHS.HOMEWORK_HELP}
      videoCaption="A student photographs a handwritten Physics problem. Newton reads it, confirms the concept, then walks through the solution step-by-step — asking the student to attempt each step before revealing it."
    />
  );
}