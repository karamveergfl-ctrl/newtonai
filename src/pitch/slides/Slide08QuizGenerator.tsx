import { Zap } from "lucide-react";
import { ToolSlideLayout } from "./ToolSlideLayout";
import { VIDEO_PATHS } from "../constants/videoPaths";

export default function Slide08QuizGenerator() {
  return (
    <ToolSlideLayout
      category="ASSESSMENT"
      categoryColor="#EF4444"
      toolName="AI Quiz Generator — From Any Content, In 10 Seconds"
      problem="Creating quality quiz questions takes a teacher 30–60 minutes per assessment. Questions from external sources don't match what was actually taught in class. Frequent formative assessment — proven to double learning outcomes — is practically impossible at the pace most teachers work."
      solution="Newton generates 5 to 20 curriculum-aligned quiz questions from any PDF, any slide, any topic — in under 10 seconds. The teacher reviews, edits if needed, and launches to all student devices with one click. Live results appear as a bar chart."
      highlights={[
        "MCQ, True/False, Fill in the Blank — all types generated",
        "Students answer on their devices; teacher sees live response bars",
        "Every wrong answer identified by topic and saved to student's weak-point tracker",
      ]}
      icon={<Zap size={48} color="white" strokeWidth={2.5} />}
      iconGradient="linear-gradient(135deg, #EF4444, #F59E0B)"
      videoKey="QUIZ_GENERATOR"
      videoSrc={VIDEO_PATHS.QUIZ_GENERATOR}
      videoCaption="See a teacher select 3 paragraphs from a Physics PDF, generate a 5-question MCQ quiz in 8 seconds, launch it to 28 students, and watch the live response chart build in real time."
    />
  );
}