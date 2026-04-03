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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/components/admin/ExportButton";
import { Loader2, Shield, ScrollText, Users, FileText, Download, Building2 } from "lucide-react";
import { InstitutionFeatureGate } from "@/components/institution/InstitutionFeatureGate";
import { format } from "date-fns";
import jsPDF from "jspdf";

interface ComplianceReport {
  institution_name: string;
  institution_type: string;
  generated_at: string;
  summary: {
    faculty_count: number;
    student_count: number;
    department_count: number;
    course_count: number;
    total_sessions: number;
    total_assignments: number;
    avg_attendance_pct: number;
    avg_student_score: number;
  };
  departments: Array<{
    name: string;
    head: string | null;
    course_count: number;
    faculty_count: number;
    session_count: number;
  }>;
  audit_log_count: number;
}

function ComplianceContent() {
  const { institution, loading } = useInstitution();
  const [actionFilter, setActionFilter] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  // Audit logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["audit-logs", institution?.id, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from("institution_audit_logs")
        .select("*")
        .eq("institution_id", institution!.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (actionFilter) {
        query = query.ilike("action", `%${actionFilter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!institution?.id,
  });

  // Members for role overview
  const { data: members } = useQuery({
    queryKey: ["inst-members-compliance", institution?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("institution_members")
        .select("user_id, role, joined_at")
        .eq("institution_id", institution!.id);

      if (!data?.length) return [];

      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

      return data.map((m) => ({
        ...m,
        full_name: profileMap.get(m.user_id) || "Unknown",
      }));
    },
    enabled: !!institution?.id,
  });

  // Compliance report data
  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ["compliance-report-data", institution?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_compliance_report_data", {
        p_institution_id: institution!.id,
      });
      if (error) throw error;
      return data as unknown as ComplianceReport;
    },
    enabled: !!institution?.id,
  });

  const exportNAACReport = async () => {
    if (!reportData) return;
    setExportingPdf(true);
    try {
      const doc = new jsPDF();
      const lm = 14;
      const pw = 180;
      let y = 20;

      // Title page
      doc.setFontSize(18);
      doc.text("NAAC / NBA Compliance Report", lm, y); y += 8;
      doc.setFontSize(10);
      doc.text(reportData.institution_name, lm, y); y += 5;
      doc.text(`Type: ${reportData.institution_type}`, lm, y); y += 5;
      doc.text(`Generated: ${format(new Date(reportData.generated_at), "MMMM d, yyyy 'at' h:mm a")}`, lm, y); y += 5;
      doc.text("Powered by NewtonAI — newtonai.site", lm, y); y += 14;

      // Separator
      doc.setDrawColor(0, 0, 0);
      doc.line(lm, y, lm + pw, y); y += 8;

      // Section 1: Institution Summary
      doc.setFontSize(14);
      doc.text("1. Institution Summary", lm, y); y += 8;
      doc.setFontSize(10);
      const s = reportData.summary;
      const summaryRows = [
        ["Total Departments", String(s.department_count)],
        ["Total Courses Offered", String(s.course_count)],
        ["Faculty Members", String(s.faculty_count)],
        ["Active Students", String(s.student_count)],
        ["Total Teaching Sessions", String(s.total_sessions)],
        ["Total Assignments Created", String(s.total_assignments)],
        ["Average Attendance Rate", `${s.avg_attendance_pct}%`],
        ["Average Student Score", String(s.avg_student_score)],
      ];
      summaryRows.forEach(([label, value]) => {
        doc.text(`${label}:`, lm + 2, y);
        doc.text(value, lm + 80, y);
        y += 6;
      });
      y += 6;

      // Section 2: Department Breakdown
      doc.setFontSize(14);
      doc.text("2. Department-wise Breakdown", lm, y); y += 8;
      doc.setFontSize(9);

      // Table header
      doc.setFont(undefined!, "bold");
      doc.text("Department", lm + 2, y);
      doc.text("Head", lm + 55, y);
      doc.text("Courses", lm + 110, y);
      doc.text("Faculty", lm + 130, y);
      doc.text("Sessions", lm + 150, y);
      y += 2;
      doc.line(lm, y, lm + pw, y);
      y += 5;
      doc.setFont(undefined!, "normal");

      reportData.departments.forEach((dept) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(dept.name, lm + 2, y, { maxWidth: 50 });
        doc.text(dept.head || "—", lm + 55, y, { maxWidth: 50 });
        doc.text(String(dept.course_count), lm + 115, y);
        doc.text(String(dept.faculty_count), lm + 135, y);
        doc.text(String(dept.session_count), lm + 155, y);
        y += 7;
      });
      y += 6;

      // Section 3: Compliance Indicators
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text("3. Compliance Indicators", lm, y); y += 8;
      doc.setFontSize(10);

      const attendanceStatus = s.avg_attendance_pct >= 75 ? "✓ Meets minimum (75%)" : "✗ Below minimum (75%)";
      const sessionStatus = s.total_sessions > 0 ? "✓ Digital teaching records available" : "✗ No digital records";
      const auditStatus = reportData.audit_log_count > 0 ? `✓ ${reportData.audit_log_count} audit log entries recorded` : "✗ No audit trail";

      doc.text(`Attendance Compliance: ${attendanceStatus}`, lm + 2, y); y += 6;
      doc.text(`Teaching Activity Record: ${sessionStatus}`, lm + 2, y); y += 6;
      doc.text(`Audit Trail: ${auditStatus}`, lm + 2, y); y += 6;
      doc.text(`Faculty-Student Ratio: 1:${s.faculty_count > 0 ? Math.round(s.student_count / s.faculty_count) : "N/A"}`, lm + 2, y); y += 6;
      doc.text(`Assignment Coverage: ${s.total_assignments} assessments created`, lm + 2, y); y += 10;

      // Section 4: Data Integrity
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text("4. Data Integrity & Digital Records", lm, y); y += 8;
      doc.setFontSize(10);
      doc.text("All data in this report is sourced from the NewtonAI platform.", lm + 2, y); y += 6;
      doc.text("Records are tamper-proof — RLS policies prevent unauthorized modification.", lm + 2, y); y += 6;
      doc.text("Audit logs track all administrative actions with timestamps.", lm + 2, y); y += 6;
      doc.text("Student marks and attendance are immutable once recorded.", lm + 2, y); y += 10;

      // Footer
      doc.setFontSize(8);
      doc.text("This report is auto-generated by NewtonAI for NAAC/NBA accreditation purposes.", lm, 285);

      doc.save(`NAAC-Report-${reportData.institution_name.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const auditColumns = [
    { key: "created_at", header: "Timestamp", formatter: (v: unknown) => v ? format(new Date(v as string), "MMM d, yyyy HH:mm") : "" },
    { key: "action", header: "Action" },
    { key: "entity_type", header: "Entity" },
    { key: "user_id", header: "User ID" },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance & Audit</h1>
          <p className="text-sm text-muted-foreground">{institution?.name} · Audit Trail & Accreditation</p>
        </div>
      </div>

      <Tabs defaultValue="naac" className="space-y-4">
        <TabsList>
          <TabsTrigger value="naac">NAAC/NBA Report</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="roles">Role Overview</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>

        {/* NAAC/NBA Report Tab */}
        <TabsContent value="naac" className="space-y-4">
          <InstitutionFeatureGate feature="compliance_audit" overlay>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  NAAC / NBA Compliance Report
                </CardTitle>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={exportNAACReport}
                  disabled={exportingPdf || reportLoading || !reportData}
                >
                  {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Export PDF
                </Button>
              </CardHeader>
              <CardContent>
                {reportLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : reportData ? (
                  <div className="space-y-6">
                    {/* Summary grid */}
                    <div>
                      <p className="text-sm font-semibold mb-3">Institution Summary</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Departments", value: reportData.summary.department_count },
                          { label: "Courses", value: reportData.summary.course_count },
                          { label: "Faculty", value: reportData.summary.faculty_count },
                          { label: "Students", value: reportData.summary.student_count },
                          { label: "Sessions", value: reportData.summary.total_sessions },
                          { label: "Assignments", value: reportData.summary.total_assignments },
                          { label: "Avg Attendance", value: `${reportData.summary.avg_attendance_pct}%` },
                          { label: "Avg Score", value: reportData.summary.avg_student_score },
                        ].map((item) => (
                          <div key={item.label} className="bg-muted/50 rounded-lg p-3 text-center">
                            <p className="text-lg font-bold">{item.value}</p>
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Department breakdown */}
                    <div>
                      <p className="text-sm font-semibold mb-3">Department Breakdown</p>
                      {reportData.departments.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Department</TableHead>
                              <TableHead>Head</TableHead>
                              <TableHead className="text-center">Courses</TableHead>
                              <TableHead className="text-center">Faculty</TableHead>
                              <TableHead className="text-center">Sessions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.departments.map((dept, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{dept.name}</TableCell>
                                <TableCell className="text-muted-foreground">{dept.head || "—"}</TableCell>
                                <TableCell className="text-center">{dept.course_count}</TableCell>
                                <TableCell className="text-center">{dept.faculty_count}</TableCell>
                                <TableCell className="text-center">{dept.session_count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">No departments configured</p>
                      )}
                    </div>

                    {/* Compliance indicators */}
                    <div>
                      <p className="text-sm font-semibold mb-3">Compliance Indicators</p>
                      <div className="space-y-2">
                        {[
                          {
                            label: "Attendance Compliance",
                            pass: reportData.summary.avg_attendance_pct >= 75,
                            detail: `${reportData.summary.avg_attendance_pct}% average (minimum 75%)`,
                          },
                          {
                            label: "Digital Teaching Records",
                            pass: reportData.summary.total_sessions > 0,
                            detail: `${reportData.summary.total_sessions} sessions recorded digitally`,
                          },
                          {
                            label: "Audit Trail",
                            pass: reportData.audit_log_count > 0,
                            detail: `${reportData.audit_log_count} audit log entries`,
                          },
                          {
                            label: "Assessment Coverage",
                            pass: reportData.summary.total_assignments > 0,
                            detail: `${reportData.summary.total_assignments} assessments created`,
                          },
                        ].map((ind) => (
                          <div key={ind.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                            <span className={`text-lg ${ind.pass ? "text-green-500" : "text-destructive"}`}>
                              {ind.pass ? "✓" : "✗"}
                            </span>
                            <div>
                              <p className="text-sm font-medium">{ind.label}</p>
                              <p className="text-xs text-muted-foreground">{ind.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No report data available</p>
                )}
              </CardContent>
            </Card>
          </InstitutionFeatureGate>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <InstitutionFeatureGate feature="compliance_audit" overlay>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ScrollText className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Filter by action..."
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-48"
                  />
                  <ExportButton
                    data={(auditLogs || []) as Record<string, unknown>[]}
                    columns={auditColumns}
                    filename="audit-logs"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : auditLogs && auditLogs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell>{log.entity_type}</TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {log.details ? JSON.stringify(log.details) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
                )}
              </CardContent>
            </Card>
          </InstitutionFeatureGate>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Institution Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members && members.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m: any) => (
                      <TableRow key={m.user_id}>
                        <TableCell className="font-medium">{m.full_name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground capitalize">
                            {m.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.joined_at ? format(new Date(m.joined_at), "MMM d, yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No members found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Export institution data for compliance and record-keeping.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={exportNAACReport}
                  disabled={exportingPdf || !reportData}
                >
                  <FileText className="h-3.5 w-3.5" />
                  NAAC/NBA Report (PDF)
                </Button>
                <ExportButton
                  data={(members || []) as Record<string, unknown>[]}
                  columns={[
                    { key: "full_name", header: "Name" },
                    { key: "role", header: "Role" },
                    { key: "joined_at", header: "Joined" },
                  ]}
                  filename="institution-members"
                />
                <ExportButton
                  data={(auditLogs || []) as Record<string, unknown>[]}
                  columns={auditColumns}
                  filename="audit-logs-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function CompliancePage() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <ComplianceContent />
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
