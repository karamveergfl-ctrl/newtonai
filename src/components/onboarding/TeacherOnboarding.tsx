import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  Monitor,
  BookOpen,
  Copy,
  Share2,
  Zap,
  Brain,
  MessageCircleQuestion,
  BarChart3,
  FileText,
  Rocket,
  Presentation,
  Users,
  Tablet,
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

const classLevels = [
  { id: "school", label: "School", emoji: "🏫" },
  { id: "college", label: "College", emoji: "🎓" },
  { id: "coaching", label: "Coaching Institute", emoji: "📖" },
  { id: "university", label: "University", emoji: "🏛️" },
];

const institutionTypes = [
  { id: "university", label: "University" },
  { id: "college", label: "College" },
  { id: "school_cbse", label: "School (CBSE)" },
  { id: "school_icse", label: "School (ICSE)" },
  { id: "school_state", label: "School (State Board)" },
  { id: "coaching", label: "Coaching Centre" },
  { id: "independent", label: "Independent Tutor" },
];

const gradeLevels = [
  { id: "1-5", label: "Grade 1–5" },
  { id: "6-8", label: "Grade 6–8" },
  { id: "9-10", label: "Grade 9–10" },
  { id: "11-12", label: "Grade 11–12" },
  { id: "ug", label: "Undergraduate" },
  { id: "pg", label: "Postgraduate" },
];

const teachingStyles = [
  { id: "smartboard", label: "Smartboard / Digital Board", emoji: "🖥️" },
  { id: "traditional", label: "Traditional Board + PDF", emoji: "📝" },
  { id: "presentations", label: "Mostly Presentations", emoji: "📊" },
  { id: "hybrid", label: "Hybrid Teaching", emoji: "🔄" },
];

const subjectChips = [
  "Physics", "Mathematics", "Chemistry", "Biology",
  "Computer Science", "Electronics", "English", "Economics",
  "History", "Psychology", "Engineering", "Medicine",
];

const marksTrackingOptions = [
  { id: "excel", label: "Excel Sheets", emoji: "📊" },
  { id: "lms", label: "LMS Software", emoji: "💻" },
  { id: "manual", label: "Manual Register", emoji: "📒" },
  { id: "new_digital", label: "New to Digital", emoji: "✨" },
];

const STYLE_CONFIG: Record<string, { smartboard: boolean; autoNotes: boolean; autoAttendance: boolean }> = {
  smartboard: { smartboard: true, autoNotes: true, autoAttendance: true },
  traditional: { smartboard: false, autoNotes: true, autoAttendance: false },
  presentations: { smartboard: true, autoNotes: false, autoAttendance: false },
  hybrid: { smartboard: true, autoNotes: true, autoAttendance: false },
};

interface TeacherOnboardingProps {
  fullName: string;
  avatarUrl: string | null;
  onBack: () => void;
}

