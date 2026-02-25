import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { GradeCalculator } from "@/components/institution/GradeCalculator";
import { RankListView } from "@/components/institution/RankListView";
import { ReportCardGenerator } from "@/components/institution/ReportCardGenerator";

function ResultProcessingContent() {
  const { institution, loading } = useInstitution();
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Fetch courses for institution
  const { data: courses } = useQuery({
    queryKey: ["inst-courses", institution?.id],
    queryFn: async () => {
      const { data: depts } = await supabase
        .from("departments")
        .select("id")
        .eq("institution_id", institution!.id);
      if (!depts?.length) return [];
      const { data } = await supabase
        .from("courses")
        .select("id, course_name, course_code, department_id")
        .in("department_id", depts.map((d) => d.id));
      return data || [];
    },
    enabled: !!institution?.id,
  });

  // Fetch classes linked to selected course
  const { data: classes } = useQuery({
    queryKey: ["inst-classes", selectedCourseId],
    queryFn: async () => {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("course_id", selectedCourseId);
      return data || [];
    },
    enabled: !!selectedCourseId,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedClass = classes?.find((c) => c.id === selectedClassId);
  const selectedCourse = courses?.find((c) => c.id === selectedCourseId);

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold">Result Processing</h1>
        <p className="text-sm text-muted-foreground">{institution?.name} · Grades, Ranks & Reports</p>
      </div>

      {/* Selectors */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Course</Label>
              <Select value={selectedCourseId} onValueChange={(v) => { setSelectedCourseId(v); setSelectedClassId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.course_name} {c.course_code && `(${c.course_code})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={!selectedCourseId}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && selectedCourseId && (
        <Tabs defaultValue="grades" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grades">Grades</TabsTrigger>
            <TabsTrigger value="ranks">Rank List</TabsTrigger>
            <TabsTrigger value="reports">Report Cards</TabsTrigger>
          </TabsList>

          <TabsContent value="grades">
            <GradeCalculator classId={selectedClassId} className={selectedClass?.name || ""} />
          </TabsContent>

          <TabsContent value="ranks">
            <RankListView
              classId={selectedClassId}
              courseId={selectedCourseId}
              className={selectedClass?.name || ""}
              courseName={selectedCourse?.course_name || ""}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportCardGenerator
              classId={selectedClassId}
              courseId={selectedCourseId}
              className={selectedClass?.name || ""}
              courseName={selectedCourse?.course_name || ""}
              institutionName={institution?.name || ""}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

export default function ResultProcessingPage() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <ResultProcessingContent />
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
