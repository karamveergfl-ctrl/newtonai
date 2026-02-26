import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Maximize, PenTool, Type, Mic, Video, Palette, ChevronRight, FileText,
  Activity, AlertTriangle, MessageSquare, Brain, Eye,
  NotebookPen, BarChart3, BookOpen, BookMarked, GraduationCap, Code2,
  Layers, FileQuestion, Network, Headphones, School,
  ClipboardList, Users, TrendingUp, Building2,
  ChevronLeft, Expand, ArrowRight, Sparkles, Monitor, Zap
} from "lucide-react";
import { Link } from "react-router-dom";

const TOTAL_SLIDES = 6;

/* ───────────────── feature card data ───────────────── */

const smartBoardFeatures = [
  { icon: Maximize, title: "Fullscreen Smart Board", desc: "Auto-prompt on large screens for immersive teaching" },
  { icon: PenTool, title: "Digital Whiteboard", desc: "Pen, highlighter, eraser, colors, undo/redo, clear" },
  { icon: Type, title: "Handwriting Recognition", desc: "Board strokes converted to text and slide content" },
  { icon: Mic, title: "Voice Commands", desc: '"Next slide", "start recording" with voice indicator' },
  { icon: Video, title: "Lecture Recording", desc: "Start/stop capture with REC indicator and timeline" },
  { icon: Palette, title: "Classroom Themes", desc: "Dark/light toggle optimized for projector or smart board" },
  { icon: ChevronRight, title: "Slide Navigation", desc: "Advance slides with automatic note generation" },
  { icon: FileText, title: "Document Teaching", desc: "Teach directly from uploaded PDFs and documents" },
];

const interactionFeatures = [
  { icon: Activity, title: "Live Pulse Check", desc: "Students tap Got it / Slightly lost / Lost — teacher sees live bar chart" },
  { icon: AlertTriangle, title: "Confusion Alert", desc: "Auto-warning with threshold-based detection when class struggles" },
  { icon: MessageSquare, title: "Anonymous Question Wall", desc: "Ask, upvote, pin, filter — teacher sees All / Unanswered / Pinned" },
  { icon: Brain, title: "AI Concept Checks", desc: "Timed MCQs mid-lecture with live response tracking and results" },
  { icon: Eye, title: "Spotlight Sync", desc: "Teacher pushes content to all screens — students browse or resync" },
];

const notesFeatures = [
  { icon: NotebookPen, title: "Auto Note Generation", desc: "AI creates structured notes per slide automatically" },
  { icon: BarChart3, title: "Teacher Notes Dashboard", desc: "Progress bar showing notes status for every slide" },
  { icon: BookOpen, title: "Student Notes Drawer", desc: "Pull-out drawer with new-note badge indicator" },
  { icon: BookMarked, title: "Key Terms Extraction", desc: "Important terms extracted and defined per slide" },
  { icon: GraduationCap, title: "Post-Session Review", desc: "Complete session notes available after class ends" },
  { icon: Code2, title: "LaTeX & Markdown", desc: "Formatted equations, code blocks, and rich content" },
];

const studyTools = [
  { icon: Layers, title: "AI Flashcards", desc: "Auto-generated from any document" },
  { icon: FileQuestion, title: "AI Quiz Generator", desc: "Multiple types, adaptive difficulty" },
  { icon: FileText, title: "AI Summarizer", desc: "Summaries at chosen length" },
  { icon: Network, title: "Mind Maps", desc: "Visual concept maps from content" },
  { icon: Mic, title: "Lecture Notes", desc: "Audio to structured notes" },
  { icon: Headphones, title: "AI Podcast", desc: "Documents to listenable audio" },
  { icon: Brain, title: "Homework Help", desc: "Step-by-step problem solutions" },
  { icon: MessageSquare, title: "PDF Chat", desc: "Conversational Q&A with PDFs" },
  { icon: School, title: "Classroom Hub", desc: "Classes, assignments, performance" },
];

const analyticsFeatures = [
  { icon: ClipboardList, title: "Teacher Intelligence Report", desc: "Session summary, engagement heatmap, topics to revisit, PDF export" },
  { icon: Users, title: "Student Performance Card", desc: "Understanding score, knowledge gaps, weak topic tracker" },
  { icon: TrendingUp, title: "Engagement Heatmap", desc: "Strongest/weakest topics with class-wide analytics" },
  { icon: Building2, title: "Institution Dashboard", desc: "Departments, faculty monitoring, compliance, result processing" },
];

/* ───────────────── reusable card ───────────────── */

