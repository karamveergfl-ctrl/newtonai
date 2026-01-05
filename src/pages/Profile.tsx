import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, GraduationCap, Target, BookOpen, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const educationLevels = [
  { id: "middle_school", label: "Middle School", icon: "📚" },
  { id: "high_school", label: "High School", icon: "🎒" },
  { id: "undergraduate", label: "Undergraduate", icon: "🎓" },
  { id: "graduate", label: "Graduate", icon: "📖" },
  { id: "professional", label: "Professional", icon: "💼" },
];

const subjects = [
  { id: "mathematics", label: "Mathematics", icon: "🔢" },
  { id: "physics", label: "Physics", icon: "⚛️" },
  { id: "chemistry", label: "Chemistry", icon: "🧪" },
  { id: "biology", label: "Biology", icon: "🧬" },
  { id: "computer_science", label: "Computer Science", icon: "💻" },
  { id: "literature", label: "Literature", icon: "📝" },
  { id: "history", label: "History", icon: "🏛️" },
  { id: "economics", label: "Economics", icon: "📊" },
  { id: "languages", label: "Languages", icon: "🌍" },
  { id: "other", label: "Other", icon: "📂" },
];

const studyGoals = [
  { id: "improve_grades", label: "Improve Grades", icon: "📈" },
  { id: "exam_prep", label: "Exam Preparation", icon: "📝" },
  { id: "homework_help", label: "Homework Help", icon: "✏️" },
  { id: "concept_understanding", label: "Understand Concepts", icon: "💡" },
  { id: "skill_building", label: "Build Skills", icon: "🛠️" },
  { id: "research", label: "Research", icon: "🔬" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    education_level: "",
    subjects: [] as string[],
    study_goals: [] as string[],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        setFormData({
          full_name: profile.full_name || "",
          education_level: profile.education_level || "",
          subjects: profile.subjects || [],
          study_goals: profile.study_goals || [],
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [navigate, toast]);

  const toggleSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(s => s !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  const toggleGoal = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      study_goals: prev.study_goals.includes(goalId)
        ? prev.study_goals.filter(g => g !== goalId)
        : [...prev.study_goals, goalId],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        education_level: formData.education_level,
        subjects: formData.subjects,
        study_goals: formData.study_goals,
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Profile Settings</h1>
            <p className="text-muted-foreground">Update your study preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your name"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education Level */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <GraduationCap className="h-5 w-5 text-primary" />
                Education Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {educationLevels.map((level) => (
                  <motion.button
                    key={level.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFormData(prev => ({ ...prev, education_level: level.id }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      formData.education_level === level.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl block mb-2">{level.icon}</span>
                    <span className="text-sm font-medium">{level.label}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <BookOpen className="h-5 w-5 text-primary" />
                Subjects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {subjects.map((subject) => (
                  <motion.button
                    key={subject.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleSubject(subject.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      formData.subjects.includes(subject.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl block mb-2">{subject.icon}</span>
                    <span className="text-sm font-medium">{subject.label}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Target className="h-5 w-5 text-primary" />
                Study Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {studyGoals.map((goal) => (
                  <motion.button
                    key={goal.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-center",
                      formData.study_goals.includes(goal.id)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-2xl block mb-2">{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.label}</span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
