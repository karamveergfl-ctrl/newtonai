import { useState, useEffect, useCallback, useRef } from "react";
import {
  Maximize, PenTool, Type, Mic, Video, Palette, ChevronRight, FileText,
  Activity, AlertTriangle, MessageSquare, Brain, Eye,
  NotebookPen, BarChart3, BookOpen, BookMarked, GraduationCap, Code2,
  Layers, FileQuestion, Network, Headphones, School,
  ClipboardList, Users, TrendingUp, Building2,
  ChevronLeft, Expand, ArrowRight, Sparkles, Monitor, Zap,
  FileDown, Download, XCircle, Smartphone, BarChart, ShieldCheck,
  BookCheck, Flag, Play, ImageIcon, Calculator, Loader2,
  Target, Clock, DollarSign, Wifi, WifiOff, UserX, Search,
  PieChart, Award, Megaphone, CircleDot, CheckCircle2, Timer,
  Presentation, Radio, Hand, StickyNote, Lightbulb
} from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";

const TOTAL_SLIDES = 10;

/* ─── slide data ─── */

const problemStats = [
  { stat: "₹5–15L", label: "spent per smart board", sub: "functioning as a ₹5,000 projector" },
  { stat: "73%", label: "students never ask doubts", sub: "fear of judgment in large classrooms" },
  { stat: "0", label: "real-time analytics", sub: "admin has no visibility into teaching quality" },
];

const problemPoints = [
  { icon: Monitor, title: "₹15L Smart Boards = PDF Viewers", desc: "Expensive hardware reduced to displaying static slides — no interactivity, no analytics, no engagement" },
  { icon: UserX, title: "The Silent Classroom Crisis", desc: "73% of students never ask doubts in class. Large batches (100-300) make interaction physically impossible" },
  { icon: Smartphone, title: "Faculty Tool Chaos", desc: "Attendance on paper, marks in Excel, notes on WhatsApp, tests on Google Forms — 6+ disconnected tools per teacher" },
  { icon: WifiOff, title: "Administration Flies Blind", desc: "No data on which faculty is effective, which batch is struggling, or which course has alarming failure rates" },
  { icon: DollarSign, title: "Wasted EdTech Investment", desc: "Institutions spend crores on infrastructure but see zero ROI in teaching quality or student outcomes" },
  { icon: Clock, title: "30% Class Time Lost", desc: "Roll call, setting up slides, switching apps, managing disruptions — precious teaching time evaporates" },
];

const solutionPillars = [
  { icon: Monitor, title: "Smart Board → Classroom OS", desc: "One screen runs everything — whiteboard, slides, recording, attendance, interaction, analytics", color: "from-blue-500 to-cyan-500" },
  { icon: Activity, title: "Real-Time Engagement Loop", desc: "Every student participates every 5 minutes — Pulse checks, concept MCQs, anonymous questions", color: "from-green-500 to-emerald-500" },
  { icon: Brain, title: "AI Teaching Co-Pilot", desc: "Auto-generates notes, quizzes, flashcards, mind maps, and video explanations from any content", color: "from-purple-500 to-violet-500" },
  { icon: Building2, title: "Institution Intelligence", desc: "Department analytics, faculty reports, NAAC/NBA compliance data — all generated automatically", color: "from-amber-500 to-orange-500" },
];

const smartBoardFeatures = [
  { icon: Maximize, title: "Walk-in Auto-Load", desc: "Teacher arrives → board auto-loads today's class content, zero setup time" },
  { icon: PenTool, title: "Infinite Whiteboard", desc: "Multi-page digital whiteboard with pen, highlighter, shapes, undo/redo" },
  { icon: Type, title: "Handwriting → Text (OCR)", desc: "Write on board → AI converts to searchable digital text instantly" },
  { icon: Mic, title: "Voice Commands", desc: '"Next slide", "start recording", "show quiz" — complete hands-free control' },
  { icon: Video, title: "One-Tap Lecture Capture", desc: "Record entire lecture with slide timeline and searchable transcript" },
  { icon: FileText, title: "PDF Teaching Mode", desc: "Teach from PDFs with thumbnail navigation, annotations, and text selection" },
  { icon: Search, title: "In-Class Video Search", desc: "Select any topic → search and play educational videos without leaving the platform" },
];