export default function TeacherOnboarding({ fullName: initialName, avatarUrl, onBack }: TeacherOnboardingProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Step 1 - Profile
  const [fullName, setFullName] = useState(initialName);
  const [institutionName, setInstitutionName] = useState("");
  const [department, setDepartment] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);

  // Step 2 - Teaching style
  const [teachingStyle, setTeachingStyle] = useState("");

  // Step 3 - Class creation
  const [className, setClassName] = useState("");
  const [classSubject, setClassSubject] = useState("");
  const [classSemester, setClassSemester] = useState("");
  const [studentCount, setStudentCount] = useState(40);
  const [createdClassCode, setCreatedClassCode] = useState("");
  const [classCreated, setClassCreated] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);

  // Step 4 - Smartboard
  const [smartboardEnabled, setSmartboardEnabled] = useState(true);
  const [autoNotes, setAutoNotes] = useState(true);
  const [autoAttendance, setAutoAttendance] = useState(true);

  // Step 6 - Marks tracking
  const [marksTracking, setMarksTracking] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");

  const totalSteps = 7;
  const progress = (step / totalSteps) * 100;

  // Device detection
  const deviceInfo = useMemo(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const touch = navigator.maxTouchPoints > 0;
    const category = w >= 1920 ? "Desktop" : w >= 1024 ? "Laptop" : "Tablet";
    return { width: w, height: h, touch, category, resolution: `${window.screen.width}×${window.screen.height}` };
  }, []);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    };
  }, []);

  // Auto-advance on class level select (step 1)
  useEffect(() => {
    if (step === 1 && classLevel && !isAutoAdvancing && fullName.trim()) {
      setIsAutoAdvancing(true);
      autoAdvanceRef.current = setTimeout(() => {
        setDirection(1);
        setStep(2);
        setIsAutoAdvancing(false);
      }, 600);
    }
  }, [classLevel, step, isAutoAdvancing, fullName]);

  // Auto-advance on teaching style select (step 2)
  useEffect(() => {
    if (step === 2 && teachingStyle && !isAutoAdvancing) {
      const defaults = STYLE_CONFIG[teachingStyle] || STYLE_CONFIG.hybrid;
      setSmartboardEnabled(defaults.smartboard);
      setAutoNotes(defaults.autoNotes);
      setAutoAttendance(defaults.autoAttendance);
      setIsAutoAdvancing(true);
      autoAdvanceRef.current = setTimeout(() => {
        setDirection(1);
        setStep(3);
        setIsAutoAdvancing(false);
      }, 600);
    }
  }, [teachingStyle, step, isAutoAdvancing]);

  // Auto-advance on marks tracking select (step 6)
  useEffect(() => {
    if (step === 6 && marksTracking && !isAutoAdvancing) {
      setIsAutoAdvancing(true);
      autoAdvanceRef.current = setTimeout(() => {
        setDirection(1);
        setStep(7);
        setIsAutoAdvancing(false);
      }, 600);
    }
  }, [marksTracking, step, isAutoAdvancing]);

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) { toast.error("Please enter your name"); return; }
    }
    if (step === 3 && !classCreated) {
      if (!className.trim()) { toast.error("Please enter a class name"); return; }
    }
    setDirection(1);
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) { onBack(); return; }
    setDirection(-1);
    setStep(step - 1);
  };

  const handleCreateClass = async () => {
    if (!className.trim()) { toast.error("Enter a class name"); return; }
    setCreatingClass(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: newClass, error } = await supabase
        .from("classes")
        .insert({
          name: className,
          subject: classSubject || null,
          description: classSemester ? `${classSemester}` : null,
          teacher_id: user.id,
        })
        .select("invite_code")
        .single();
      if (error) throw error;
      setCreatedClassCode(newClass.invite_code);
      setClassCreated(true);
      toast.success("Class created!");
    } catch (e: any) {
      toast.error(e.message || "Failed to create class");
    } finally {
      setCreatingClass(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdClassCode);
    toast.success("Code copied!");
  };

  const shareWhatsApp = () => {
    const text = `Join my class on NewtonAI! Use code: ${createdClassCode}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Save teacher role
      await supabase.from("user_roles").upsert(
        { user_id: session.user.id, role: "teacher" as const },
        { onConflict: "user_id,role" }
      );

      const teacherPreferences = {
        institution_name: institutionName,
        institution_type: institutionType,
        department,
        class_level: classLevel,
        teaching_style: teachingStyle,
        smartboard_enabled: smartboardEnabled,
        auto_lecture_notes: autoNotes,
        auto_attendance: autoAttendance,
        marks_tracking: marksTracking,
        institution_code: institutionCode || null,
        faculty_id: facultyId || null,
        phone: phone || null,
        grade_levels: selectedGrades,
      };

      await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          onboarding_completed: true,
          teacher_preferences: teacherPreferences,
        } as any)
        .eq("id", session.user.id);

      // Set localStorage for smartboard
      localStorage.setItem("newtonai_smartboard_enabled", String(smartboardEnabled));
      localStorage.setItem("newtonai_new_signup", "true");

      toast.success("Welcome to NewtonAI! 🚀");
      navigate("/teacher");
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="t-step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <User className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">Let's Set Up Your Teaching Profile</CardTitle>
                <CardDescription className="text-base mt-2">Quick setup — takes 30 seconds</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" className="h-12" autoFocus />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone Number</label>
                  <Input value={phone} onChange={(e) => {
                    let v = e.target.value.replace(/[^\d+\s]/g, "");
                    if (v && !v.startsWith("+91")) v = "+91 " + v.replace(/^\+?91?\s?/, "");
                    setPhone(v);
                  }} placeholder="+91 98765 43210" className="h-12" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Institution Type</label>
                  <select
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    className="w-full h-12 rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select type...</option>
                    {institutionTypes.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Institution Name</label>
                  <Input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="e.g. MIT, Delhi University" className="h-12" />
                </motion.div>
                {institutionType && institutionType !== "independent" && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Faculty / Employee ID</label>
                    <Input value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="e.g. FAC-2024-001" className="h-12" />
                  </motion.div>
                )}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Department / Subject</label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Physics, Computer Science" className="h-12" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Grade Levels You Teach</label>
                  <div className="flex flex-wrap gap-2">
                    {gradeLevels.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGrades((prev) =>
                          prev.includes(g.id) ? prev.filter((x) => x !== g.id) : [...prev, g.id]
                        )}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          selectedGrades.includes(g.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/40 text-foreground"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Class Level</label>
                  <div className="grid grid-cols-2 gap-3">
                    {classLevels.map((lvl, i) => (
                      <motion.button
                        key={lvl.id}
                        custom={i}
                        variants={cardItemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => setClassLevel(lvl.id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] relative ${
                          classLevel === lvl.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                            : "border-border hover:border-primary/20"
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <AnimatePresence>
                          {classLevel === lvl.id && (
                            <motion.div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="text-xl">{lvl.emoji}</span>
                        <p className="font-medium text-sm mt-1">{lvl.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
                {isAutoAdvancing && classLevel && (
                  <motion.div className="flex items-center justify-center gap-2 mt-4 text-primary font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Sparkles className="w-5 h-5 animate-spin" /> Great!
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="t-step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <Presentation className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">How do you usually teach?</CardTitle>
                <CardDescription className="text-base mt-2">This helps us configure the right tools for you</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teachingStyles.map((style, i) => (
                    <motion.button
                      key={style.id}
                      custom={i}
                      variants={cardItemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => setTeachingStyle(style.id)}
                      className={`p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02] relative ${
                        teachingStyle === style.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border hover:border-primary/20"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <AnimatePresence>
                        {teachingStyle === style.id && (
                          <motion.div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <span className="text-3xl mb-2 block">{style.emoji}</span>
                      <p className="font-semibold">{style.label}</p>
                    </motion.button>
                  ))}
                </div>
                {isAutoAdvancing && teachingStyle && (
                  <motion.div className="flex items-center justify-center gap-2 mt-6 text-primary font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Sparkles className="w-5 h-5 animate-spin" /> Perfect setup!
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="t-step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <BookOpen className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">Create Your First Class</CardTitle>
                <CardDescription className="text-base mt-2">Students will use a code to join</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {!classCreated ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Class Name</label>
                      <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. Physics B.Tech Sem 2" className="h-12" autoFocus />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {subjectChips.slice(0, 8).map((s) => (
                          <button
                            key={s}
                            onClick={() => setClassSubject(s)}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                              classSubject === s
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:border-primary/40 text-foreground"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <Input value={classSubject} onChange={(e) => setClassSubject(e.target.value)} placeholder="Or type your subject" className="h-10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Semester / Grade</label>
                      <Input value={classSemester} onChange={(e) => setClassSemester(e.target.value)} placeholder="e.g. Semester 2, Grade 10" className="h-10" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Approximate Students: {studentCount}</label>
                      <Slider value={[studentCount]} onValueChange={(v) => setStudentCount(v[0])} min={10} max={200} step={5} className="mt-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>10</span><span>200</span>
                      </div>
                    </div>
                    <Button onClick={handleCreateClass} disabled={creatingClass || !className.trim()} className="w-full h-12 text-lg">
                      {creatingClass ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</> : "Create Class"}
                    </Button>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-lg font-semibold text-foreground">Class Created!</p>
                    <div className="bg-muted rounded-xl p-6">
                      <p className="text-sm text-muted-foreground mb-2">Share this code with students</p>
                      <p className="text-4xl font-mono font-bold tracking-[0.3em] text-primary">{createdClassCode}</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" size="sm" onClick={copyCode}>
                        <Copy className="w-4 h-4 mr-2" /> Copy Code
                      </Button>
                      <Button variant="outline" size="sm" onClick={shareWhatsApp}>
                        <Share2 className="w-4 h-4 mr-2" /> WhatsApp
                      </Button>
                    </div>
                    <Button onClick={handleNext} className="w-full h-12 text-lg mt-4">
                      Continue <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="t-step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <Monitor className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">Optimize for Classroom Teaching</CardTitle>
                <CardDescription className="text-base mt-2">Configure your smartboard and automation</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                {/* Device Info */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-muted/50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    {deviceInfo.touch ? <Tablet className="w-5 h-5 text-primary" /> : <Monitor className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{deviceInfo.category} Detected</p>
                    <p className="text-xs text-muted-foreground">{deviceInfo.resolution} • Touch: {deviceInfo.touch ? "Yes" : "No"}</p>
                  </div>
                </motion.div>

                {/* Toggles */}
                {[
                  { label: "Smartboard Mode", desc: "Full-screen presentation optimized for projectors", value: smartboardEnabled, set: setSmartboardEnabled, icon: Monitor },
                  { label: "Auto Lecture Notes", desc: "AI generates notes from your slides automatically", value: autoNotes, set: setAutoNotes, icon: FileText },
                  { label: "Auto Attendance", desc: "Track student participation in live sessions", value: autoAttendance, set: setAutoAttendance, icon: Users },
                ].map((toggle, i) => (
                  <motion.div
                    key={toggle.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                        <toggle.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{toggle.label}</p>
                        <p className="text-xs text-muted-foreground">{toggle.desc}</p>
                      </div>
                    </div>
                    <Switch checked={toggle.value} onCheckedChange={toggle.set} />
                  </motion.div>
                ))}

                <Button onClick={handleNext} className="w-full h-12 text-lg mt-2">
                  Continue <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="t-step5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <Brain className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">Your AI Teaching Assistant Is Ready</CardTitle>
                <CardDescription className="text-base mt-2">AI assists you, never replaces you</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { icon: Zap, label: "Generate quizzes instantly", color: "text-accent" },
                    { icon: FileText, label: "Make notes automatically", color: "text-primary" },
                    { icon: MessageCircleQuestion, label: "Answer student doubts", color: "text-secondary" },
                    { icon: BarChart3, label: "Track performance", color: "text-primary" },
                  ].map((cap, i) => (
                    <motion.div
                      key={cap.label}
                      custom={i}
                      variants={cardItemVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-4 rounded-xl border border-border text-center hover:border-primary/20 transition-colors"
                    >
                      <cap.icon className={`w-8 h-8 mx-auto mb-2 ${cap.color}`} />
                      <p className="text-sm font-medium text-foreground">{cap.label}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center mb-6">
                  <p className="text-sm text-foreground font-medium">🤝 AI assists, not replaces.</p>
                  <p className="text-xs text-muted-foreground mt-1">You stay in control of your classroom. AI is just your sidekick.</p>
                </motion.div>
                <Button onClick={handleNext} className="w-full h-12 text-lg">
                  <Sparkles className="w-5 h-5 mr-2" /> Activate Assistant
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="t-step6" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4" variants={iconVariants} initial="initial" animate="animate">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </motion.div>
                <CardTitle className="text-2xl md:text-3xl">How do you track marks?</CardTitle>
                <CardDescription className="text-base mt-2">We'll set up your records dashboard accordingly</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {marksTrackingOptions.map((opt, i) => (
                    <motion.button
                      key={opt.id}
                      custom={i}
                      variants={cardItemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={() => setMarksTracking(opt.id)}
                      className={`p-5 rounded-xl border-2 text-left transition-all hover:scale-[1.02] relative ${
                        marksTracking === opt.id
                          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                          : "border-border hover:border-primary/20"
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <AnimatePresence>
                        {marksTracking === opt.id && (
                          <motion.div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center" variants={checkmarkVariants} initial="initial" animate="animate" exit="exit">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <span className="text-2xl mb-2 block">{opt.emoji}</span>
                      <p className="font-medium text-sm">{opt.label}</p>
                    </motion.button>
                  ))}
                </div>
                {/* Institution code */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5">
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Institution Code (optional)</label>
                  <Input value={institutionCode} onChange={(e) => setInstitutionCode(e.target.value)} placeholder="Enter code if part of an institution" className="h-10" />
                </motion.div>
                <Button variant="ghost" onClick={() => { setDirection(1); setStep(7); }} className="w-full mt-3 text-muted-foreground">
                  Skip this step →
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      case 7:
        return (
          <motion.div key="t-step7" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
              <CardHeader className="text-center pb-2">
                <motion.div
                  className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12 }}
                >
                  <Rocket className="w-10 h-10 text-primary" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <CardTitle className="text-2xl md:text-3xl">You're Ready to Teach Smarter 🚀</CardTitle>
                  <CardDescription className="text-base mt-2">Your classroom is set up. Let's go!</CardDescription>
                </motion.div>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Sparkles animation */}
                <div className="relative mb-6">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-primary rounded-full"
                      style={{ left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 25}%` }}
                      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -20, -40] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { icon: Presentation, label: "Start Live Class", desc: "Begin teaching now" },
                    { icon: FileText, label: "Add Material", desc: "Upload slides or PDFs" },
                    { icon: Users, label: "Invite Students", desc: createdClassCode ? `Code: ${createdClassCode}` : "Share join code" },
                    { icon: Monitor, label: "Try Smartboard", desc: "Full-screen mode" },
                  ].map((action, i) => (
                    <motion.div
                      key={action.label}
                      custom={i}
                      variants={cardItemVariants}
                      initial="hidden"
                      animate="visible"
                      className="p-4 rounded-xl border border-border hover:border-primary/20 transition-all hover:bg-primary/5 cursor-pointer text-center"
                    >
                      <action.icon className="w-7 h-7 text-primary mx-auto mb-2" />
                      <p className="font-semibold text-sm text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </motion.div>
                  ))}
                </div>

                <Button onClick={handleComplete} disabled={isLoading} className="w-full h-12 text-lg">
                  {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Finishing...</> : <>Get Started <ChevronRight className="w-5 h-5 ml-2" /></>}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );

      default:
        return null;
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
            layoutId="teacher-progress-indicator"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <motion.div className="absolute inset-0 bg-primary rounded-full" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ opacity: 0.4 }} />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait" custom={direction}>
        {renderStepContent()}
      </AnimatePresence>

      {/* Back button — not on step 7 */}
      {step < 7 && step !== 3 && (
        <motion.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </motion.div>
      )}
      {step === 3 && !classCreated && (
        <motion.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Button variant="ghost" onClick={handleBack} className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </motion.div>
      )}
    </div>
  );
}