function FeatureCard({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) {
  return (
    <div
      className="group relative bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4 hover-scale"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
          <Icon className="w-5 h-5 text-blue-400" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white leading-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── slide components ───────────────── */

function SlideHero() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">AI-Powered Education Platform</span>
        </div>
      </div>
      <h1
        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight animate-fade-in"
        style={{ animationDelay: "100ms" }}
      >
        NewtonAI
      </h1>
      <p
        className="text-xl sm:text-2xl lg:text-3xl text-slate-300 mt-3 font-light animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        AI Classroom OS for Smart Boards
      </p>
      <p
        className="text-base sm:text-lg text-slate-500 mt-2 max-w-2xl animate-fade-in"
        style={{ animationDelay: "300ms" }}
      >
        One screen. One system. Complete classroom workflow.
      </p>

      <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-10 max-w-xl w-full animate-fade-in" style={{ animationDelay: "400ms" }}>
        {[
          { icon: Zap, label: "15+ AI Tools", sub: "Study & Teach" },
          { icon: Activity, label: "Real-Time", sub: "Interaction" },
          { icon: TrendingUp, label: "Complete", sub: "Analytics" },
        ].map(({ icon: I, label, sub }) => (
          <div key={label} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <I className="w-7 h-7 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-semibold text-sm">{label}</p>
            <p className="text-slate-500 text-xs">{sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mt-8 animate-fade-in" style={{ animationDelay: "500ms" }}>
        For universities, colleges, and schools with smart boards
      </p>
    </div>
  );
}

function SlideSmartBoard() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
          <Monitor className="w-8 h-8 text-blue-400" />
          <span className="text-sm font-medium text-blue-400 uppercase tracking-wider">Slide 2 of 6</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "80ms" }}>
          Smart Board Mode
        </h2>
        <p className="text-slate-400 mt-2 text-base sm:text-lg max-w-2xl animate-fade-in" style={{ animationDelay: "160ms" }}>
          The classroom smart board becomes a full teaching OS — whiteboard, slides, voice, recording, all in one.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          {smartBoardFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 80}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideInteraction() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
          <Activity className="w-8 h-8 text-green-400" />
          <span className="text-sm font-medium text-green-400 uppercase tracking-wider">Slide 3 of 6</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "80ms" }}>
          Real-Time Interaction
        </h2>
        <p className="text-slate-400 mt-2 text-base sm:text-lg max-w-2xl animate-fade-in" style={{ animationDelay: "160ms" }}>
          Every student has a voice. Teachers get instant feedback. The interaction gap disappears.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {interactionFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 100}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideNotes() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
          <NotebookPen className="w-8 h-8 text-amber-400" />
          <span className="text-sm font-medium text-amber-400 uppercase tracking-wider">Slide 4 of 6</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "80ms" }}>
          AI-Powered Live Notes
        </h2>
        <p className="text-slate-400 mt-2 text-base sm:text-lg max-w-2xl animate-fade-in" style={{ animationDelay: "160ms" }}>
          Notes are generated live during class — students focus on learning, not scribbling.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {notesFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 80}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideStudyTools() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
          <Sparkles className="w-8 h-8 text-purple-400" />
          <span className="text-sm font-medium text-purple-400 uppercase tracking-wider">Slide 5 of 6</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "80ms" }}>
          AI Study Tools
        </h2>
        <p className="text-slate-400 mt-2 text-base sm:text-lg max-w-2xl animate-fade-in" style={{ animationDelay: "160ms" }}>
          Every student gets a personal AI tutor — flashcards, quizzes, mind maps, podcasts, and more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {studyTools.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 60}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideAnalytics() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-2 animate-fade-in">
          <TrendingUp className="w-8 h-8 text-cyan-400" />
          <span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">Slide 6 of 6</span>
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "80ms" }}>
          Intelligence Reports & Analytics
        </h2>
        <p className="text-slate-400 mt-2 text-base sm:text-lg max-w-2xl animate-fade-in" style={{ animationDelay: "160ms" }}>
          Every session produces actionable insights for teachers, students, and institutions.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {analyticsFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 100}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center animate-fade-in" style={{ animationDelay: "700ms" }}>
          <div className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
            <p className="text-lg sm:text-xl text-white font-semibold">
              Let's make every smart board a{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Classroom Operating System
              </span>
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-colors"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── main deck component ───────────────── */

const SLIDES = [SlideHero, SlideSmartBoard, SlideInteraction, SlideNotes, SlideStudyTools, SlideAnalytics];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const wheelLock = useRef(false);
  const touchStartY = useRef(0);

  const goTo = useCallback(
    (idx: number) => {
      if (transitioning) return;
      const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, idx));
      if (clamped === current) return;
      setTransitioning(true);
      setCurrent(clamped);
      setTimeout(() => setTransitioning(false), 650);
    },
    [current, transitioning]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  // scroll
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      if (e.deltaY > 30) next();
      else if (e.deltaY < -30) prev();
      setTimeout(() => (wheelLock.current = false), 600);
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [next, prev]);

  // touch
  useEffect(() => {
    const start = (e: TouchEvent) => (touchStartY.current = e.touches[0].clientY);
    const end = (e: TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        diff > 0 ? next() : prev();
      }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [next, prev]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden select-none">
      {/* progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-blue-500/80 z-50 transition-all duration-500 ease-out" style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }} />

      {/* slides */}
      {SLIDES.map((Slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-[600ms] ease-out"
          style={{
            opacity: i === current ? 1 : 0,
            transform: i === current ? "translateY(0)" : i < current ? "translateY(-40px)" : "translateY(40px)",
            pointerEvents: i === current ? "auto" : "none",
          }}
        >
          <Slide />
        </div>
      ))}

      {/* dot indicators */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-50">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? "bg-blue-400 scale-125" : "bg-white/20 hover:bg-white/40"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* bottom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-50">
        <span className="text-xs text-slate-500 mr-2">
          {current + 1} / {TOTAL_SLIDES}
        </span>
        <button onClick={prev} disabled={current === 0} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={next} disabled={current === TOTAL_SLIDES - 1} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
          <Expand className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