const engagementFeatures = [
  { icon: Activity, title: "Live Pulse Meter", desc: "Students tap 'Got it' / 'Confused' — teacher sees real-time understanding bar" },
  { icon: AlertTriangle, title: "Confusion Auto-Alert", desc: "System warns teacher when >40% students report confusion on a concept" },
  { icon: MessageSquare, title: "Anonymous Question Wall", desc: "Students ask without fear, upvote important questions — teacher addresses top-voted" },
  { icon: Brain, title: "AI Concept Checks", desc: "Timed MCQs pushed mid-lecture — instant response tracking with correct answer reveal" },
  { icon: Eye, title: "Spotlight Sync", desc: "Push any content to all student screens simultaneously — everyone sees the same thing" },
  { icon: Hand, title: "Digital Hand Raise", desc: "Structured participation without chaos — queue system for orderly class interaction" },
];

const aiToolsFeatures = [
  { icon: NotebookPen, title: "Live AI Notes", desc: "Structured notes generated per slide as the teacher teaches — students focus on learning" },
  { icon: Layers, title: "Auto Flashcards", desc: "Key concepts extracted and turned into revision flashcards after every session" },
  { icon: FileQuestion, title: "Quiz Generator", desc: "Generate MCQ, true/false, short answer quizzes from any PDF, video, or text" },
  { icon: Headphones, title: "AI Study Podcast", desc: "Convert any document into a two-host audio podcast for revision on the go" },
  { icon: Network, title: "Mind Map Builder", desc: "Auto-generate visual concept maps showing relationships between topics" },
  { icon: MessageSquare, title: "Chat with PDF", desc: "Students ask questions about any uploaded document — AI answers with citations" },
  { icon: Calculator, title: "Homework Help", desc: "Step-by-step solutions for math, science, and engineering problems with LaTeX" },
  { icon: Lightbulb, title: "AI Summarizer", desc: "Summarize lengthy chapters into concise study material at your chosen depth" },
];

const institutionFeatures = [
  { icon: ClipboardList, title: "Teacher Intelligence Report", desc: "Per-session analytics: engagement heatmap, confusion spikes, topics to revisit, attendance trends" },
  { icon: Users, title: "Student Performance Cards", desc: "Understanding scores, knowledge gap analysis, weak topics, personalized video recommendations" },
  { icon: Building2, title: "Department Dashboard", desc: "Faculty workload tracking, course allocation, teaching effectiveness comparison across sections" },
  { icon: ShieldCheck, title: "NAAC/NBA Compliance Export", desc: "Auto-generated audit trail PDFs with accreditation-ready formatting and data" },
  { icon: BookCheck, title: "Automated Gradebook", desc: "Marks entry, rank lists, report cards, academic performance tracking — all in one place" },
  { icon: Flag, title: "Early Warning System", desc: "Red flag alerts for high failure-rate courses, at-risk students, and low-engagement sections" },
  { icon: PieChart, title: "Engagement Analytics", desc: "Cross-session trends, department-wide pulse data, and faculty performance benchmarks" },
  { icon: Award, title: "Faculty Monitoring", desc: "Track teaching hours, course load balance, and student feedback scores per faculty member" },
];

