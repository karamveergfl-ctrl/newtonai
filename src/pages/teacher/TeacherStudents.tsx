import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Users, Search, GraduationCap } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

interface StudentRow {
  id: string;
  full_name: string;
  classes: string[];
  enrollment_count: number;
}

const TeacherStudents = () => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Get teacher's classes
      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id);

      if (!classes || classes.length === 0) { setLoading(false); return; }

      const classIds = classes.map(c => c.id);
      const classNameMap = new Map(classes.map(c => [c.id, c.name]));

      // Get enrollments
      const { data: enrollments } = await supabase
        .from("class_enrollments")
        .select("student_id, class_id")
        .in("class_id", classIds)
        .eq("status", "active");

      if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

      // Group by student
      const studentClasses: Record<string, string[]> = {};
      enrollments.forEach(e => {
        if (!studentClasses[e.student_id]) studentClasses[e.student_id] = [];
        const className = classNameMap.get(e.class_id);
        if (className) studentClasses[e.student_id].push(className);
      });

      const studentIds = Object.keys(studentClasses);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", studentIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name || "Unknown"]));

      const rows: StudentRow[] = studentIds.map(sid => ({
        id: sid,
        full_name: profileMap.get(sid) || "Unknown",
        classes: studentClasses[sid],
        enrollment_count: studentClasses[sid].length,
      }));

      rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
      setStudents(rows);
      setLoading(false);
    };
    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.classes.some(c => c.toLowerCase().includes(q))
    );
  }, [students, search]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Students" description="Manage your students" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">{students.length} students across your classes</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students or classes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <Card className="border-border/50 text-center py-12">
            <CardContent>
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{search ? "No students match your search" : "No students enrolled yet"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className="border-border/50">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {s.full_name[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.full_name}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {s.classes.map(c => (
                            <Badge key={c} variant="secondary" className="text-[9px] h-4">{c}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span className="text-xs">{s.enrollment_count}</span>
                    </div>
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

export default TeacherStudents;
