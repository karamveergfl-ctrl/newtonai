import { useState } from "react";
import { motion } from "framer-motion";
import { useClasses } from "@/hooks/useClasses";
import { CreateClassDialog } from "@/components/teacher/CreateClassDialog";
import { ClassCard } from "@/components/teacher/ClassCard";
import { QuickActions } from "@/components/teacher/QuickActions";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, GraduationCap, Users, FileText, BarChart3 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import newtonCharacter from "@/assets/newton-character-sm.webp";

const TeacherDashboard = () => {
  const { classes, loading, createClass } = useClasses();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.student_count || 0), 0);

  const stats = [
    { label: "Classes", value: classes.length, icon: GraduationCap, color: "text-primary" },
    { label: "Students", value: totalStudents, icon: Users, color: "text-secondary" },
    { label: "Active", value: classes.filter(c => c.is_active).length, icon: FileText, color: "text-accent" },
    { label: "Total", value: classes.length, icon: BarChart3, color: "text-primary" },
  ];

  return (
    <AppLayout>
      <SEOHead title="Teacher Dashboard" description="Manage your classes and assignments" noIndex />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Standardized Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <GraduationCap className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your classes and students</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="interactive-card border-border/50 overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions onCreateClass={() => setCreateDialogOpen(true)} />
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="text-center py-16 border-border/50">
            <CardContent>
              <img src={newtonCharacter} alt="Newton" className="h-24 w-24 mx-auto mb-4 opacity-80" />
              <h2 className="text-xl font-semibold mb-2">No classes yet</h2>
              <p className="text-muted-foreground mb-6">Create your first class to get started</p>
              <CreateClassDialog onCreateClass={createClass} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls, i) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ClassCard classData={cls} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Floating Create Class Dialog */}
        <CreateClassDialog onCreateClass={createClass} externalOpen={createDialogOpen} onExternalOpenChange={setCreateDialogOpen} />
      </div>
    </AppLayout>
  );
};

export default TeacherDashboard;
