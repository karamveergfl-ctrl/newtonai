import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TeacherOnboarding from "@/components/onboarding/TeacherOnboarding";
import StudentOnboarding from "@/components/onboarding/StudentOnboarding";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import SEOHead from "@/components/SEOHead";
import {
  GraduationCap,
  BookOpen,
  Check,
  Sparkles,
} from "lucide-react";

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
    },
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
    },
  },
  exit: {
    scale: 0,
    transition: { duration: 0.15 },
  },
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    userRole: "" as "" | "student" | "teacher",
    fullName: "",
    avatarUrl: null as string | null,
  });

  // Cleanup auto-advance timer
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
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
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
        {/* Teacher Onboarding Branch */}
        {step >= 1 && formData.userRole === "teacher" ? (
          <TeacherOnboarding
            fullName={formData.fullName}
            avatarUrl={formData.avatarUrl}
            onBack={() => {
              setDirection(-1);
              setStep(0);
              setFormData(prev => ({ ...prev, userRole: "" as "" | "student" | "teacher" }));
            }}
          />
        ) : step >= 1 && formData.userRole === "student" ? (
          <StudentOnboarding
            fullName={formData.fullName}
            avatarUrl={formData.avatarUrl}
            onBack={() => {
              setDirection(-1);
              setStep(0);
              setFormData(prev => ({ ...prev, userRole: "" as "" | "student" | "teacher" }));
            }}
          />
        ) : (
          <div className="w-full max-w-2xl">
            {/* Step 0: Role Selection */}
            <AnimatePresence mode="wait" custom={direction}>
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
                            description: "Access AI study tools, flashcards, quizzes & more",
                            emoji: "📚",
                          },
                          {
                            id: "teacher" as const,
                            icon: BookOpen,
                            label: "Teacher",
                            description: "Create classes, assign work & track student progress",
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
                            className={`p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02] relative ${
                              formData.userRole === role.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]"
                                : "border-border hover:border-transparent hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5"
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
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default Onboarding;
