import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  student_id: string;
  status: string;
  auto_marked: boolean;
  participation_score: number;
  student_name?: string;
}

interface Props {
  classId: string;
  sessionId?: string;
}

export function AttendanceManager({ classId, sessionId }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [enrollments, setEnrollments] = useState<{ student_id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [classId, sessionId]);

  const fetchData = async () => {
    // Fetch enrolled students
    const { data: enrolled } = await supabase
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classId)
      .eq("status", "active");

    if (enrolled) {
      const profiles = await Promise.all(
        enrolled.map(async (e) => {
          const { data: p } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", e.student_id)
            .maybeSingle();
          return { student_id: e.student_id, full_name: p?.full_name || "Unknown" };
        })
      );
      setEnrollments(profiles);
    }

    // Fetch attendance if session provided
    if (sessionId) {
      const { data: att } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("session_id", sessionId)
        .eq("class_id", classId);
      setRecords((att as any[]) || []);
    }

    setLoading(false);
  };

  const toggleStatus = async (studentId: string, newStatus: string) => {
    if (!sessionId) return;
    setSaving(studentId);

    const existing = records.find((r) => r.student_id === studentId);

    if (existing) {
      await supabase
        .from("attendance_records")
        .update({ status: newStatus, auto_marked: false } as any)
        .eq("id", existing.id);
    } else {
      await supabase.from("attendance_records").insert({
        session_id: sessionId,
        student_id: studentId,
        class_id: classId,
        status: newStatus,
        auto_marked: false,
      } as any);
    }

    await fetchData();
    setSaving(null);
    toast.success(`Marked ${newStatus}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Select or start a live session to manage attendance.</p>
        </CardContent>
      </Card>
    );
  }

  const presentCount = records.filter((r) => r.status === "present").length;
  const absentCount = enrollments.length - presentCount - records.filter((r) => r.status === "late").length;
  const lateCount = records.filter((r) => r.status === "late").length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50">
          <CardContent className="py-3 text-center">
            <p className="text-lg font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 text-center">
            <p className="text-lg font-bold text-destructive">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-3 text-center">
            <p className="text-lg font-bold text-amber-500">{lateCount}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent>
        </Card>
      </div>

      {/* Student list */}
      <div className="space-y-2">
        {enrollments.map((student) => {
          const record = records.find((r) => r.student_id === student.student_id);
          const status = record?.status || "absent";
          const isAutoMarked = record?.auto_marked;

          return (
            <Card key={student.student_id} className="border-border/50">
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {student.full_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{student.full_name}</p>
                    <div className="flex items-center gap-1.5">
                      {isAutoMarked && (
                        <Badge variant="outline" className="text-[10px] h-4 gap-0.5">
                          <Zap className="h-2.5 w-2.5" /> Auto
                        </Badge>
                      )}
                      {record?.participation_score ? (
                        <span className="text-[10px] text-muted-foreground">
                          Score: {record.participation_score}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {saving === student.student_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant={status === "present" ? "default" : "outline"}
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => toggleStatus(student.student_id, "present")}
                      >
                        <CheckCircle2 className="h-3 w-3" /> P
                      </Button>
                      <Button
                        size="sm"
                        variant={status === "late" ? "default" : "outline"}
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => toggleStatus(student.student_id, "late")}
                      >
                        <Clock className="h-3 w-3" /> L
                      </Button>
                      <Button
                        size="sm"
                        variant={status === "absent" ? "destructive" : "outline"}
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => toggleStatus(student.student_id, "absent")}
                      >
                        <XCircle className="h-3 w-3" /> A
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
