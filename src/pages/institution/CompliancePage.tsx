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
import { Loader2, Shield, ScrollText, Users } from "lucide-react";
import { InstitutionFeatureGate } from "@/components/institution/InstitutionFeatureGate";
import { format } from "date-fns";

function ComplianceContent() {
  const { institution, loading } = useInstitution();
  const [actionFilter, setActionFilter] = useState("");

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

      // Get profiles for names
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
      <div>
        <h1 className="text-2xl font-bold">Compliance & Audit</h1>
        <p className="text-sm text-muted-foreground">{institution?.name} · Audit Trail & Access Control</p>
      </div>

      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="roles">Role Overview</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>

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
