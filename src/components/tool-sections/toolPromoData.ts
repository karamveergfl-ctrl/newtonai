import { 
  CheckCircle, 
  Brain, 
  Clock, 
  Sparkles, 
  Upload, 
  Target, 
  Zap, 
  BookOpen,
  Headphones,
  Globe,
  MessageCircle,
  Mic,
  Network,
  GitBranch,
  FileText,
  Layers,
  List,
  GraduationCap,
  Calculator,
  Image,
  Languages,
  Lightbulb,
  Share2,
  Download,
  Shuffle,
  Volume2,
  Users,
  Award,
  TrendingUp,
  Shield,
  type LucideIcon
} from "lucide-react";

export interface StatItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

export interface SubjectItem {
  name: string;
  icon: string;
  color: string;
}

export interface OtherToolItem {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: LucideIcon;
  gradient: string;
}

export type ToolId = "quiz" | "flashcards" | "podcast" | "mind-map" | "notes" | "summarizer" | "homework-help";

export const subjectsList: SubjectItem[] = [
  { name: "Mathematics", icon: "📐", color: "from-blue-500 to-cyan-500" },
  { name: "Science", icon: "🔬", color: "from-green-500 to-emerald-500" },
  { name: "Physics", icon: "⚛️", color: "from-purple-500 to-violet-500" },
  { name: "Chemistry", icon: "🧪", color: "from-pink-500 to-rose-500" },
  { name: "Biology", icon: "🧬", color: "from-teal-500 to-cyan-500" },
  { name: "History", icon: "📜", color: "from-amber-500 to-orange-500" },
  { name: "Economics", icon: "📊", color: "from-indigo-500 to-blue-500" },
  { name: "Literature", icon: "📚", color: "from-rose-500 to-pink-500" },
  { name: "Computer Science", icon: "💻", color: "from-slate-500 to-zinc-500" },
  { name: "Languages", icon: "🌍", color: "from-cyan-500 to-teal-500" },
  { name: "Business", icon: "💼", color: "from-yellow-500 to-amber-500" },
  { name: "And More...", icon: "✨", color: "from-primary to-primary/70" },
];

export const allTools: OtherToolItem[] = [
  { id: "quiz", name: "AI Quiz", description: "Generate quizzes from any content", path: "/tools/quiz", icon: Brain, gradient: "from-violet-500 to-purple-600" },
  { id: "flashcards", name: "AI Flashcards", description: "Create flashcards for spaced repetition", path: "/tools/flashcards", icon: Layers, gradient: "from-amber-500 to-orange-600" },
  { id: "podcast", name: "AI Podcast", description: "Turn notes into audio podcasts", path: "/tools/podcast", icon: Headphones, gradient: "from-rose-500 to-pink-600" },
  { id: "mind-map", name: "Mind Map", description: "Visualize concepts and relationships", path: "/tools/mindmap", icon: Network, gradient: "from-cyan-500 to-teal-600" },
  { id: "notes", name: "AI Lecture Notes", description: "Generate structured study notes", path: "/tools/lecture-notes", icon: FileText, gradient: "from-blue-500 to-indigo-600" },
  { id: "summarizer", name: "AI Summarizer", description: "Summarize documents and videos", path: "/tools/summarizer", icon: List, gradient: "from-emerald-500 to-green-600" },
  { id: "homework-help", name: "Homework Help", description: "Get step-by-step solutions", path: "/tools/homework-help", icon: GraduationCap, gradient: "from-fuchsia-500 to-purple-600" },
];

