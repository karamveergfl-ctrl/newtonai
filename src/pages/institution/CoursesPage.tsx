import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { BookOpen, Plus, Loader2, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Course {
  id: string;
  course_name: string;
  course_code: string | null;
  semester: string | null;
  academic_year: string | null;
  department_id: string;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
}

function CoursesContent() {
  const navigate = useNavigate();
  const { institution, loading } = useInstitution();
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [fetching, setFetching] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ course_name: "", course_code: "", department_id: "", semester: "", academic_year: "" });

  const fetchData = async () => {
    if (!institution) return;
    const { data: depts } = await supabase
      .from("departments")
      .select("id, name")
      .eq("institution_id", institution.id);
    setDepartments((depts as Department[]) || []);

    const deptIds = (depts || []).map(d => d.id);
    if (deptIds.length > 0) {
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .in("department_id", deptIds)
        .order("created_at", { ascending: false });
      setCourses((coursesData as Course[]) || []);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (institution) fetchData();
  }, [institution]);

  const handleCreate = async () => {
    if (!form.course_name.trim() || !form.department_id) return;
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("courses").insert({
      department_id: form.department_id,
      course_name: form.course_name.trim(),
      course_code: form.course_code.trim() || null,
      semester: form.semester.trim() || null,
      academic_year: form.academic_year.trim() || null,
      teacher_id: user!.id,
    });
    if (error) {
      toast.error("Failed to create course");
    } else {
      toast.success("Course created");
      setForm({ course_name: "", course_code: "", department_id: "", semester: "", academic_year: "" });
      setDialogOpen(false);
      fetchData();
    }
    setCreating(false);
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/institution")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Courses</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={departments.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Select value={form.department_id} onValueChange={(v) => setForm(f => ({ ...f, department_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Course name *" value={form.course_name} onChange={(e) => setForm(f => ({ ...f, course_name: e.target.value }))} />
              <Input placeholder="Course code (optional)" value={form.course_code} onChange={(e) => setForm(f => ({ ...f, course_code: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Semester" value={form.semester} onChange={(e) => setForm(f => ({ ...f, semester: e.target.value }))} />
                <Input placeholder="Academic year" value={form.academic_year} onChange={(e) => setForm(f => ({ ...f, academic_year: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreate} disabled={creating || !form.course_name.trim() || !form.department_id}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {departments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Create departments first before adding courses.</p>
          <Button variant="link" onClick={() => navigate("/institution/departments")}>Go to Departments</Button>
        </div>
      )}

      {courses.length === 0 && departments.length > 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4" />
          <p>No courses yet. Create your first course.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle className="text-lg">{course.course_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {course.course_code && <p className="text-sm font-mono text-muted-foreground">{course.course_code}</p>}
                {course.semester && <p className="text-sm text-muted-foreground">Semester: {course.semester}</p>}
                {course.academic_year && <p className="text-sm text-muted-foreground">Year: {course.academic_year}</p>}
                <p className="text-xs text-muted-foreground">
                  Dept: {departments.find(d => d.id === course.department_id)?.name || "—"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <CoursesContent />
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