const implementationSteps = [
  { step: "1", title: "Pilot Setup", desc: "Install on 2-3 existing smart boards. Zero hardware cost — works with any Android/Windows board.", time: "Week 1" },
  { step: "2", title: "Faculty Training", desc: "30-minute onboarding per faculty. Walk-in mode means zero daily setup — just enter class and teach.", time: "Week 2" },
  { step: "3", title: "Student Onboarding", desc: "Students join via 6-digit class code on their phones. No app install needed — works in browser.", time: "Week 2" },
  { step: "4", title: "Live Sessions Begin", desc: "Faculty teaches normally. AI generates notes, tracks engagement, captures lectures automatically.", time: "Week 3" },
  { step: "5", title: "Analytics & Reports", desc: "Admin dashboard populates with real data — engagement trends, compliance reports, faculty insights.", time: "Week 4" },
  { step: "6", title: "Scale Decision", desc: "Review pilot data. Scale to entire institution with per-seat pricing that decreases with volume.", time: "Month 2" },
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
        <Icon className={`w-7 h-7 ${color}`} />
        <span className={`text-xs font-medium ${color} uppercase tracking-wider`}>Slide {slideNum} of {TOTAL_SLIDES}</span>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: "80ms" }}>
        {title}
      </h2>
      <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-3xl animate-fade-in" style={{ animationDelay: "160ms" }}>
        {subtitle}
      </p>
    </>
  );
}

