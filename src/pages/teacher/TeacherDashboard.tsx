import { useClasses } from "@/hooks/useClasses";
import { CreateClassDialog } from "@/components/teacher/CreateClassDialog";
import { ClassCard } from "@/components/teacher/ClassCard";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, GraduationCap, Users, FileText, BarChart3 } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

const TeacherDashboard = () => {
  const { classes, loading, createClass } = useClasses();

  const totalStudents = classes.reduce((acc, cls) => acc + (cls.student_count || 0), 0);

  return (
    <AppLayout>
      <SEOHead title="Teacher Dashboard" description="Manage your classes and assignments" noIndex />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your classes and students</p>
          </div>
          <CreateClassDialog onCreateClass={createClass} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Classes", value: classes.length, icon: GraduationCap },
            { label: "Students", value: totalStudents, icon: Users },
            { label: "Active", value: classes.filter(c => c.is_active).length, icon: FileText },
            { label: "Total", value: classes.length, icon: BarChart3 },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No classes yet</h2>
              <p className="text-muted-foreground mb-6">Create your first class to get started</p>
              <CreateClassDialog onCreateClass={createClass} />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <ClassCard key={cls.id} classData={cls} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TeacherDashboard;
