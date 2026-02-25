import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { AppLayout } from "@/components/AppLayout";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportButton } from "@/components/admin/ExportButton";
import { Loader2, Search, GraduationCap, TrendingUp, Award } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(142, 76%, 36%)",
  "hsl(48, 96%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(262, 83%, 58%)",
  "hsl(199, 89%, 48%)",
  "hsl(25, 95%, 53%)",
  "hsl(var(--accent))",
];

const AcademicRecordsPage = () => {
  const { institution, loading: instLoading } = useInstitution();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!institution?.id) return;
    fetchSummary();
  }, [institution?.id]);

  const fetchSummary = async () => {
    const { data, error } = await supabase.rpc("get_institution_marks_summary", {
      p_institution_id: institution!.id,
    } as any);

    if (error) {
      console.error(error);
    } else {
      setSummary(data);
    }
    setLoading(false);
  };

  if (instLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const records: any[] = summary?.records || [];
  const gradeDistribution = summary?.grade_distribution
    ? Object.entries(summary.grade_distribution).map(([name, value]) => ({ name, value: value as number }))
    : [];

  const filteredRecords = records.filter((r: any) =>
    !search ||
    r.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.course_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.department?.toLowerCase().includes(search.toLowerCase())
  );

  const exportColumns = [
    { key: "student_name", header: "Student" },
    { key: "course_name", header: "Course" },
    { key: "course_code", header: "Code" },
    { key: "department", header: "Department" },
    { key: "class_name", header: "Class" },
    { key: "assignment_marks", header: "Assignment" },
    { key: "attendance_marks", header: "Attendance" },
    { key: "midsem1", header: "Midsem 1" },
    { key: "midsem2", header: "Midsem 2" },
    { key: "endsem", header: "End Sem" },
    { key: "practical_marks", header: "Practical" },
    { key: "project_marks", header: "Project" },
    { key: "total_marks", header: "Total" },
    { key: "grade", header: "Grade" },
    { key: "academic_year", header: "Year" },
    { key: "semester", header: "Semester" },
  ];

  return (
    <AppLayout>
      <SEOHead title="Academic Records" description="Institution academic records overview" noIndex />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Academic Records
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Aggregate marks across all departments and courses</p>
          </div>
          <ExportButton
            data={filteredRecords}
            columns={exportColumns}
            filename="academic-records"
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{summary?.total_students || 0}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{summary?.total_records || 0}</p>
              <p className="text-xs text-muted-foreground">Records</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold">{summary?.avg_total || "—"}</p>
              <p className="text-xs text-muted-foreground">Avg Total</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {summary?.total_records
                  ? ((summary.pass_count / summary.total_records) * 100).toFixed(0) + "%"
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Pass Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {gradeDistribution.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={gradeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                      {gradeDistribution.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pass vs Fail</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: "Pass", count: summary?.pass_count || 0 },
                    { name: "Fail", count: summary?.fail_count || 0 },
                  ]}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search + Table */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search student, course, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Badge variant="secondary">{filteredRecords.length} records</Badge>
        </div>

        <div className="overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Semester</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No academic records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((r: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{r.student_name}</TableCell>
                    <TableCell className="text-sm">
                      {r.course_name}
                      {r.course_code && <span className="text-xs text-muted-foreground ml-1">({r.course_code})</span>}
                    </TableCell>
                    <TableCell className="text-sm">{r.department}</TableCell>
                    <TableCell className="text-right font-bold">{r.total_marks ?? "—"}</TableCell>
                    <TableCell>
                      {r.grade ? <Badge variant="outline" className="text-xs">{r.grade}</Badge> : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.academic_year} {r.semester}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
};

export default AcademicRecordsPage;