export const toolPromoData: Record<ToolId, {
  stats: StatItem[];
  features: FeatureItem[];
  showSubjects: boolean;
  whyUseTitle: string;
  whyUseBenefits: string[];
}> = {
  quiz: {
    stats: [
      { value: "98%", label: "Accuracy Rate", icon: CheckCircle },
      { value: "50K+", label: "Quizzes Generated", icon: Brain },
      { value: "24/7", label: "Instant Feedback", icon: Clock },
    ],
    features: [
      { icon: Upload, title: "Easy Content Input", description: "Upload PDFs, paste text, record lectures, or use YouTube videos", gradient: "from-blue-500 to-cyan-500" },
      { icon: Target, title: "Adaptive Questions", description: "AI generates questions matched to your content difficulty", gradient: "from-purple-500 to-violet-500" },
      { icon: Zap, title: "Instant Generation", description: "Get your quiz ready in seconds, not minutes", gradient: "from-amber-500 to-orange-500" },
      { icon: BookOpen, title: "Detailed Explanations", description: "Learn from comprehensive answer explanations", gradient: "from-emerald-500 to-green-500" },
      { icon: Download, title: "Export Options", description: "Download quizzes as PDF for offline study", gradient: "from-rose-500 to-pink-500" },
      { icon: Shuffle, title: "Retry Wrong Answers", description: "Focus on questions you got wrong to improve", gradient: "from-indigo-500 to-blue-500" },
    ],
    showSubjects: true,
    whyUseTitle: "Why use NewtonAI's Quiz Generator?",
    whyUseBenefits: ["AI-powered question generation", "Multiple input formats", "Detailed explanations", "Progress tracking"],
  },
  flashcards: {
    stats: [
      { value: "2M+", label: "Cards Created", icon: Layers },
      { value: "4x", label: "Faster Learning", icon: TrendingUp },
      { value: "Visual", label: "Memory Boost", icon: Sparkles },
    ],
    features: [
      { icon: Upload, title: "Multi-Format Input", description: "Create cards from PDFs, text, recordings, or videos", gradient: "from-blue-500 to-cyan-500" },
      { icon: Brain, title: "Smart Generation", description: "AI extracts key concepts and creates optimal Q&A pairs", gradient: "from-purple-500 to-violet-500" },
      { icon: Shuffle, title: "Shuffle Mode", description: "Randomize card order to enhance memory retention", gradient: "from-amber-500 to-orange-500" },
      { icon: Award, title: "Mastery Tracking", description: "Mark cards as mastered and track your progress", gradient: "from-emerald-500 to-green-500" },
      { icon: Target, title: "Spaced Repetition", description: "Review cards at optimal intervals for retention", gradient: "from-rose-500 to-pink-500" },
      { icon: Download, title: "Export Cards", description: "Download your flashcard deck for offline studying", gradient: "from-indigo-500 to-blue-500" },
    ],
    showSubjects: true,
    whyUseTitle: "Why use NewtonAI's Flashcard Generator?",
    whyUseBenefits: ["Spaced repetition learning", "Visual memory enhancement", "Progress tracking", "Multi-format support"],
  },
  podcast: {
    stats: [
      { value: "Pro", label: "Voice Quality", icon: Volume2 },
      { value: "30+", label: "Languages", icon: Globe },
      { value: "Q&A", label: "Interactive", icon: MessageCircle },
    ],
    features: [
      { icon: Headphones, title: "Professional Voices", description: "Natural-sounding AI voices for engaging audio", gradient: "from-rose-500 to-pink-500" },
      { icon: Users, title: "Dual Host Format", description: "Two hosts discuss your content naturally", gradient: "from-purple-500 to-violet-500" },
      { icon: Languages, title: "Multi-Language", description: "Generate podcasts in 30+ languages", gradient: "from-cyan-500 to-teal-500" },
      { icon: MessageCircle, title: "Raise Hand Q&A", description: "Ask questions and get answers in real-time", gradient: "from-amber-500 to-orange-500" },
      { icon: Mic, title: "Voice Selection", description: "Choose from multiple voice personalities", gradient: "from-blue-500 to-indigo-500" },
      { icon: Download, title: "Download Audio", description: "Save podcasts for offline listening", gradient: "from-emerald-500 to-green-500" },
    ],
    showSubjects: false,
    whyUseTitle: "Why use NewtonAI's Podcast Generator?",
    whyUseBenefits: ["Learn while commuting", "Professional voice quality", "Interactive Q&A", "Multiple languages"],
  },
  "mind-map": {
    stats: [
      { value: "∞", label: "Zoom Levels", icon: Network },
      { value: "4", label: "Layout Styles", icon: GitBranch },
      { value: "Auto", label: "Connections", icon: Share2 },
    ],
    features: [
      { icon: Network, title: "Visual Learning", description: "Transform text into visual concept maps", gradient: "from-cyan-500 to-teal-500" },
      { icon: GitBranch, title: "Multiple Layouts", description: "Choose from radial, tree, cluster, or timeline views", gradient: "from-purple-500 to-violet-500" },
      { icon: Zap, title: "Instant Generation", description: "AI identifies relationships and creates maps quickly", gradient: "from-amber-500 to-orange-500" },
      { icon: Share2, title: "Smart Connections", description: "Automatic linking of related concepts", gradient: "from-blue-500 to-indigo-500" },
      { icon: Target, title: "Interactive Zoom", description: "Zoom in/out to explore details or overview", gradient: "from-rose-500 to-pink-500" },
      { icon: Download, title: "Export Maps", description: "Download mind maps as images", gradient: "from-emerald-500 to-green-500" },
    ],
    showSubjects: false,
    whyUseTitle: "Why use NewtonAI's Mind Map Generator?",
    whyUseBenefits: ["Visual concept mapping", "Multiple layout options", "Auto-connections", "Interactive exploration"],
  },
  notes: {
    stats: [
      { value: "Academic", label: "Format", icon: FileText },
      { value: "LaTeX", label: "Math Support", icon: Calculator },
      { value: "4", label: "Templates", icon: Layers },
    ],
    features: [
      { icon: FileText, title: "Structured Notes", description: "Well-organized notes with headers and sections", gradient: "from-blue-500 to-indigo-500" },
      { icon: Mic, title: "Lecture Recording", description: "Record lectures and transcribe automatically", gradient: "from-rose-500 to-pink-500" },
      { icon: Calculator, title: "Math & Equations", description: "Full LaTeX support for mathematical content", gradient: "from-purple-500 to-violet-500" },
      { icon: Layers, title: "Multiple Templates", description: "Lecture, study guide, research, or project formats", gradient: "from-amber-500 to-orange-500" },
      { icon: Lightbulb, title: "Key Highlights", description: "AI identifies and highlights important concepts", gradient: "from-emerald-500 to-green-500" },
      { icon: Volume2, title: "Read Aloud", description: "Listen to your notes with text-to-speech", gradient: "from-cyan-500 to-teal-500" },
    ],
    showSubjects: false,
    whyUseTitle: "Why use NewtonAI's Lecture Notes?",
    whyUseBenefits: ["Academic formatting", "LaTeX support", "Multiple templates", "Audio transcription"],
  },
  summarizer: {
    stats: [
      { value: "Key", label: "Insights", icon: Lightbulb },
      { value: "4", label: "Formats", icon: List },
      { value: "PDF", label: "Export", icon: Download },
    ],
    features: [
      { icon: List, title: "Multiple Formats", description: "Concise, detailed, bullet-point, or academic summaries", gradient: "from-emerald-500 to-green-500" },
      { icon: Upload, title: "Any Content", description: "Summarize PDFs, videos, recordings, or text", gradient: "from-blue-500 to-cyan-500" },
      { icon: Lightbulb, title: "Key Insights", description: "AI extracts the most important information", gradient: "from-amber-500 to-orange-500" },
      { icon: Brain, title: "Tool Integration", description: "Generate quizzes, flashcards, or podcasts from summaries", gradient: "from-purple-500 to-violet-500" },
      { icon: Volume2, title: "Read Aloud", description: "Listen to summaries with text-to-speech", gradient: "from-rose-500 to-pink-500" },
      { icon: Download, title: "Export Options", description: "Download summaries as PDF or copy to clipboard", gradient: "from-indigo-500 to-blue-500" },
    ],
    showSubjects: false,
    whyUseTitle: "Why use NewtonAI's Summarizer?",
    whyUseBenefits: ["Multiple summary formats", "Cross-tool integration", "Key insight extraction", "Any content type"],
  },
  "homework-help": {
    stats: [
      { value: "Step", label: "By Step", icon: BookOpen },
      { value: "All", label: "Subjects", icon: GraduationCap },
      { value: "Image", label: "Upload", icon: Image },
    ],
    features: [
      { icon: BookOpen, title: "Step-by-Step", description: "Detailed explanations for every problem", gradient: "from-fuchsia-500 to-purple-500" },
      { icon: Image, title: "Image Upload", description: "Take a photo of your homework and get help", gradient: "from-blue-500 to-cyan-500" },
      { icon: GraduationCap, title: "All Subjects", description: "Math, science, history, languages, and more", gradient: "from-amber-500 to-orange-500" },
      { icon: Calculator, title: "Math Support", description: "Full LaTeX rendering for equations", gradient: "from-purple-500 to-violet-500" },
      { icon: Volume2, title: "Read Aloud", description: "Listen to solutions with text-to-speech", gradient: "from-rose-500 to-pink-500" },
      { icon: Shield, title: "Learn, Don't Copy", description: "Understand concepts, not just answers", gradient: "from-emerald-500 to-green-500" },
    ],
    showSubjects: true,
    whyUseTitle: "Why use NewtonAI's Homework Help?",
    whyUseBenefits: ["Step-by-step solutions", "Image problem upload", "All subjects covered", "Learning-focused explanations"],
  },
};
