import Slide01Hero from "./Slide01Hero";
import Slide02Problem from "./Slide02Problem";
import Slide03Solution from "./Slide03Solution";
import Slide04NewtonChat from "./Slide04NewtonChat";
import Slide05SmartClassroom from "./Slide05SmartClassroom";
import Slide06PulseMeter from "./Slide06PulseMeter";
import Slide07VideoSearch from "./Slide07VideoSearch";
import Slide08QuizGenerator from "./Slide08QuizGenerator";
import Slide09AutoNotes from "./Slide09AutoNotes";
import Slide10Flashcards from "./Slide10Flashcards";
import Slide11Summariser from "./Slide11Summariser";
import Slide12HomeworkHelp from "./Slide12HomeworkHelp";
import Slide13PDFChat from "./Slide13PDFChat";
import Slide14MindMaps from "./Slide14MindMaps";
import Slide15Podcast from "./Slide15Podcast";
import Slide16Analytics from "./Slide16Analytics";
import Slide17Pricing from "./Slide17Pricing";
import Slide18CTA from "./Slide18CTA";

export const SLIDES: { title: string; Component: React.ComponentType }[] = [
  { title: "The AI-Powered Classroom", Component: Slide01Hero },
  { title: "The Challenge", Component: Slide02Problem },
  { title: "The Solution", Component: Slide03Solution },
  { title: "Newton Chat — AI Tutor", Component: Slide04NewtonChat },
  { title: "Smart Board Classroom", Component: Slide05SmartClassroom },
  { title: "Live Pulse Meter", Component: Slide06PulseMeter },
  { title: "Instant Video Search", Component: Slide07VideoSearch },
  { title: "AI Quiz Generator", Component: Slide08QuizGenerator },
  { title: "Auto Notes", Component: Slide09AutoNotes },
  { title: "AI Flashcards", Component: Slide10Flashcards },
  { title: "AI Summariser", Component: Slide11Summariser },
  { title: "Homework Help", Component: Slide12HomeworkHelp },
  { title: "PDF Chat", Component: Slide13PDFChat },
  { title: "AI Mind Maps", Component: Slide14MindMaps },
  { title: "AI Podcast", Component: Slide15Podcast },
  { title: "Analytics Dashboard", Component: Slide16Analytics },
  { title: "Pricing & Implementation", Component: Slide17Pricing },
  { title: "Get Started", Component: Slide18CTA },
];