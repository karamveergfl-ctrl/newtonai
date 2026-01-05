import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  User, 
  ChevronRight, 
  ChevronLeft,
  Check
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

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    educationLevel: "",
    subjects: [] as string[],
    studyGoals: [] as string[],
  });

  const totalSteps = 4;
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

    // Check if onboarding is already completed
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, full_name")
      .eq("id", session.user.id)
      .single();

    if (profile?.onboarding_completed) {
      navigate("/");
      return;
    }

    if (profile?.full_name) {
      setFormData(prev => ({ ...prev, fullName: profile.full_name || "" }));
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
    setStep(step + 1);
  };

  const handleBack = () => {
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
    if (formData.studyGoals.length === 0) {
      toast.error("Please select at least one study goal");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          education_level: formData.educationLevel,
          subjects: formData.subjects,
          study_goals: formData.studyGoals,
          onboarding_completed: true,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      toast.success("Welcome to StudySmart! 🎉");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6">
        <Logo size="md" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step 1: Name */}
          {step === 1 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">What's your name?</CardTitle>
                <CardDescription className="text-base">
                  Let's personalize your learning experience
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Input
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className="text-lg h-14 text-center"
                  autoFocus
                />
                <Button 
                  onClick={handleNext} 
                  className="w-full mt-6 h-12 text-lg"
                >
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Education Level */}
          {step === 2 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">What's your education level?</CardTitle>
                <CardDescription className="text-base">
                  This helps us tailor content to your level
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {educationLevels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setFormData(prev => ({ ...prev, educationLevel: level.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 ${
                        formData.educationLevel === level.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{level.icon}</span>
                      <span className="font-medium">{level.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={handleBack} className="flex-1 h-12">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12">
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Subjects */}
          {step === 3 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">What subjects do you study?</CardTitle>
                <CardDescription className="text-base">
                  Select all that apply
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {subjects.map((subject) => (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 relative ${
                        formData.subjects.includes(subject.id)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      {formData.subjects.includes(subject.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <span className="text-2xl mb-2 block">{subject.icon}</span>
                      <span className="font-medium text-sm">{subject.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={handleBack} className="flex-1 h-12">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1 h-12">
                    Continue
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Study Goals */}
          {step === 4 && (
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-2xl md:text-3xl">What are your study goals?</CardTitle>
                <CardDescription className="text-base">
                  We'll customize your experience based on your goals
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3">
                  {studyGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 relative flex items-center gap-4 ${
                        formData.studyGoals.includes(goal.id)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        formData.studyGoals.includes(goal.id)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      }`}>
                        {formData.studyGoals.includes(goal.id) && (
                          <Check className="w-4 h-4 text-primary-foreground" />
                        )}
                      </div>
                      <div>
                        <span className="font-medium block">{goal.label}</span>
                        <span className="text-sm text-muted-foreground">{goal.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={handleBack} className="flex-1 h-12">
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                  </Button>
                  <Button 
                    onClick={handleComplete} 
                    className="flex-1 h-12"
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Get Started"}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
