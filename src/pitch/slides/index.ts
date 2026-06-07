import Slide01Hero from "./Slide01Hero";
import Slide02Problem from "./Slide02Problem";
import Slide03Solution from "./Slide03Solution";
// Section dividers
import SlideStudentToolsIntro from "./SlideStudentToolsIntro";
import SlideTeacherToolsIntro from "./SlideTeacherToolsIntro";
// Student tools
import SlideAdFreeVideos from "./SlideAdFreeVideos";
import Slide10Flashcards from "./Slide10Flashcards";
import Slide15Podcast from "./Slide15Podcast";
import Slide04NewtonChat from "./Slide04NewtonChat";
import Slide08QuizGenerator from "./Slide08QuizGenerator";
import Slide11Summariser from "./Slide11Summariser";
import Slide12HomeworkHelp from "./Slide12HomeworkHelp";
import Slide13PDFChat from "./Slide13PDFChat";
import Slide14MindMaps from "./Slide14MindMaps";
// Teacher tools
import SlideSmartClassroom from "./SlideSmartClassroom";
import SlideInClassQuiz from "./SlideInClassQuiz";
import SlideTeacherDashboard from "./SlideTeacherDashboard";
import SlideVisualLearning from "./SlideVisualLearning";
// Dashboards / close
import SlideStudentDashboard from "./SlideStudentDashboard";
import Slide18CTA from "./Slide18CTA";

export const SLIDES: { title: string; Component: React.ComponentType }[] = [
  { title: "The AI-Powered Classroom", Component: Slide01Hero },
  { title: "The Challenge", Component: Slide02Problem },
  { title: "The Solution", Component: Slide03Solution },
  // --- Student section ---
  { title: "Student Tools", Component: SlideStudentToolsIntro },
  { title: "AI Quiz Generator", Component: Slide08QuizGenerator },
  { title: "AI Flashcards", Component: Slide10Flashcards },
  { title: "AI Podcast — Two AI Friends", Component: Slide15Podcast },
  { title: "Newton Chat — AI Tutor", Component: Slide04NewtonChat },
  { title: "Ad-Free Educational Videos", Component: SlideAdFreeVideos },
  { title: "AI Summariser", Component: Slide11Summariser },
  { title: "Homework Help — School to Engineering", Component: Slide12HomeworkHelp },
  { title: "PDF Chat", Component: Slide13PDFChat },
  { title: "AI Mind Maps", Component: Slide14MindMaps },
  { title: "Student Dashboard", Component: SlideStudentDashboard },
  // --- Teacher section ---
  { title: "Teacher & Classroom Tools", Component: SlideTeacherToolsIntro },
  { title: "Smart Classroom — Instant Animations", Component: SlideSmartClassroom },
  { title: "Visual Learning — Ad-Free Educational Videos", Component: SlideVisualLearning },
  { title: "In-Class Quiz + Auto-Attendance", Component: SlideInClassQuiz },
  { title: "Teacher Dashboard", Component: SlideTeacherDashboard },
  // --- Close ---
  { title: "Get Started", Component: Slide18CTA },
];
