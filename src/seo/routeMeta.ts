/**
 * Per-route search metadata baked into the static HTML at build time
 * (see seo-prerender.ts). Keep titles under ~60 chars, descriptions under ~160.
 * Pure data: imported by both the Vite config (Node) and the app.
 */
export interface RouteMeta {
  path: string;
  title: string;
  description: string;
  h1: string;
  /** If set, this path is a duplicate and should point crawlers to `redirectTo`. */
  redirectTo?: string;
}

export const ROUTE_META: RouteMeta[] = [
  { path: "/pricing", title: "Pricing – Free & Premium Plans | NewtonAI", description: "Compare NewtonAI plans. Start free with AI notes, quizzes, flashcards and mind maps, then upgrade for higher limits and podcasts.", h1: "NewtonAI Pricing" },
  { path: "/about", title: "About NewtonAI – AI Study Platform from AMU", description: "NewtonAI is an AI study platform for students and schools, incubated at the AMU Innovation Foundation, Aligarh.", h1: "About NewtonAI" },
  { path: "/contact", title: "Contact NewtonAI – Support & School Enquiries", description: "Get in touch with the NewtonAI team for student support, school plans and partnership enquiries.", h1: "Contact NewtonAI" },
  { path: "/faq", title: "NewtonAI FAQ – Plans, Tools & Privacy", description: "Answers to common questions about NewtonAI's study tools, supported files, plans, payments and data privacy.", h1: "Frequently Asked Questions" },
  { path: "/enterprise", title: "NewtonAI for Schools & Institutions", description: "AI study tools, SmartBoard classrooms and teacher analytics for schools, colleges and coaching institutes.", h1: "NewtonAI for Schools" },
  { path: "/how-it-works", title: "How NewtonAI Works – Upload, Learn, Revise", description: "Upload a PDF, notes or YouTube link and NewtonAI turns it into summaries, quizzes, flashcards and mind maps in seconds.", h1: "How NewtonAI Works" },
  { path: "/features", title: "NewtonAI Features – Every AI Study Tool", description: "Explore NewtonAI's AI summarizer, quiz maker, flashcards, mind maps, homework help, PDF chat and AI podcasts.", h1: "NewtonAI Features" },
  { path: "/ai-for-students", title: "AI for Students – Study Tools That Help | NewtonAI", description: "How students use AI to understand faster, practise smarter and revise before exams with NewtonAI.", h1: "AI for Students" },
  { path: "/guides", title: "Study Guides – Learn Smarter with AI | NewtonAI", description: "Free guides on AI learning, spaced repetition and using AI responsibly for study.", h1: "Study Guides" },
  { path: "/guides/how-ai-learning-works", title: "How AI Learning Works – A Student Guide | NewtonAI", description: "A plain-language guide to how AI study tools read your material and turn it into notes, quizzes and flashcards.", h1: "How AI Learning Works" },
  { path: "/guides/spaced-repetition-guide", title: "Spaced Repetition Guide for Students | NewtonAI", description: "Learn how spaced repetition works and how to schedule flashcard reviews to remember more for exams.", h1: "Spaced Repetition Guide" },
  { path: "/guides/responsible-ai-use", title: "Using AI Responsibly for Study | NewtonAI", description: "How to use AI study tools honestly and effectively, without shortcuts that hurt your learning.", h1: "Responsible AI Use" },
  { path: "/ai-study-assistant", title: "AI Study Assistant for Students | NewtonAI", description: "Convert notes, PDFs and lectures into flashcards, quizzes, summaries and mind maps for faster exam preparation.", h1: "The AI Study Assistant Built for Students" },
  { path: "/ai-notes-generator", title: "AI Notes Generator – Notes from PDFs & Videos | NewtonAI", description: "Generate clear, structured study notes from PDFs, lectures and YouTube videos with NewtonAI's AI notes generator.", h1: "AI Notes Generator" },
  { path: "/pdf-study-tool", title: "PDF Study Tool – Summarize & Quiz Any PDF | NewtonAI", description: "Upload any PDF to get summaries, quizzes, flashcards and answers to your questions with NewtonAI.", h1: "AI PDF Study Tool" },
  { path: "/ai-quiz-generator", title: "AI Quiz Generator – Quizzes from Your Notes | NewtonAI", description: "Create practice quizzes from your notes, PDFs or videos with instant feedback and explanations.", h1: "AI Quiz Generator" },
  { path: "/ai-flashcard-generator", title: "AI Flashcard Generator – Free from PDFs | NewtonAI", description: "Turn PDFs, notes and lectures into flashcards automatically and revise with spaced repetition.", h1: "AI Flashcard Generator" },
  { path: "/exam-preparation-ai", title: "AI Exam Preparation – Practise & Revise | NewtonAI", description: "Prepare for exams with AI-made quizzes, flashcards, summaries and step-by-step solutions.", h1: "AI Exam Preparation" },
  { path: "/about-newtonai-for-ai", title: "About NewtonAI – Facts for AI Assistants", description: "Factual overview of NewtonAI: what it does, who it serves, its tools and plans.", h1: "About NewtonAI" },
  { path: "/tools", title: "Free AI Study Tools for Students | NewtonAI", description: "All NewtonAI study tools in one place: summarizer, quiz, flashcards, mind map, lecture notes, podcast and homework help.", h1: "AI Study Tools" },
  { path: "/pdf-chat", title: "Chat with PDF – Ask Questions to Any PDF | NewtonAI", description: "Upload a PDF and ask questions in plain language. Get answers grounded in your document.", h1: "Chat with Your PDF" },
  { path: "/tools/homework-help", title: "AI Homework Help – Step-by-Step Solutions | NewtonAI", description: "Snap or type a question and get step-by-step solutions for maths, physics, chemistry and more.", h1: "AI Homework Help" },
  { path: "/tools/flashcards", title: "AI Flashcards Maker – Make Cards in Seconds | NewtonAI", description: "Make flashcards from any topic, PDF or notes in seconds and practise with active recall.", h1: "AI Flashcards" },
  { path: "/tools/quiz", title: "AI Quiz Maker – Practice Questions Instantly | NewtonAI", description: "Generate multiple-choice and short-answer quizzes from your study material instantly.", h1: "AI Quiz Maker" },
  { path: "/tools/summarizer", title: "AI Summarizer – Summarize PDFs & Notes | NewtonAI", description: "Summarize long PDFs, notes and articles into clear key points with NewtonAI's AI summarizer.", h1: "AI Summarizer" },
  { path: "/tools/lecture-notes", title: "AI Lecture Notes – YouTube & Audio to Notes | NewtonAI", description: "Turn YouTube lectures and recordings into structured study notes automatically.", h1: "AI Lecture Notes" },
  { path: "/tools/ai-podcast", title: "AI Podcast – Turn Notes into Audio Lessons | NewtonAI", description: "Convert your notes or PDFs into a two-voice study podcast you can listen to anywhere.", h1: "AI Study Podcast" },
  { path: "/tools/mind-map", title: "AI Mind Map Generator – From Any Topic | NewtonAI", description: "Create visual mind maps from a topic, PDF or notes to see how ideas connect.", h1: "AI Mind Map Generator" },
  { path: "/tools/latex-editor", title: "Online LaTeX Editor with Live Preview | NewtonAI", description: "Write and preview LaTeX maths equations in your browser with NewtonAI's free editor.", h1: "LaTeX Editor" },
  { path: "/compare", title: "NewtonAI vs Other Study Tools – Comparisons", description: "See how NewtonAI compares with Quizlet, Chegg, Studocu, Course Hero, ChatGPT, StudyX and StudyFetch.", h1: "Compare NewtonAI" },
  { path: "/compare/chegg", title: "NewtonAI vs Chegg – Cheaper AI Homework Help", description: "Compare NewtonAI and Chegg on homework help, study tools, pricing and features.", h1: "NewtonAI vs Chegg" },
  { path: "/compare/quizlet", title: "NewtonAI vs Quizlet – AI Flashcards Compared", description: "Compare NewtonAI and Quizlet: AI flashcards from PDFs, quizzes, mind maps and pricing.", h1: "NewtonAI vs Quizlet" },
  { path: "/compare/studocu", title: "NewtonAI vs Studocu – AI Notes vs Shared Notes", description: "Compare NewtonAI's AI-generated notes and quizzes with Studocu's shared documents.", h1: "NewtonAI vs Studocu" },
  { path: "/compare/course-hero", title: "NewtonAI vs Course Hero – Study Tools Compared", description: "Compare NewtonAI and Course Hero on AI study tools, homework help and price.", h1: "NewtonAI vs Course Hero" },
  { path: "/compare/chatgpt", title: "NewtonAI vs ChatGPT for Studying", description: "Why a purpose-built study app beats a general chatbot for flashcards, quizzes and exam prep.", h1: "NewtonAI vs ChatGPT" },
  { path: "/compare/studyx", title: "NewtonAI vs StudyX – AI Study Apps Compared", description: "Compare NewtonAI and StudyX on homework help, study tools and pricing.", h1: "NewtonAI vs StudyX" },
  { path: "/compare/studyfetch-vs-newtonai", title: "StudyFetch Alternative – NewtonAI vs StudyFetch", description: "Looking for a StudyFetch alternative? Compare NewtonAI and StudyFetch on features, free plan and price.", h1: "NewtonAI vs StudyFetch" },
  { path: "/compare/studyfetch", title: "StudyFetch Alternative – NewtonAI vs StudyFetch", description: "Looking for a StudyFetch alternative? Compare NewtonAI and StudyFetch on features, free plan and price.", h1: "NewtonAI vs StudyFetch", redirectTo: "/compare/studyfetch-vs-newtonai" },
  { path: "/blog", title: "NewtonAI Blog – Study Tips & AI Learning", description: "Study techniques, exam tips and guides to learning faster with AI tools.", h1: "NewtonAI Blog" },
  { path: "/privacy", title: "Privacy Policy | NewtonAI", description: "How NewtonAI collects, uses and protects your data.", h1: "Privacy Policy" },
  { path: "/terms", title: "Terms of Service | NewtonAI", description: "The terms that apply when you use NewtonAI.", h1: "Terms of Service" },
  { path: "/refund", title: "Refund Policy | NewtonAI", description: "NewtonAI's refund and cancellation policy for paid plans.", h1: "Refund Policy" },
  // India exam landing pages
  { path: "/neet-flashcards-ai", title: "NEET Flashcards from NCERT PDFs with AI | NewtonAI", description: "Upload your NCERT Biology, Chemistry or Physics PDF and get NEET flashcards and quizzes in seconds. Free to start.", h1: "NEET Flashcards from Your NCERT PDFs" },
  { path: "/jee-quiz-generator-ai", title: "JEE Quiz Generator AI – Practice from Your Notes | NewtonAI", description: "Turn your JEE notes, coaching PDFs or lectures into practice quizzes with step-by-step solutions. Free to start.", h1: "JEE Quiz Generator from Your Own Notes" },
  { path: "/cbse-notes-ai", title: "CBSE Notes, Summaries & Flashcards with AI | NewtonAI", description: "Make CBSE Class 9–12 chapter summaries, flashcards and quizzes from your textbook PDF with AI.", h1: "CBSE Chapter Notes and Flashcards with AI" },
  { path: "/youtube-lecture-to-notes", title: "YouTube Lecture to Notes – One-Shot Videos | NewtonAI", description: "Paste a YouTube lecture or one-shot video link and get notes, flashcards and a quiz in minutes.", h1: "Turn YouTube Lectures into Notes" },
];
