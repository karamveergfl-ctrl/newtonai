import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import SEOHead from "@/components/SEOHead";
import { useTheme } from "next-themes";
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  User, 
  ChevronRight, 
  ChevronLeft,
  Check,
  Sparkles,
  MessageCircleQuestion,
  Camera,
  Sun,
  Moon,
  Monitor,
  Globe,
  Loader2
} from "lucide-react";

const educationLevels = [
  { id: "middle_school", label: "Middle School", icon: "📚" },
  { id: "high_school", label: "High School", icon: "🎒" },
  { id: "undergraduate", label: "Undergraduate", icon: "🎓" },
  { id: "graduate", label: "Graduate", icon: "📖" },
  { id: "professional", label: "Professional", icon: "💼" },
  { id: "other", label: "Other", icon: "✨" },
];

const subjects = [
  { id: "math", label: "Mathematics", icon: "📐" },
  { id: "physics", label: "Physics", icon: "⚛️" },
  { id: "chemistry", label: "Chemistry", icon: "🧪" },
  { id: "biology", label: "Biology", icon: "🧬" },
  { id: "computer_science", label: "Computer Science", icon: "💻" },
  { id: "economics", label: "Economics", icon: "📊" },
  { id: "history", label: "History", icon: "📜" },
  { id: "literature", label: "Literature", icon: "📖" },
  { id: "languages", label: "Languages", icon: "🌍" },
  { id: "psychology", label: "Psychology", icon: "🧠" },
  { id: "engineering", label: "Engineering", icon: "⚙️" },
  { id: "medicine", label: "Medicine", icon: "🏥" },
];

const studyGoals = [
  { id: "exam_prep", label: "Exam Preparation", description: "Ace your upcoming exams" },
  { id: "homework_help", label: "Homework Help", description: "Get help with assignments" },
  { id: "concept_learning", label: "Learn New Concepts", description: "Master new topics" },
  { id: "revision", label: "Revision & Review", description: "Reinforce what you know" },
  { id: "research", label: "Research", description: "Deep dive into topics" },
  { id: "skill_building", label: "Skill Building", description: "Develop new skills" },
];

