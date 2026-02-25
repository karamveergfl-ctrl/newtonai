import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  BookOpen,
  Brain,
  Zap,
  Target,
  GraduationCap,
  MessageCircleQuestion,
  BarChart3,
  FileText,
  Rocket,
  Video,
  Headphones,
  PenTool,
  Users,
  Loader2,
} from "lucide-react";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
};

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 15 },
  },
};

const checkmarkVariants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: { type: "spring" as const, stiffness: 500, damping: 25 },
  },
  exit: { scale: 0, transition: { duration: 0.15 } },
};

const streams = [
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "commerce", label: "Commerce", emoji: "📈" },
  { id: "arts", label: "Arts", emoji: "🎨" },
  { id: "engineering", label: "Engineering", emoji: "⚙️" },
  { id: "medical", label: "Medical", emoji: "🏥" },
  { id: "other", label: "Other", emoji: "✨" },
];

const subjectOptions = [
  { id: "math", label: "Mathematics", icon: "📐" },
  { id: "physics", label: "Physics", icon: "⚛️" },
  { id: "chemistry", label: "Chemistry", icon: "🧪" },
  { id: "biology", label: "Biology", icon: "🧬" },
  { id: "computer_science", label: "Computer Science", icon: "💻" },
  { id: "economics", label: "Economics", icon: "📊" },
  { id: "history", label: "History", icon: "📜" },
  { id: "english", label: "English", icon: "📖" },
  { id: "psychology", label: "Psychology", icon: "🧠" },
  { id: "engineering", label: "Engineering", icon: "⚙️" },
  { id: "medicine", label: "Medicine", icon: "🏥" },
  { id: "accounting", label: "Accounting", icon: "🧮" },
];

const learningStyles = [
  { id: "videos", label: "Videos", emoji: "🎬", icon: Video },
  { id: "notes", label: "Notes & Reading", emoji: "📝", icon: FileText },
  { id: "practice", label: "Practice Questions", emoji: "✍️", icon: PenTool },
  { id: "visual", label: "Visual Mind Maps", emoji: "🗺️", icon: Brain },
  { id: "listening", label: "Listening (Podcasts)", emoji: "🎧", icon: Headphones },
];

const studyGoalOptions = [
  { id: "exam_prep", label: "Exam Preparation", emoji: "📝", description: "Ace your upcoming exams" },
  { id: "understanding", label: "Better Understanding", emoji: "💡", description: "Deep conceptual clarity" },
  { id: "improve_grades", label: "Improve Grades", emoji: "📈", description: "Boost your academic performance" },
  { id: "competitive", label: "Competitive Exams", emoji: "🏆", description: "JEE, NEET, GATE & more" },
  { id: "daily_revision", label: "Daily Revision", emoji: "🔄", description: "Stay consistent every day" },
];

interface StudentOnboardingProps {
  fullName: string;
  avatarUrl: string | null;
  onBack: () => void;
}

