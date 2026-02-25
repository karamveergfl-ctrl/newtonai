import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface StudentMark {
  student_id: string;
  student_name: string;
  assignment_marks: number;
  attendance_marks: number;
  midsem1: number | null;
  midsem2: number | null;
  endsem: number | null;
  practical_marks: number | null;
  project_marks: number | null;
  grade: string;
}

interface Props {
  classId: string;
  courseId?: string;
}

const GRADE_OPTIONS = ["O", "A+", "A", "B+", "B", "C", "D", "F", "AB"];

export function MarksEntryPanel({ classId, courseId }: Props) {
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMarks();
  }, [classId, courseId]);

  const fetchMarks = async () => {
    setLoading(true);

    // Get enrolled students
    const { data: enrolled } = await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classId)
      .eq("status", "active");

    if (!enrolled) { setLoading(false); return; }

    const studentIds = enrolled.map((e) => e.student_id);

    // Get profiles
    const profiles: Record<string, string> = {};
    await Promise.all(
      studentIds.map(async (sid) => {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", sid).maybeSingle();
        profiles[sid] = p?.full_name || "Unknown";
      })
    );

    // Get existing marks
    let existingMarks: any[] = [];
    if (courseId) {
      const { data } = await supabase
        .from("student_marks")
        .select("*")
        .eq("class_id", classId)
        .eq("course_id", courseId);
      existingMarks = (data as any[]) || [];
    }

    const combined: StudentMark[] = studentIds.map((sid) => {
      const existing = existingMarks.find((m: any) => m.student_id === sid);
      return {
        student_id: sid,
        student_name: profiles[sid],
        assignment_marks: existing?.assignment_marks ?? 0,
        attendance_marks: existing?.attendance_marks ?? 0,
        midsem1: existing?.midsem1 ?? null,
        midsem2: existing?.midsem2 ?? null,
        endsem: existing?.endsem ?? null,
        practical_marks: existing?.practical_marks ?? null,
        project_marks: existing?.project_marks ?? null,
        grade: existing?.grade ?? "",
      };
    });

    setMarks(combined.sort((a, b) => a.student_name.localeCompare(b.student_name)));
    setLoading(false);
  };

  const updateField = (studentId: string, field: keyof StudentMark, value: string) => {
    setMarks((prev) =>
      prev.map((m) =>
        m.student_id === studentId
          ? { ...m, [field]: field === "grade" ? value : value === "" ? null : Number(value) }
          : m
      )
    );
  };

  const calcTotal = (m: StudentMark) =>
    (m.assignment_marks || 0) +
    (m.attendance_marks || 0) +
    (m.midsem1 || 0) +
    (m.midsem2 || 0) +
    (m.endsem || 0) +
    (m.practical_marks || 0) +
    (m.project_marks || 0);

  const handleSave = async () => {
    if (!courseId) { toast.error("Please select a course first"); return; }
    setSaving(true);

    const payload = marks.map((m) => ({
      student_id: m.student_id,
      course_id: courseId,
      class_id: classId,
      assignment_marks: m.assignment_marks,
      attendance_marks: m.attendance_marks,
      midsem1: m.midsem1,
      midsem2: m.midsem2,
      endsem: m.endsem,
      practical_marks: m.practical_marks,
      project_marks: m.project_marks,
      grade: m.grade || null,
    }));

    const { data, error } = await supabase.rpc("bulk_upsert_student_marks", {
      p_marks: payload,
    } as any);

    setSaving(false);

    if (error) {
      toast.error("Failed to save marks");
      console.error(error);
    } else {
      toast.success(`Saved marks for ${marks.length} students`);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!courseId) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Select a course to enter marks.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Marks
        </Button>
      </div>

      <div className="overflow-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[140px]">Student</TableHead>
              <TableHead className="min-w-[80px]">Assign.</TableHead>
              <TableHead className="min-w-[80px]">Attend.</TableHead>
              <TableHead className="min-w-[80px]">Mid 1</TableHead>
              <TableHead className="min-w-[80px]">Mid 2</TableHead>
              <TableHead className="min-w-[80px]">End</TableHead>
              <TableHead className="min-w-[80px]">Practical</TableHead>
              <TableHead className="min-w-[80px]">Project</TableHead>
              <TableHead className="min-w-[70px]">Total</TableHead>
              <TableHead className="min-w-[90px]">Grade</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marks.map((m) => (
              <TableRow key={m.student_id}>
                <TableCell className="font-medium text-sm">{m.student_name}</TableCell>
                {(["assignment_marks", "attendance_marks", "midsem1", "midsem2", "endsem", "practical_marks", "project_marks"] as const).map((field) => (
                  <TableCell key={field}>
                    <Input
                      type="number"
                      className="h-8 w-16 text-xs"
                      value={m[field] ?? ""}
                      onChange={(e) => updateField(m.student_id, field, e.target.value)}
                    />
                  </TableCell>
                ))}
                <TableCell className="font-bold text-sm">{calcTotal(m)}</TableCell>
                <TableCell>
                  <Select value={m.grade} onValueChange={(v) => updateField(m.student_id, "grade", v)}>
                    <SelectTrigger className="h-8 w-20 text-xs">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
