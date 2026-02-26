import { useState, useEffect, useCallback, useRef } from "react";
import {
  Maximize, PenTool, Type, Mic, Video, Palette, ChevronRight, FileText,
  Activity, AlertTriangle, MessageSquare, Brain, Eye,
  NotebookPen, BarChart3, BookOpen, BookMarked, GraduationCap, Code2,
  Layers, FileQuestion, Network, Headphones, School,
  ClipboardList, Users, TrendingUp, Building2,
  ChevronLeft, Expand, ArrowRight, Sparkles, Monitor, Zap,
  FileDown, Download, XCircle, Smartphone, BarChart, ShieldCheck,
  BookCheck, Flag, Play, ImageIcon, Calculator, Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

const TOTAL_SLIDES = 8;

/* ─── slide data ─── */

const problemPoints = [
  { icon: Monitor, title: "Fancy PDF Viewers", desc: "Smart boards reduced to displaying static slides" },
  { icon: Smartphone, title: "Tool Juggling", desc: "Faculty juggling Excel, WhatsApp, paper registers" },
  { icon: XCircle, title: "No Student View", desc: "Students have no single view of marks, attendance, progress" },
  { icon: BarChart, title: "Zero Analytics", desc: "Admin has no visibility into teaching quality or failure rates" },
];

const smartBoardFeatures = [
  { icon: Maximize, title: "Walk-in Mode", desc: "Teacher arrives, board auto-loads class content" },
  { icon: PenTool, title: "Digital Whiteboard", desc: "Pen, highlighter, eraser, colors, undo/redo, clear" },
  { icon: Type, title: "Handwriting Recognition", desc: "Board strokes become searchable digital text" },
  { icon: Mic, title: "Voice Commands", desc: '"Next slide", "start recording" — hands-free control' },
  { icon: Video, title: "Lecture Recording", desc: "One-tap capture with REC indicator and timeline" },
  { icon: FileText, title: "Document Teaching", desc: "Teach from PDFs directly on the board" },
  { icon: Palette, title: "Classroom Themes", desc: "Optimized for projector or smart board display" },
];

const visualLearningFeatures = [
  { icon: Play, title: "Instant Video Search", desc: "Select any topic — find and play educational videos inside the platform, no tab switching" },
  { icon: Network, title: "AI Mind Maps", desc: "Auto-generate visual concept maps from any content" },
  { icon: Headphones, title: "AI Podcast", desc: "Convert any document into audio — learn while commuting" },
  { icon: ImageIcon, title: "Handwriting OCR", desc: "Photo of handwritten notes → AI extracts and digitizes" },
  { icon: Calculator, title: "LaTeX & Equations", desc: "Complex math rendered beautifully on screen" },
  { icon: Sparkles, title: "One-Tap Explainer", desc: "Tap any topic = instant animated explainer video" },
];

const interactionFeatures = [
  { icon: Activity, title: "Live Pulse Check", desc: "Students tap Got it / Slightly lost / Lost — teacher sees live bar chart" },
  { icon: AlertTriangle, title: "Confusion Alert", desc: "Auto-warning when too many students are lost" },
  { icon: MessageSquare, title: "Anonymous Question Wall", desc: "Ask, upvote, pin, filter — no fear of judgment" },
  { icon: Brain, title: "AI Concept Checks", desc: "Timed MCQs mid-lecture with live response tracking" },
  { icon: Eye, title: "Spotlight Sync", desc: "Teacher pushes content to all student screens instantly" },
];

const notesAndToolsFeatures = [
  { icon: NotebookPen, title: "Auto Note Generation", desc: "AI creates structured notes per slide, live" },
  { icon: BookOpen, title: "Student Notes Drawer", desc: "Pull-out drawer with new-note badge indicator" },
  { icon: BookMarked, title: "Key Terms Extraction", desc: "Important terms extracted and defined per slide" },
  { icon: GraduationCap, title: "Post-Session Review", desc: "Complete session notes available after class" },
  { icon: Layers, title: "AI Flashcards", desc: "Auto-generated from any document for revision" },
  { icon: FileQuestion, title: "AI Quiz Generator", desc: "Multiple types, adaptive difficulty levels" },
  { icon: FileText, title: "AI Summarizer", desc: "Chapter summaries at your chosen length" },
  { icon: Brain, title: "Homework Help", desc: "Step-by-step problem solutions with AI" },
  { icon: MessageSquare, title: "PDF Chat", desc: "Conversational Q&A with any uploaded document" },
];

const institutionFeatures = [
  { icon: ClipboardList, title: "Teacher Intelligence Report", desc: "Session summary, engagement heatmap, topics to revisit, PDF export" },
  { icon: Users, title: "Student Performance Card", desc: "Understanding score, knowledge gaps, weak topic tracker" },
  { icon: Building2, title: "Department Management", desc: "Faculty monitoring, course allocation, workload tracking" },
  { icon: ShieldCheck, title: "Compliance & Audit Trails", desc: "Complete logs for NAAC/NBA accreditation readiness" },
  { icon: BookCheck, title: "Result Processing", desc: "Gradebook, rank lists, report cards — all automated" },
  { icon: Flag, title: "Red Flag Alerts", desc: "Early warning for high failure-rate courses or sections" },
];

/* ─── reusable card ─── */

function FeatureCard({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) {
  return (
    <div
      className="group relative bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/10 transition-colors"
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

/* ─── slide header helper ─── */
function SlideHeader({ icon: Icon, color, slideNum, title, subtitle }: { icon: any; color: string; slideNum: number; title: string; subtitle: string }) {
  return (
    <>
      <div className="flex items-center gap-3 mb-2 animate-fade-in">
        <Icon className={`w-8 h-8 ${color}`} />
        <span className={`text-sm font-medium ${color} uppercase tracking-wider`}>Slide {slideNum} of {TOTAL_SLIDES}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "80ms" }}>
        {title}
      </h2>
      <p className="text-slate-400 mt-2 text-base sm:text-lg max-w-2xl animate-fade-in" style={{ animationDelay: "160ms" }}>
        {subtitle}
      </p>
    </>
  );
}

/* ─── slides ─── */

function SlideHero() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">AI-Powered Education Platform</span>
        </div>
      </div>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
        NewtonAI
      </h1>
      <p className="text-xl sm:text-2xl lg:text-3xl text-slate-300 mt-3 font-light animate-fade-in" style={{ animationDelay: "200ms" }}>
        AI Classroom OS for Smart Boards
      </p>
      <p className="text-base text-slate-500 mt-2 max-w-2xl animate-fade-in" style={{ animationDelay: "250ms" }}>
        Proposed for Your Institution — Pilot Program
      </p>
      <p className="text-sm text-slate-600 mt-1 animate-fade-in" style={{ animationDelay: "280ms" }}>
        One screen. One system. Complete classroom workflow.
      </p>

      <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-10 max-w-xl w-full animate-fade-in" style={{ animationDelay: "400ms" }}>
        {[
          { icon: Zap, label: "15+ AI Tools", sub: "Study & Teach" },
          { icon: Activity, label: "Real-Time", sub: "Interaction" },
          { icon: TrendingUp, label: "Institutional", sub: "Analytics" },
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

function SlideProblem() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={AlertTriangle} color="text-red-400" slideNum={2} title="The Problem Today" subtitle="Smart boards are underutilized. Faculty juggle fragmented tools. Admin flies blind." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {problemPoints.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 100}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
        <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 animate-fade-in" style={{ animationDelay: "700ms" }}>
          <p className="text-red-300 text-sm font-medium text-center">
            Result: ₹5–15 lakh spent on smart boards that function as ₹500 projectors
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideSmartBoard() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={Monitor} color="text-blue-400" slideNum={3} title="Smart Board → Classroom OS" subtitle="The board becomes a full teaching operating system — whiteboard, slides, voice, recording, all in one." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
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

function SlideVisualLearning() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={Play} color="text-emerald-400" slideNum={4} title="Instant Visual Learning" subtitle="One tap on any topic = instant animated explainer video. Mind maps, podcasts, OCR — all built in." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {visualLearningFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 80}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
        <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 animate-fade-in" style={{ animationDelay: "750ms" }}>
          <p className="text-emerald-300 text-sm font-medium text-center">
            🎬 Key Differentiator: Select any text on the board → instant educational video plays inside the platform
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideInteraction() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={Activity} color="text-green-400" slideNum={5} title="Real-Time Interaction" subtitle="Every student has a voice. Teachers get instant feedback. The interaction gap disappears." />
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

function SlideNotesTools() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={NotebookPen} color="text-amber-400" slideNum={6} title="AI Notes & Study Tools" subtitle="Notes generated live. Students focus on learning, not scribbling. Plus a personal AI tutor for every student." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
          {notesAndToolsFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 60}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideInstitution() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={Building2} color="text-cyan-400" slideNum={7} title="Institution Dashboard & Analytics" subtitle="Every session produces actionable insights for teachers, students, and administration." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {institutionFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 100}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideImpact() {
  const benefits = [
    { who: "Faculty", text: "No more juggling apps — AI-assisted teaching, auto-generated notes, one-click recording" },
    { who: "Students", text: "Transparent progress, interactive learning, personal AI tutor with flashcards & quizzes" },
    { who: "Administration", text: "Clean data for NAAC/NBA, early risk detection, department-wide analytics" },
  ];
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={TrendingUp} color="text-purple-400" slideNum={8} title="Impact & Next Steps" subtitle="Transform every smart board into a Classroom Operating System." />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {benefits.map((b, i) => (
            <div key={b.who} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${240 + i * 120}ms` }}>
              <p className="text-blue-400 font-semibold text-sm mb-1">For {b.who}</p>
              <p className="text-slate-300 text-xs leading-relaxed">{b.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: "600ms" }}>
          <p className="text-blue-300 text-sm font-medium">🚀 Pilot Proposal: Start with 2–3 departments this semester</p>
        </div>

        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "700ms" }}>
          <div className="inline-block bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
            <p className="text-lg sm:text-xl text-white font-semibold">
              Let's make every smart board a{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Classroom Operating System</span>
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-6 py-3 transition-colors">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── download helpers ─── */

const slideContent = [
  { title: "NewtonAI — AI Classroom OS", subtitle: "One screen. One system. Complete classroom workflow.", bullets: ["15+ AI Tools for Study & Teaching", "Real-Time Student-Teacher Interaction", "Institutional Analytics & Dashboards", "Proposed Pilot Program for Your Institution"] },
  { title: "The Problem Today", subtitle: "Smart boards are underutilized and faculty tools are fragmented.", bullets: problemPoints.map(p => `${p.title}: ${p.desc}`) },
  { title: "Smart Board → Classroom OS", subtitle: "The board becomes a full teaching operating system.", bullets: smartBoardFeatures.map(f => `${f.title}: ${f.desc}`) },
  { title: "Instant Visual Learning", subtitle: "One tap on any topic = instant animated explainer video.", bullets: visualLearningFeatures.map(f => `${f.title}: ${f.desc}`) },
  { title: "Real-Time Interaction", subtitle: "Every student has a voice. The interaction gap disappears.", bullets: interactionFeatures.map(f => `${f.title}: ${f.desc}`) },
  { title: "AI Notes & Study Tools", subtitle: "Notes generated live. Plus a personal AI tutor for every student.", bullets: notesAndToolsFeatures.map(f => `${f.title}: ${f.desc}`) },
  { title: "Institution Dashboard & Analytics", subtitle: "Actionable insights for teachers, students, and administration.", bullets: institutionFeatures.map(f => `${f.title}: ${f.desc}`) },
  { title: "Impact & Next Steps", subtitle: "Transform every smart board into a Classroom OS.", bullets: ["Faculty: AI-assisted teaching, auto notes, one-click recording", "Students: Transparent progress, interactive learning, personal AI tutor", "Administration: Clean data for NAAC/NBA, early risk detection", "Pilot: Start with 2–3 departments this semester"] },
];

async function generatePDF() {
  const html2canvas = (await import("html2canvas")).default;
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720] });

  // Create off-screen container
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:1280px;height:720px;overflow:hidden;";
  document.body.appendChild(container);

  for (let idx = 0; idx < SLIDES.length; idx++) {
    if (idx > 0) doc.addPage([1280, 720], "landscape");

    // Clone the visible slide
    const slideEl = document.querySelector(`[data-slide-index="${idx}"]`);
    if (!slideEl) continue;
    const clone = slideEl.cloneNode(true) as HTMLElement;
    clone.style.cssText = "width:1280px;height:720px;position:relative;opacity:1;transform:none;pointer-events:none;background:linear-gradient(135deg,#020617,#0f172a,#020617);";
    container.innerHTML = "";
    container.appendChild(clone);

    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#020617",
      width: 1280,
      height: 720,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    doc.addImage(imgData, "JPEG", 0, 0, 1280, 720);
  }

  document.body.removeChild(container);
  doc.save("NewtonAI-PitchDeck.pdf");
}

async function generatePPTX() {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.author = "NewtonAI";
  pptx.title = "NewtonAI — AI Classroom OS";

  slideContent.forEach((s, idx) => {
    const slide = pptx.addSlide();
    slide.background = { fill: "0F172A" };

    // slide number
    slide.addText(`Slide ${idx + 1} of ${TOTAL_SLIDES}`, { x: 8.5, y: 0.2, w: 1.5, fontSize: 8, color: "64748B", align: "right" });

    // title
    slide.addText(s.title, { x: 0.5, y: 0.4, w: 9, fontSize: 28, color: "60A5FA", bold: true, fontFace: "Arial" });

    // subtitle
    slide.addText(s.subtitle, { x: 0.5, y: 1.1, w: 9, fontSize: 14, color: "94A3B8", fontFace: "Arial" });

    // bullets
    const bulletObjs = s.bullets.map(b => ({ text: b, options: { fontSize: 11, color: "E2E8F0", bullet: { code: "2022" }, paraSpaceAfter: 6 } }));
    slide.addText(bulletObjs as any, { x: 0.6, y: 1.7, w: 8.8, h: 3.5, fontFace: "Arial", valign: "top" });

    // footer
    slide.addText("NewtonAI — AI Classroom OS", { x: 0.5, y: 5.1, w: 5, fontSize: 8, color: "475569" });
  });

  pptx.writeFile({ fileName: "NewtonAI-PitchDeck.pptx" });
}

/* ─── main component ─── */

const SLIDES = [SlideHero, SlideProblem, SlideSmartBoard, SlideVisualLearning, SlideInteraction, SlideNotesTools, SlideInstitution, SlideImpact];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); next(); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape" && document.fullscreenElement) document.exitFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  useEffect(() => {
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLock.current) return;
      wheelLock.current = true;
      if (e.deltaY > 30) next(); else if (e.deltaY < -30) prev();
      setTimeout(() => (wheelLock.current = false), 600);
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [next, prev]);

  useEffect(() => {
    const start = (e: TouchEvent) => (touchStartY.current = e.touches[0].clientY);
    const end = (e: TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => { window.removeEventListener("touchstart", start); window.removeEventListener("touchend", end); };
  }, [next, prev]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden select-none">
      {/* progress bar */}
      <div className="absolute top-0 left-0 h-1 bg-blue-500/80 z-50 transition-all duration-500 ease-out" style={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }} />

      {/* slides */}
      {SLIDES.map((Slide, i) => (
        <div
          key={i}
          data-slide-index={i}
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
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
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
        <span className="text-xs text-slate-500 mr-2">{current + 1} / {TOTAL_SLIDES}</span>
        <button onClick={prev} disabled={current === 0} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={next} disabled={current === TOTAL_SLIDES - 1} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white disabled:opacity-20 hover:bg-white/10 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
          <Expand className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button onClick={() => { setGeneratingPDF(true); generatePDF().finally(() => setGeneratingPDF(false)); }} disabled={generatingPDF} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50" title="Download PDF">
          {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
        <button onClick={generatePPTX} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors" title="Download PPTX">
          <FileDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