const referralSources = [
  { id: "tiktok", label: "TikTok", icon: "🎵", description: "Saw it on TikTok" },
  { id: "youtube", label: "YouTube", icon: "▶️", description: "Saw a video or ad" },
  { id: "instagram", label: "Instagram", icon: "📸", description: "Found on Instagram" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", description: "Shared via WhatsApp" },
  { id: "friend", label: "Friend or Classmate", icon: "👥", description: "Someone recommended it" },
  { id: "other", label: "Other", icon: "✨", description: "Something else" },
];

const themeOptions = [
  { id: "light", label: "Light", icon: Sun, description: "Bright and clean" },
  { id: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
  { id: "system", label: "System", icon: Monitor, description: "Match your device" },
];

const languageOptions = [
  { id: "en", label: "English", flag: "🇺🇸" },
  { id: "es", label: "Español", flag: "🇪🇸" },
  { id: "fr", label: "Français", flag: "🇫🇷" },
  { id: "de", label: "Deutsch", flag: "🇩🇪" },
  { id: "hi", label: "हिंदी", flag: "🇮🇳" },
  { id: "zh", label: "中文", flag: "🇨🇳" },
  { id: "ja", label: "日本語", flag: "🇯🇵" },
  { id: "pt", label: "Português", flag: "🇧🇷" },
  { id: "ar", label: "العربية", flag: "🇸🇦" },
  { id: "ko", label: "한국어", flag: "🇰🇷" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
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
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
};

const iconVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: { 
    scale: 1, 
    rotate: 0,
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 15,
    }
  },
};

const checkmarkVariants = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 25,
    }
  },
  exit: { 
    scale: 0,
    transition: { duration: 0.15 }
  },
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    userRole: "student" as "student" | "teacher",
    fullName: "",
    educationLevel: "",
    subjects: [] as string[],
    studyGoals: [] as string[],
    referralSource: "",
    // Step 7 fields
    themePreference: "system",
    languagePreference: "en",
    avatarUrl: null as string | null,
  });

  const totalSteps = 7;
  
  // Auto-advance for single-selection steps
  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);
  
  // Auto-advance when role is selected (Step 0)
  useEffect(() => {
    if (step === 0 && formData.userRole && !isAutoAdvancing) {
      setIsAutoAdvancing(true);
      autoAdvanceTimerRef.current = setTimeout(() => {
        setDirection(1);
        setStep(1);
        setIsAutoAdvancing(false);
      }, 600);
    }
  }, [formData.userRole, step, isAutoAdvancing]);

  // Auto-advance when education level is selected (Step 2)
  useEffect(() => {
    if (step === 2 && formData.educationLevel && !isAutoAdvancing) {
      setIsAutoAdvancing(true);
      autoAdvanceTimerRef.current = setTimeout(() => {
        setDirection(1);
        setStep(3);
        setIsAutoAdvancing(false);
      }, 600);
    }
  }, [formData.educationLevel, step, isAutoAdvancing]);
  
  // Auto-advance when referral source is selected (Step 5)
  useEffect(() => {
    if (step === 5 && formData.referralSource && !isAutoAdvancing) {
      setIsAutoAdvancing(true);
      autoAdvanceTimerRef.current = setTimeout(() => {
        setDirection(1);
        setStep(6);
        setIsAutoAdvancing(false);
      }, 600);
    }
  }, [formData.referralSource, step, isAutoAdvancing]);
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_completed, full_name, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();

    // Handle stale session - user exists in JWT but not in database
    if (error || !profile) {
      console.warn("Stale session detected in Onboarding - signing out", error);
      await supabase.auth.signOut();
      navigate("/auth");
      return;
    }

    if (profile.onboarding_completed) {
      navigate("/dashboard");
      return;
    }

    if (profile.full_name) {
      setFormData(prev => ({ ...prev, fullName: profile.full_name || "" }));
    }
    if (profile.avatar_url) {
      setFormData(prev => ({ ...prev, avatarUrl: profile.avatar_url }));
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast.success('Avatar uploaded!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.fullName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 2 && !formData.educationLevel) {
      toast.error("Please select your education level");
      return;
    }
    if (step === 3 && formData.subjects.length === 0) {
      toast.error("Please select at least one subject");
      return;
    }
    if (step === 4 && formData.studyGoals.length === 0) {
      toast.error("Please select at least one study goal");
      return;
    }
    if (step === 5 && !formData.referralSource) {
      toast.error("Please select how you heard about us");
      return;
    }
    setDirection(1);
    setStep(step + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  const toggleSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(s => s !== subjectId)
        : [...prev.subjects, subjectId]
    }));
  };

  const toggleGoal = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      studyGoals: prev.studyGoals.includes(goalId)
        ? prev.studyGoals.filter(g => g !== goalId)
        : [...prev.studyGoals, goalId]
    }));
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Apply theme preference immediately
      setTheme(formData.themePreference);

      // Save role to user_roles table
      const roleToSave = formData.userRole === "teacher" ? "teacher" : "student";
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: session.user.id, role: roleToSave },
          { onConflict: "user_id,role" }
        );
      if (roleError) {
        console.warn("Failed to save role, continuing:", roleError);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          education_level: formData.educationLevel,
          subjects: formData.subjects,
          study_goals: formData.studyGoals,
          referral_source: formData.referralSource,
          theme_preference: formData.themePreference,
          language_preference: formData.languagePreference,
          avatar_url: formData.avatarUrl,
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      // Set flag for welcome modal on dashboard
      localStorage.setItem('newtonai_new_signup', 'true');
      
      toast.success("Welcome to NewtonAI! 🎉");
      // Route teachers to teacher dashboard, students to regular dashboard
      navigate(formData.userRole === "teacher" ? "/teacher" : "/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col overflow-hidden">
      <SEOHead
        title="Onboarding"
        description="Personalize your NewtonAI learning experience. Set up your profile, select subjects, and define your study goals."
        canonicalPath="/onboarding"
        noIndex={true}
      />
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <motion.header 
        className="p-4 md:p-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size="md" />
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-2" />
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full shadow-lg"
                style={{ left: `calc(${progress}% - 8px)` }}
                layoutId="progress-indicator"
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

          {/* Step Cards */}
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Role Selection */}
            {step === 0 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
                  <CardHeader className="text-center pb-2">
                    <motion.div 
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Sparkles className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CardTitle className="text-2xl md:text-3xl">How will you use NewtonAI?</CardTitle>
                      <CardDescription className="text-base mt-2">
                        Choose your role to get started
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        {
                          id: "student" as const,
                          icon: GraduationCap,
                          label: "Student",
                          description: "I want to learn and study",
                          emoji: "📚",
                        },
                        {
                          id: "teacher" as const,
                          icon: BookOpen,
                          label: "Teacher",
                          description: "I want to manage a classroom",
                          emoji: "🏫",
                        },
                      ].map((role, i) => (
                        <motion.button
                          key={role.id}
                          custom={i}
                          variants={cardItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => setFormData(prev => ({ ...prev, userRole: role.id }))}
                          className={`p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:scale-[1.02] relative ${
                            formData.userRole === role.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "border-border"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <AnimatePresence>
                            {formData.userRole === role.id && (
                              <motion.div 
                                className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                                variants={checkmarkVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                              >
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.span 
                            className="text-3xl mb-3 block"
                            animate={formData.userRole === role.id ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {role.emoji}
                          </motion.span>
                          <p className="font-semibold text-lg">{role.label}</p>
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                        </motion.button>
                      ))}
                    </div>
                    {isAutoAdvancing && formData.userRole && (
                      <motion.div 
                        className="flex items-center justify-center gap-2 mt-6 text-primary font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        Great choice!
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 1: Name */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
                  <CardHeader className="text-center pb-2">
                    <motion.div 
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <User className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CardTitle className="text-2xl md:text-3xl">What's your name?</CardTitle>
                      <CardDescription className="text-base mt-2">
                        Let's personalize your learning experience
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Input
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="text-lg h-14 text-center transition-all focus:scale-[1.02]"
                        autoFocus
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button 
                        onClick={handleNext} 
                        className="w-full mt-6 h-12 text-lg group"
                      >
                        Continue
                        <motion.span
                          className="ml-2"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <ChevronRight className="w-5 h-5" />
                        </motion.span>
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Education Level */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
                  <CardHeader className="text-center pb-2">
                    <motion.div 
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <GraduationCap className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CardTitle className="text-2xl md:text-3xl">What's your education level?</CardTitle>
                      <CardDescription className="text-base mt-2">
                        This helps us tailor content to your level
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {educationLevels.map((level, i) => (
                        <motion.button
                          key={level.id}
                          custom={i}
                          variants={cardItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => setFormData(prev => ({ ...prev, educationLevel: level.id }))}
                          className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:scale-[1.02] relative ${
                            formData.educationLevel === level.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "border-border"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Selection checkmark with animation */}
                          <AnimatePresence>
                            {formData.educationLevel === level.id && (
                              <motion.div 
                                className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              >
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.span 
                            className="text-2xl mb-2 block"
                            animate={formData.educationLevel === level.id ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {level.icon}
                          </motion.span>
                          <span className="font-medium">{level.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* Auto-advancing indicator or back button */}
                    <motion.div 
                      className="flex gap-3 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button variant="outline" onClick={handleBack} className="flex-1 h-12 group">
                        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                      </Button>
                      {isAutoAdvancing && formData.educationLevel ? (
                        <motion.div 
                          className="flex-1 h-12 flex items-center justify-center gap-2 text-primary font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="w-5 h-5" />
                          </motion.div>
                          Great choice!
                        </motion.div>
                      ) : (
                        <div className="flex-1 h-12 flex items-center justify-center text-sm text-muted-foreground">
                          Select an option to continue
                        </div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Subjects */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
                  <CardHeader className="text-center pb-2">
                    <motion.div 
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <BookOpen className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CardTitle className="text-2xl md:text-3xl">What subjects do you study?</CardTitle>
                      <CardDescription className="text-base mt-2">
                        Select all that apply
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {subjects.map((subject, i) => (
                        <motion.button
                          key={subject.id}
                          custom={i}
                          variants={cardItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => toggleSubject(subject.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:scale-[1.02] relative ${
                            formData.subjects.includes(subject.id)
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <AnimatePresence>
                            {formData.subjects.includes(subject.id) && (
                              <motion.div 
                                className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                                variants={checkmarkVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                              >
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.span 
                            className="text-2xl mb-2 block"
                            animate={formData.subjects.includes(subject.id) ? { rotate: [0, -10, 10, 0] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {subject.icon}
                          </motion.span>
                          <span className="font-medium text-sm">{subject.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    <motion.div 
                      className="flex gap-3 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button variant="outline" onClick={handleBack} className="flex-1 h-12 group">
                        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                      </Button>
                      <Button onClick={handleNext} className="flex-1 h-12 group">
                        Continue
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Study Goals */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
                  <CardHeader className="text-center pb-2">
                    <motion.div 
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Target className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CardTitle className="text-2xl md:text-3xl">What are your study goals?</CardTitle>
                      <CardDescription className="text-base mt-2">
                        We'll customize your experience based on your goals
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid gap-3">
                      {studyGoals.map((goal, i) => (
                        <motion.button
                          key={goal.id}
                          custom={i}
                          variants={cardItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => toggleGoal(goal.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:scale-[1.01] relative flex items-center gap-4 ${
                            formData.studyGoals.includes(goal.id)
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                          whileTap={{ scale: 0.99 }}
                        >
                          <motion.div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              formData.studyGoals.includes(goal.id)
                                ? "border-primary bg-primary"
                                : "border-muted-foreground"
                            }`}
                            animate={formData.studyGoals.includes(goal.id) ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.2 }}
                          >
                            <AnimatePresence>
                              {formData.studyGoals.includes(goal.id) && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Check className="w-4 h-4 text-primary-foreground" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                          <div>
                            <span className="font-medium block">{goal.label}</span>
                            <span className="text-sm text-muted-foreground">{goal.description}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    <motion.div 
                      className="flex gap-3 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button variant="outline" onClick={handleBack} className="flex-1 h-12 group">
                        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                      </Button>
                      <Button onClick={handleNext} className="flex-1 h-12 group">
                        Continue
                        <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 5: How did you hear about us */}
            {step === 5 && (
              <motion.div
                key="step5"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
                  <CardHeader className="text-center pb-2">
                    <motion.div 
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <MessageCircleQuestion className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CardTitle className="text-2xl md:text-3xl">How did you hear about us?</CardTitle>
                      <CardDescription className="text-base mt-2">
                        Help us understand how you found NewtonAI
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-3">
                      {referralSources.map((source, i) => (
                        <motion.button
                          key={source.id}
                          custom={i}
                          variants={cardItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => setFormData(prev => ({ ...prev, referralSource: source.id }))}
                          className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:scale-[1.02] relative ${
                            formData.referralSource === source.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                              : "border-border"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <AnimatePresence>
                            {formData.referralSource === source.id && (
                              <motion.div 
                                className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                              >
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <motion.span 
                            className="text-2xl mb-2 block"
                            animate={formData.referralSource === source.id ? { scale: [1, 1.3, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {source.icon}
                          </motion.span>
                          <span className="font-medium text-sm block">{source.label}</span>
                          <span className="text-xs text-muted-foreground">{source.description}</span>
                        </motion.button>
                      ))}
                    </div>
                    
                    {/* Auto-advancing indicator or back button */}
                    <motion.div 
                      className="flex gap-3 mt-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Button variant="outline" onClick={handleBack} className="flex-1 h-12 group">
                        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                      </Button>
                      {isAutoAdvancing && formData.referralSource ? (
                        <motion.div 
                          className="flex-1 h-12 flex items-center justify-center gap-2 text-primary font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="w-5 h-5" />
                          </motion.div>
                          Almost there!
                        </motion.div>
                      ) : (
                        <div className="flex-1 h-12 flex items-center justify-center text-sm text-muted-foreground">
                          Select an option to continue
                        </div>
                      )}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 6: Profile Customization (Optional) */}
            {step === 6 && (
              <motion.div
                key="step6"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <Card className="border-0 shadow-xl backdrop-blur-sm bg-card/95">
                  <CardHeader className="text-center pb-2">
                    <motion.div 
                      className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      variants={iconVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Sparkles className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <CardTitle className="text-2xl md:text-3xl">Customize Your Experience</CardTitle>
                      <CardDescription className="text-base mt-2">
                        Optional — You can always change these later
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Avatar Upload */}
                    <motion.div 
                      className="flex flex-col items-center gap-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="relative group">
                        <Avatar className="h-24 w-24 border-2 border-border">
                          <AvatarImage src={formData.avatarUrl || undefined} />
                          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {getInitials(formData.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                        >
                          {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground">Add a profile photo</span>
                    </motion.div>

                    {/* Theme Selection */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label className="text-sm font-medium mb-3 block">Theme Preference</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {themeOptions.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => setFormData(prev => ({ ...prev, themePreference: theme.id }))}
                            className={`p-3 rounded-xl border-2 text-center transition-all hover:border-primary/50 ${
                              formData.themePreference === theme.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                          >
                            <theme.icon className="w-5 h-5 mx-auto mb-1" />
                            <span className="text-sm font-medium">{theme.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Language Selection */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        AI Response Language
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-h-[150px] overflow-y-auto p-1">
                        {languageOptions.map((lang) => (
                          <button
                            key={lang.id}
                            onClick={() => setFormData(prev => ({ ...prev, languagePreference: lang.id }))}
                            className={`p-2 rounded-lg border-2 text-center transition-all hover:border-primary/50 ${
                              formData.languagePreference === lang.id
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                          >
                            <span className="text-lg">{lang.flag}</span>
                            <span className="text-xs block truncate">{lang.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    {/* Navigation Buttons */}
                    <motion.div 
                      className="flex gap-3 pt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Button variant="outline" onClick={handleBack} className="h-12 group">
                        <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={handleComplete}
                        className="h-12"
                        disabled={isLoading}
                      >
                        Skip
                      </Button>
                      <Button 
                        onClick={handleComplete}
                        className="flex-1 h-12 group relative overflow-hidden"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <>
                            Get Started
                            <motion.span
                              className="ml-2"
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </motion.span>
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
