import { motion } from "framer-motion";
import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import newtonCharacter from "@/assets/newton-character-sm.webp";
import { Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const subjectColors: Record<string, string> = {
  math: "border-l-blue-500",
  mathematics: "border-l-blue-500",
  physics: "border-l-cyan-500",
  science: "border-l-teal-500",
  chemistry: "border-l-emerald-500",
  biology: "border-l-green-500",
  english: "border-l-amber-500",
  default: "border-l-primary",
};

function getSubjectBorder(subject: string | null): string {
  if (!subject) return subjectColors.default;
  const key = subject.toLowerCase();
  for (const [k, v] of Object.entries(subjectColors)) {
    if (key.includes(k)) return v;
  }
  return subjectColors.default;
}

const StudentClasses = () => {
  const { classes, loading } = useClasses();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <SEOHead title="My Classes" description="View your enrolled classes" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Standardized Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <GraduationCap className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-1">Your enrolled courses</p>
        </div>

        <div className="flex justify-center mb-6">
          <Button onClick={() => navigate("/join-class")} className="gap-2">
            <Plus className="h-4 w-4" />
            Join a Class
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="text-center py-16 border-border/50">
            <CardContent>
              <img src={newtonCharacter} alt="Newton" className="h-24 w-24 mx-auto mb-4 opacity-80" />
              <h2 className="text-xl font-semibold mb-2">No classes yet</h2>
              <p className="text-muted-foreground mb-6">Ask your teacher for an invite code to get started</p>
              <Button onClick={() => navigate("/join-class")} className="gap-2">
                <Plus className="h-4 w-4" />
                Join a Class
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {classes.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={cn(
                    "cursor-pointer interactive-card group border-l-4 overflow-hidden",
                    getSubjectBorder(cls.subject)
                  )}
                  onClick={() => navigate(`/student/class/${cls.id}`)}
                >
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold text-lg">{cls.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {cls.subject && <Badge variant="secondary" className="text-xs">{cls.subject}</Badge>}
                        {cls.academic_year && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BookOpen className="h-3 w-3" />
                            {cls.academic_year}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentClasses;