/* ─── SLIDE 1: Hero ─── */
function SlideHero() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-1.5 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-300 font-medium">Your ₹15L smart boards are running as ₹5K projectors</span>
        </div>
      </div>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent leading-tight animate-fade-in" style={{ animationDelay: "100ms" }}>
        NewtonAI
      </h1>
      <p className="text-xl sm:text-2xl lg:text-3xl text-slate-300 mt-3 font-light animate-fade-in" style={{ animationDelay: "200ms" }}>
        The Classroom Operating System
      </p>
      <p className="text-base text-slate-400 mt-3 max-w-2xl animate-fade-in" style={{ animationDelay: "280ms" }}>
        Turn every smart board into an AI-powered teaching platform with real-time student engagement, automated notes, and institutional analytics — all from one screen.
      </p>

      <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-10 max-w-3xl w-full animate-fade-in" style={{ animationDelay: "400ms" }}>
        {[
          { icon: Monitor, label: "One Screen", sub: "Zero app-switching" },
          { icon: Activity, label: "Real-Time", sub: "Every student heard" },
          { icon: Brain, label: "15+ AI Tools", sub: "Built-in co-pilot" },
          { icon: Building2, label: "NAAC/NBA", sub: "Compliance ready" },
        ].map(({ icon: I, label, sub }) => (
          <div key={label} className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center">
            <I className="w-6 h-6 text-blue-400 mx-auto mb-1.5" />
            <p className="text-white font-semibold text-xs sm:text-sm">{label}</p>
            <p className="text-slate-500 text-[10px] sm:text-xs">{sub}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-8 animate-fade-in" style={{ animationDelay: "500ms" }}>
        For Universities • Colleges • Coaching Institutes • Schools with Smart Boards
      </p>
    </div>
  );
}

/* ─── SLIDE 2: Problem (Expanded) ─── */
function SlideProblem() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto w-full">
        <SlideHeader icon={AlertTriangle} color="text-red-400" slideNum={2} title="The ₹100 Crore Problem" subtitle="Indian institutions spend crores on smart boards and EdTech — but classrooms haven't changed." />

        {/* Big stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {problemStats.map((s, i) => (
            <div key={i} className="bg-red-500/5 border border-red-500/15 rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: `${240 + i * 100}ms` }}>
              <p className="text-2xl sm:text-3xl font-bold text-red-400">{s.stat}</p>
              <p className="text-xs text-slate-300 font-medium mt-1">{s.label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Problem cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
          {problemPoints.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${540 + i * 80}ms` }}>
              <div className="bg-white/5 border border-red-500/10 backdrop-blur-sm rounded-xl p-3 hover:bg-white/10 transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <f.icon className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-semibold text-white leading-tight">{f.title}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{f.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 3: Solution Overview ─── */
function SlideSolution() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={Sparkles} color="text-blue-400" slideNum={3} title="The NewtonAI Solution" subtitle="One platform that turns any smart board into a complete Classroom Operating System." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          {solutionPillars.map((p, i) => (
            <div key={p.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 120}ms` }}>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/10 transition-colors h-full">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} bg-opacity-20 flex items-center justify-center mb-3`} style={{ background: `linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))` }}>
                  <p.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white">{p.title}</h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center animate-fade-in" style={{ animationDelay: "750ms" }}>
          <p className="text-blue-300 text-sm font-medium">
            No new hardware needed — works on existing Android & Windows smart boards
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 4: Smart Board OS ─── */
function SlideSmartBoard() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto w-full">
        <SlideHeader icon={Monitor} color="text-blue-400" slideNum={4} title="Smart Board → Teaching OS" subtitle="The teacher walks in. The board is ready. No setup, no app-switching, no wasted minutes." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-7">
          {smartBoardFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 80}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
        <div className="mt-5 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center animate-fade-in" style={{ animationDelay: "800ms" }}>
          <p className="text-blue-300 text-xs font-medium">
            ⏱ Saves 10-15 minutes per class × 6 classes/day × 200 faculty = <span className="text-white font-bold">18,000+ teaching hours recovered/year</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 5: Real-Time Engagement ─── */
function SlideEngagement() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto w-full">
        <SlideHeader icon={Activity} color="text-green-400" slideNum={5} title="Every Student Participates" subtitle="In a 200-student lecture, every single student gets a voice — anonymously, in real-time, every 5 minutes." />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-7">
          {engagementFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 80}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "750ms" }}>
          {[
            { label: "Before NewtonAI", value: "3-5 students", sub: "participate per class", color: "text-red-400" },
            { label: "After NewtonAI", value: "100% students", sub: "participate every session", color: "text-green-400" },
            { label: "Result", value: "20× more", sub: "student interaction data", color: "text-blue-400" },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{item.label}</p>
              <p className={`text-lg font-bold ${item.color} mt-1`}>{item.value}</p>
              <p className="text-[10px] text-slate-400">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 6: AI Study Tools ─── */
function SlideAITools() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto w-full">
        <SlideHeader icon={Brain} color="text-purple-400" slideNum={6} title="AI Teaching & Study Co-Pilot" subtitle="15+ AI tools that work during and after class — auto-notes, quizzes, podcasts, mind maps, homework help, and more." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {aiToolsFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 60}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
        <div className="mt-5 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center animate-fade-in" style={{ animationDelay: "750ms" }}>
          <p className="text-purple-300 text-xs font-medium">
            🎯 Every student gets a personal AI tutor — no additional cost, no separate app
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 7: Institution Analytics ─── */
function SlideInstitution() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-6xl mx-auto w-full">
        <SlideHeader icon={Building2} color="text-cyan-400" slideNum={7} title="Institution Intelligence Dashboard" subtitle="Every session automatically generates actionable data for Dean, HOD, and accreditation bodies." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {institutionFeatures.map((f, i) => (
            <div key={f.title} className="animate-fade-in" style={{ animationDelay: `${240 + i * 60}ms` }}>
              <FeatureCard {...f} index={i} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 8: Before/After ─── */
function SlideBeforeAfter() {
  const comparisons = [
    { area: "Smart Board Usage", before: "PDF viewer + YouTube", after: "Full Classroom OS with whiteboard, recording, AI" },
    { area: "Student Participation", before: "3-5 students raise hands", after: "100% respond via Pulse, Questions, Concept Checks" },
    { area: "Attendance", before: "Paper register, 10 min/class", after: "Auto-marked via class join, instant" },
    { area: "Notes & Study Material", before: "Students photograph whiteboard", after: "AI-generated notes per slide, auto flashcards" },
    { area: "Faculty Analytics", before: "No data. Anecdotal feedback", after: "Engagement heatmaps, confusion spikes, session reports" },
    { area: "Accreditation Data", before: "Manual Excel compilation", after: "NAAC/NBA PDFs auto-generated from live data" },
  ];

  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={TrendingUp} color="text-amber-400" slideNum={8} title="Before vs After NewtonAI" subtitle="A side-by-side look at what changes when you activate the Classroom OS." />

        <div className="mt-6 space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 px-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold"></p>
            <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold text-center">Before</p>
            <p className="text-[10px] text-green-400 uppercase tracking-wider font-semibold text-center">After NewtonAI</p>
          </div>
          {comparisons.map((c, i) => (
            <div key={c.area} className="grid grid-cols-[1fr_1fr_1fr] gap-2 animate-fade-in" style={{ animationDelay: `${240 + i * 80}ms` }}>
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex items-center">
                <p className="text-xs text-white font-medium">{c.area}</p>
              </div>
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 flex items-center justify-center">
                <p className="text-[10px] text-slate-400 text-center">{c.before}</p>
              </div>
              <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2.5 flex items-center justify-center">
                <p className="text-[10px] text-green-300 text-center">{c.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 9: Implementation ─── */
function SlideImplementation() {
  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-5xl mx-auto w-full">
        <SlideHeader icon={Target} color="text-emerald-400" slideNum={9} title="Pilot Implementation Plan" subtitle="Zero hardware cost. 30-minute faculty training. Live in one week." />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-7">
          {implementationSteps.map((s, i) => (
            <div key={s.step} className="animate-fade-in" style={{ animationDelay: `${240 + i * 100}ms` }}>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/10 transition-colors h-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-400">{s.step}</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-medium">{s.time}</span>
                </div>
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center animate-fade-in" style={{ animationDelay: "850ms" }}>
          <p className="text-emerald-300 text-xs font-medium">
            🏫 Pilot: 2-3 departments • 10-15 faculty • 500-1000 students • 4 weeks to full data
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── SLIDE 10: CTA ─── */
function SlideCTA() {
  const impactMetrics = [
    { value: "100%", label: "Student Participation", desc: "Every student responds every session" },
    { value: "15+ min", label: "Teaching Time Saved", desc: "Per class, per faculty, per day" },
    { value: "Zero", label: "Manual Reports", desc: "All analytics auto-generated" },
  ];

  return (
    <div className="flex flex-col h-full justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-4xl mx-auto w-full text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300 font-medium">Slide {TOTAL_SLIDES} of {TOTAL_SLIDES}</span>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white animate-fade-in" style={{ animationDelay: "100ms" }}>
          Stop Buying Smart Boards.
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Start Building Smart Classrooms.</span>
        </h2>

        <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
          {impactMetrics.map((m) => (
            <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{m.value}</p>
              <p className="text-xs text-white font-medium mt-1">{m.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <div className="inline-block bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8">
            <p className="text-base sm:text-lg text-slate-300 mb-4">
              Request a <span className="text-white font-semibold">free pilot</span> for your institution
            </p>
            <Link to="/auth" className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg px-8 py-3 transition-colors text-sm">
              Schedule Pilot Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[10px] text-slate-500 mt-3">No hardware cost • Works on existing smart boards • 30-min setup</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── download helpers ─── */

const slideContent = [
  { title: "NewtonAI — The Classroom Operating System", subtitle: "Your ₹15L smart boards are running as ₹5K projectors", bullets: ["One Screen — Zero app-switching", "Real-Time — Every student heard", "15+ AI Tools — Built-in co-pilot", "NAAC/NBA Compliance Ready"] },
  { title: "The ₹100 Crore Problem", subtitle: "Institutions spend crores on EdTech but classrooms haven't changed.", bullets: problemPoints.map((p) => `${p.title}: ${p.desc}`) },
  { title: "The NewtonAI Solution", subtitle: "One platform that turns any smart board into a Classroom OS.", bullets: solutionPillars.map((p) => `${p.title}: ${p.desc}`) },
  { title: "Smart Board → Teaching OS", subtitle: "Teacher walks in, board is ready. Zero setup.", bullets: smartBoardFeatures.map((f) => `${f.title}: ${f.desc}`) },
  { title: "Every Student Participates", subtitle: "200-student lecture, every student gets a voice.", bullets: engagementFeatures.map((f) => `${f.title}: ${f.desc}`) },
  { title: "AI Teaching & Study Co-Pilot", subtitle: "15+ AI tools during and after class.", bullets: aiToolsFeatures.map((f) => `${f.title}: ${f.desc}`) },
  { title: "Institution Intelligence Dashboard", subtitle: "Actionable data for Dean, HOD, and accreditation.", bullets: institutionFeatures.map((f) => `${f.title}: ${f.desc}`) },
  { title: "Before vs After NewtonAI", subtitle: "Side-by-side comparison of classroom transformation.", bullets: ["Smart Board: PDF viewer → Full Classroom OS", "Participation: 3-5 students → 100%", "Analytics: None → Engagement heatmaps & reports", "Accreditation: Manual Excel → Auto NAAC/NBA PDFs"] },
  { title: "Pilot Implementation Plan", subtitle: "Zero hardware cost. 30-minute training. Live in one week.", bullets: implementationSteps.map((s) => `Step ${s.step} (${s.time}): ${s.title} — ${s.desc}`) },
  { title: "Stop Buying Smart Boards. Start Building Smart Classrooms.", subtitle: "Request a free pilot for your institution.", bullets: ["100% Student Participation every session", "15+ min teaching time saved per class", "Zero manual reports — all auto-generated", "No hardware cost — works on existing boards"] },
];

async function captureAllSlides(
  setSlide: (idx: number) => void,
  originalSlide: number
): Promise<string[]> {
  const html2canvas = (await import("html2canvas")).default;
  const images: string[] = [];

  for (let idx = 0; idx < TOTAL_SLIDES; idx++) {
    setSlide(idx);
    await new Promise((r) => setTimeout(r, 700));

    const slideEl = document.querySelector(`[data-slide-index="${idx}"]`) as HTMLElement | null;
    if (!slideEl) continue;

    const canvas = await html2canvas(slideEl, {
      scale: 2,
      backgroundColor: "#020617",
      useCORS: true,
      logging: false,
      width: slideEl.offsetWidth,
      height: slideEl.offsetHeight,
    });

    images.push(canvas.toDataURL("image/jpeg", 0.95));
  }

  setSlide(originalSlide);
  return images;
}

async function generatePDFFromImages(images: string[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720] });
  for (let i = 0; i < images.length; i++) {
    if (i > 0) doc.addPage([1280, 720], "landscape");
    doc.addImage(images[i], "JPEG", 0, 0, 1280, 720);
  }
  doc.save("NewtonAI-PitchDeck.pdf");
}

async function generatePPTXFromImages(images: string[]) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.author = "NewtonAI";
  pptx.title = "NewtonAI — The Classroom Operating System";
  images.forEach((imgData) => {
    const slide = pptx.addSlide();
    slide.addImage({ data: imgData, x: 0, y: 0, w: "100%", h: "100%" });
  });
  pptx.writeFile({ fileName: "NewtonAI-PitchDeck.pptx" });
}

/* ─── main component ─── */

const SLIDES = [SlideHero, SlideProblem, SlideSolution, SlideSmartBoard, SlideEngagement, SlideAITools, SlideInstitution, SlideBeforeAfter, SlideImplementation, SlideCTA];

export default function PitchDeck() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingPPTX, setGeneratingPPTX] = useState(false);
  const isExporting = generatingPDF || generatingPPTX;
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
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-50">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-blue-400 scale-125" : "bg-white/20 hover:bg-white/40"}`}
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
        <button
          onClick={async () => {
            setGeneratingPDF(true);
            try {
              const imgs = await captureAllSlides(setCurrent, current);
              await generatePDFFromImages(imgs);
            } finally { setGeneratingPDF(false); }
          }}
          disabled={isExporting}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Download PDF"
        >
          {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        </button>
        <button
          onClick={async () => {
            setGeneratingPPTX(true);
            try {
              const imgs = await captureAllSlides(setCurrent, current);
              await generatePPTXFromImages(imgs);
            } finally { setGeneratingPPTX(false); }
          }}
          disabled={isExporting}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors disabled:opacity-50"
          title="Download PPTX"
        >
          {generatingPPTX ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