export default function StudentOnboarding({ fullName: initialName, avatarUrl, onBack }: StudentOnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Step 1 - Profile
  const [fullName, setFullName] = useState(initialName);
  const [classSemester, setClassSemester] = useState("");
  const [stream, setStream] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  // Step 2 - Join class
  const [classChoice, setClassChoice] = useState<"join" | "solo" | "">("");
  const [classCode, setClassCode] = useState("");
  const [joiningClass, setJoiningClass] = useState(false);
  const [classJoined, setClassJoined] = useState(false);
  const [joinedClassName, setJoinedClassName] = useState("");

  // Step 3 - Learning style
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // Step 5 - Study goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // Auto-advance on stream select (step 1) only if name is filled
  useEffect(() => {
    if (step === 1 && stream && !isAutoAdvancing && fullName.trim() && selectedSubjects.length > 0) {
      // Don't auto-advance step 1 since it has multiple fields
    }
  }, [stream, step, isAutoAdvancing, fullName]);

  // Auto-advance on class choice when "solo" selected (step 2)
  useEffect(() => {
    if (step === 2 && classChoice === "solo" && !isAutoAdvancing) {
      setIsAutoAdvancing(true);
      autoAdvanceRef.current = setTimeout(() => {
        setDirection(1);
        setStep(3);
        setIsAutoAdvancing(false);
      }, 600);
    }
  }, [classChoice, step, isAutoAdvancing]);

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) { toast.error("Please enter your name"); return; }
      if (selectedSubjects.length === 0) { toast.error("Please select at least one subject"); return; }
    }
    if (step === 2 && !classChoice) { toast.error("Please choose an option"); return; }
    if (step === 3 && selectedStyles.length === 0) { toast.error("Please select how you learn best"); return; }
    if (step === 5 && selectedGoals.length === 0) { toast.error("Please select at least one goal"); return; }
    setDirection(1);
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) { onBack(); return; }
    setDirection(-1);
    setStep(step - 1);
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjects(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleStyle = (id: string) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals(prev =>
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleJoinClass = async () => {
    if (!classCode.trim()) { toast.error("Please enter a class code"); return; }
    setJoiningClass(true);
    try {
      const { data, error } = await supabase.rpc("join_class_by_code", { p_code: classCode.trim() });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        setClassJoined(true);
        setJoinedClassName(result.class_name || "Your class");
        toast.success(`Joined ${result.class_name || "class"} successfully!`);
      } else {
        toast.error(result?.error || "Invalid class code");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to join class");
    } finally {
      setJoiningClass(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Save student role
      await supabase.from("user_roles").upsert(
        { user_id: session.user.id, role: "student" as const },
        { onConflict: "user_id,role" }
      );

      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          education_level: stream || null,
          subjects: selectedSubjects,
          study_goals: selectedGoals,
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      localStorage.setItem("newtonai_new_signup", "true");
      localStorage.setItem("newtonai_learning_styles", JSON.stringify(selectedStyles));

      toast.success("Welcome to NewtonAI! 🎉");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      // ──── Step 1: Profile ────
      case 1:
        return (
          <motion.div key="s-step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <User className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">Tell Us About Your Studies</CardTitle>
                <CardDescription className="text-base mt-2">Quick setup — takes 30 seconds</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="h-12" autoFocus />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Class / Semester / Year</label>
                  <Input value={classSemester} onChange={(e) => setClassSemester(e.target.value)} placeholder="e.g. B.Tech Sem 4, Class 12" className="h-12" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Stream</label>
                  <div className="grid grid-cols-3 gap-2">
                    {streams.map((s, i) => (
                      <motion.button
                        key={s.id}
                        custom={i}
                        variants={cardItemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => setStream(s.id)}
                        className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-[1.02] relative ${
                          stream === s.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/20"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatePresence>
                          {stream === s.id && (
                            <motion.div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                              <Check className="w-2.5 h-2.5 text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-lg">{s.emoji}</span>
                        <p className="font-medium text-xs mt-1">{s.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Subjects <span className="text-muted-foreground">(select all)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {subjectOptions.map((sub) => (
                      <motion.button
                        key={sub.id}
                        onClick={() => toggleSubject(sub.id)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                          selectedSubjects.includes(sub.id)
                            ? "border-primary bg-primary/10 text-primary font-medium"
                            : "border-border text-muted-foreground hover:border-primary/30"
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {sub.icon} {sub.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        );

      // ──── Step 2: Join Class ────
      case 2:
        return (
          <motion.div key="s-step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <Users className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">Are you joining a class?</CardTitle>
                <CardDescription className="text-base mt-2">Connect with your teacher's classroom or study solo</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {!classJoined ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <motion.button
                        custom={0}
                        variants={cardItemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => setClassChoice("join")}
                        className={`p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02] relative ${
                          classChoice === "join"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/20"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatePresence>
                          {classChoice === "join" && (
                            <motion.div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-3xl mb-2 block">🔗</span>
                        <p className="font-semibold">Enter Class Code</p>
                        <p className="text-sm text-muted-foreground mt-1">My teacher gave me a code</p>
                      </motion.button>
                      <motion.button
                        custom={1}
                        variants={cardItemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => setClassChoice("solo")}
                        className={`p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02] relative ${
                          classChoice === "solo"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/20"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatePresence>
                          {classChoice === "solo" && (
                            <motion.div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                              <Check className="w-4 h-4 text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-3xl mb-2 block">🚀</span>
                        <p className="font-semibold">Skip for Now</p>
                        <p className="text-sm text-muted-foreground mt-1">Solo study mode</p>
                      </motion.button>
                    </div>

                    {classChoice === "join" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                        <Input
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                          placeholder="Enter class code (e.g. ABC123)"
                          className="h-12 text-center text-lg tracking-widest font-mono"
                          maxLength={10}
                        />
                        <Button onClick={handleJoinClass} disabled={joiningClass || !classCode.trim()} className="w-full h-12">
                          {joiningClass ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Joining...</> : "Join Class"}
                        </Button>
                      </motion.div>
                    )}

                    {isAutoAdvancing && classChoice === "solo" && (
                      <motion.div className="flex items-center justify-center gap-2 mt-4 text-primary font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Sparkles className="w-5 h-5 animate-spin" /> Let's go!
                      </motion.div>
                    )}
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-4">
                    <motion.div
                      className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </motion.div>
                    <div>
                      <p className="text-xl font-bold text-foreground">Class Joined!</p>
                      <p className="text-muted-foreground mt-1">You're now part of <span className="font-medium text-foreground">{joinedClassName}</span></p>
                    </div>
                    <p className="text-sm text-muted-foreground">Live notes, attendance & AI tools are now connected.</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      // ──── Step 3: Learning Style ────
      case 3:
        return (
          <motion.div key="s-step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <Brain className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">How do you learn best?</CardTitle>
                <CardDescription className="text-base mt-2">Select all that apply — AI will adapt to you</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {learningStyles.map((style, i) => {
                    const Icon = style.icon;
                    return (
                      <motion.button
                        key={style.id}
                        custom={i}
                        variants={cardItemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => toggleStyle(style.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] relative flex items-center gap-3 ${
                          selectedStyles.includes(style.id)
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/20"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatePresence>
                          {selectedStyles.includes(style.id) && (
                            <motion.div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-2xl">{style.emoji}</span>
                        <div>
                          <p className="font-semibold text-sm">{style.label}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      // ──── Step 4: AI Assistant Intro ────
      case 4:
        return (
          <motion.div key="s-step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">Meet Your AI Study Partner</CardTitle>
                <CardDescription className="text-base mt-2">NewtonAI adapts to how you learn</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: MessageCircleQuestion, label: "Solve Doubts Instantly", desc: "Ask any question, get clear answers", color: "text-blue-500" },
                    { icon: FileText, label: "Auto-Generate Notes", desc: "AI creates study notes from lectures", color: "text-green-500" },
                    { icon: Zap, label: "Smart Quizzes", desc: "Practice with AI-generated questions", color: "text-amber-500" },
                    { icon: BarChart3, label: "Track Performance", desc: "See your progress and weak areas", color: "text-purple-500" },
                  ].map((feature, i) => (
                    <motion.div
                      key={feature.label}
                      custom={i}
                      variants={cardItemVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-4 rounded-xl border border-border bg-muted/30 flex items-start gap-3"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 ${feature.color}`}>
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{feature.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{feature.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-center"
                >
                  <p className="text-sm text-muted-foreground">
                    🤝 <span className="font-medium text-foreground">AI assists you, never replaces your learning.</span>
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        );

      // ──── Step 5: Study Goals ────
      case 5:
        return (
          <motion.div key="s-step5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <Target className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">What are your goals?</CardTitle>
                <CardDescription className="text-base mt-2">AI personalization starts here</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {studyGoalOptions.map((goal, i) => (
                    <motion.button
                      key={goal.id}
                      custom={i}
                      variants={cardItemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => toggleGoal(goal.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] relative flex items-center gap-3 ${
                        selectedGoals.includes(goal.id)
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border hover:border-primary/20"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <AnimatePresence>
                        {selectedGoals.includes(goal.id) && (
                          <motion.div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <span className="text-2xl">{goal.emoji}</span>
                      <div>
                        <p className="font-semibold text-sm">{goal.label}</p>
                        <p className="text-xs text-muted-foreground">{goal.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      // ──── Step 6: Success ────
      case 6:
        return (
          <motion.div key="s-step6" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-4">
                <motion.div
                  className="text-6xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  🚀
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">You're Ready to Learn Smarter!</CardTitle>
                <CardDescription className="text-base mt-2">Your AI study assistant is activated</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: Users, label: "Join Class", desc: "Connect with teachers", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                    { icon: FileText, label: "Upload Notes", desc: "AI-powered summaries", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
                    { icon: Zap, label: "Start Quiz", desc: "Practice instantly", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                    { icon: MessageCircleQuestion, label: "Ask AI", desc: "Solve any doubt", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
                  ].map((action, i) => (
                    <motion.div
                      key={action.label}
                      custom={i}
                      variants={cardItemVariants}
                      initial="hidden"
                      animate="visible"
                      className={`p-4 rounded-xl border border-border text-center ${action.color}`}
                    >
                      <action.icon className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold text-sm">{action.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{action.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center mb-4"
                >
                  <p className="text-sm">🏅 <span className="font-medium text-foreground">First Study Badge earned!</span> Start studying to build your streak.</p>
                </motion.div>

                <Button onClick={handleComplete} disabled={isLoading} className="w-full h-12 text-lg">
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Setting up...</>
                  ) : (
                    <>Get Started <Rocket className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return fullName.trim() && selectedSubjects.length > 0;
      case 2: return classChoice !== "" && (classChoice === "solo" || classJoined);
      case 3: return selectedStyles.length > 0;
      case 4: return true;
      case 5: return selectedGoals.length > 0;
      default: return false;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {/* Progress */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="relative">
          <Progress value={progress} className="h-2" />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg"
            style={{ left: `calc(${progress}% - 8px)` }}
            layoutId="student-progress"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.div
              className="absolute inset-0 bg-primary rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ opacity: 0.4 }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={direction}>
        {renderStep()}
      </AnimatePresence>

      {/* Navigation Buttons */}
      {step < 6 && (
        <motion.div className="flex gap-3 mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Button variant="outline" onClick={handleBack} className="flex-1 h-12 group">
            <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
          {step === 4 ? (
            <Button onClick={handleNext} className="flex-1 h-12 group">
              Activate Assistant
              <Sparkles className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()} className="flex-1 h-12 group">
              Continue
              <motion.span className="ml-2" animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <ChevronRight className="w-5 h-5" />
              </motion.span>
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
