import Slide01Hero from "./Slide01Hero";
import Slide02Problem from "./Slide02Problem";
import Slide03Solution from "./Slide03Solution";
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
// Dashboards / close
import SlideStudentDashboard from "./SlideStudentDashboard";
import Slide18CTA from "./Slide18CTA";

export const SLIDES: { title: string; Component: React.ComponentType }[] = [
  { title: "The AI-Powered Classroom", Component: Slide01Hero },
  { title: "The Challenge", Component: Slide02Problem },
  { title: "The Solution", Component: Slide03Solution },
  // --- Student tools ---
  { title: "Ad-Free Educational Videos", Component: SlideAdFreeVideos },
  { title: "AI Flashcards", Component: Slide10Flashcards },
  { title: "AI Podcast — Two AI Friends", Component: Slide15Podcast },
  { title: "Newton Chat — AI Tutor", Component: Slide04NewtonChat },
  { title: "AI Quiz Generator", Component: Slide08QuizGenerator },
  { title: "AI Summariser", Component: Slide11Summariser },
  { title: "Homework Help — School to Engineering", Component: Slide12HomeworkHelp },
  { title: "PDF Chat", Component: Slide13PDFChat },
  { title: "AI Mind Maps", Component: Slide14MindMaps },
  // --- Teacher tools ---
  { title: "Smart Classroom — Instant Animations", Component: SlideSmartClassroom },
  { title: "In-Class Quiz + Auto-Attendance", Component: SlideInClassQuiz },
  { title: "Teacher Dashboard", Component: SlideTeacherDashboard },
  // --- Dashboards / close ---
  { title: "Student Dashboard", Component: SlideStudentDashboard },
  { title: "Get Started", Component: Slide18CTA },
];
