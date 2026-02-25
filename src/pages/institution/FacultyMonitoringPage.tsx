import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { InstitutionFeatureGate } from "@/components/institution/InstitutionFeatureGate";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";
import { format } from "date-fns";

function FacultyContent() {
  const { institution, loading } = useInstitution();

  const { data: facultyStats, isLoading } = useQuery({
    queryKey: ["faculty-stats-monitoring", institution?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_faculty_stats", {
        p_institution_id: institution!.id,
      });
      if (error) throw error;
      return (data as any) || [];
    },
    enabled: !!institution?.id,
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getEngagementColor = (sessionCount: number) => {
    if (sessionCount >= 10) return "bg-green-500";
    if (sessionCount >= 3) return "bg-amber-500";
    return "bg-destructive";
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold">Faculty Monitoring</h1>
        <p className="text-sm text-muted-foreground">{institution?.name} · Teacher Engagement</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5" />
            Faculty Overview ({facultyStats?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facultyStats && facultyStats.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-center">Classes</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-center">Assignments</TableHead>
                  <TableHead className="text-center">Avg Score</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facultyStats.map((f: any) => (
                  <TableRow key={f.teacher_id}>
                    <TableCell>
                      <div className={`h-3 w-3 rounded-full ${getEngagementColor(f.session_count)}`} />
                    </TableCell>
                    <TableCell className="font-medium">{f.teacher_name || "Unknown"}</TableCell>
                    <TableCell className="text-center">{f.class_count}</TableCell>
                    <TableCell className="text-center">{f.session_count}</TableCell>
                    <TableCell className="text-center">{f.assignment_count}</TableCell>
                    <TableCell className="text-center">{f.avg_student_score}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {f.last_active ? format(new Date(f.last_active), "MMM d, yyyy") : "Never"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">No faculty data available</p>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-green-500" /> 10+ sessions</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-amber-500" /> 3–9 sessions</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-full bg-destructive" /> &lt;3 sessions</div>
      </div>
    </div>
  );
}

export default function FacultyMonitoringPage() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <InstitutionFeatureGate feature="faculty_monitoring">
            <FacultyContent />
          </InstitutionFeatureGate>
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
