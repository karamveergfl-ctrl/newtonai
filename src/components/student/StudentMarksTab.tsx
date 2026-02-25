import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, TrendingUp, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  classId: string;
}

const gradeColors: Record<string, string> = {
  O: "bg-green-500/10 text-green-600 border-green-500/30",
  "A+": "bg-green-500/10 text-green-600 border-green-500/30",
  A: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  "B+": "bg-blue-500/10 text-blue-600 border-blue-500/30",
  B: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  C: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  D: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  F: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StudentMarksTab({ classId }: Props) {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, [classId]);

  const fetchMarks = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("student_marks")
      .select("*")
      .eq("class_id", classId)
      .eq("student_id", user.id);

    setMarks((data as any[]) || []);
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (marks.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No marks recorded yet for this class.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {marks.map((m) => {
        const components = [
          { name: "Assignment", value: m.assignment_marks || 0 },
          { name: "Attendance", value: m.attendance_marks || 0 },
          { name: "Midsem 1", value: m.midsem1 || 0 },
          { name: "Midsem 2", value: m.midsem2 || 0 },
          { name: "End Sem", value: m.endsem || 0 },
          { name: "Practical", value: m.practical_marks || 0 },
          { name: "Project", value: m.project_marks || 0 },
        ];

        const gradeClass = gradeColors[m.grade] || "bg-muted text-muted-foreground";

        return (
          <Card key={m.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  {m.academic_year || "Current"} {m.semester ? `— ${m.semester}` : ""}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {m.grade && (
                    <Badge className={`text-xs ${gradeClass}`}>{m.grade}</Badge>
                  )}
                  <Badge variant="secondary" className="text-xs font-bold">
                    Total: {m.total_marks ?? 0}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Score cards */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
                {components.map((c) => (
                  <div key={c.name} className="text-center p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{c.value}</p>
                    <p className="text-[10px] text-muted-foreground">{c.name}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={components}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
