import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Download,
  LogOut,
  Monitor,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Logo from "@/components/Logo";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddBoardModal from "@/components/smartboard-admin/AddBoardModal";
import { useSmartboardAdmin } from "@/hooks/useSmartboardAdmin";
import { generateCredentialPDF } from "@/lib/smartboardCredentialPdf";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export default function SmartBoardAdminDashboard() {
  const navigate = useNavigate();
  const { institution, boards, usage, loading, refresh } = useSmartboardAdmin();
  const [addOpen, setAddOpen] = useState(false);

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const activeBoards = boards.filter((b) => b.is_active).length;
    const searchesToday = usage.filter((u) => u.session_date === today && u.action !== "play").length;
    const videosPlayed = usage.filter((u) => u.action === "play").length;
    return { activeBoards, searchesToday, videosPlayed, totalSearches: usage.length - videosPlayed };
  }, [boards, usage]);

  const topTopics = useMemo(() => {
    const counts = new Map<string, number>();
    usage.forEach((u) => {
      const key = u.search_query?.trim().toLowerCase();
      if (!key) return;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [usage]);

  const handleReissue = async (boardId: string, boardName: string) => {
    const { data, error } = await supabase.rpc("sb_reissue_board_code", { p_board_id: boardId });
    const result = data as { success?: boolean; error?: string; activation_code?: string } | null;
    if (error || !result?.success) {
      toast.error(result?.error ?? error?.message ?? "Could not reissue the code.");
      return;
    }
    toast.success(`New activation code for ${boardName}: ${result.activation_code}`);
    refresh();
  };

  const exportUsage = () => {
    const csv = toCSV(
      usage.map((u) => ({
        date: u.session_date,
        board: boards.find((b) => b.id === u.board_id)?.board_name ?? u.board_id,
        query: u.search_query,
        action: u.action,
        video_title: u.video_title ?? "",
        video_channel: u.video_channel ?? "",
      })),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `smartboard-usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const boardsAvailable = (institution?.max_smartboards ?? 0) - boards.length;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="SmartBoard School Dashboard"
        description="Manage your school's NewtonAI SmartBoards, activation codes and classroom usage reports."
        canonicalPath="/smartboard-admin/dashboard"
        noIndex
      />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="hidden h-8 w-px bg-border sm:block" />
          <div>
            <h1 className="text-lg font-bold leading-tight">{institution?.name ?? "SmartBoard School"}</h1>
            <p className="text-xs text-muted-foreground">
              SmartBoard {institution?.plan ?? "plan"} · {boards.length}/{institution?.max_smartboards ?? 0} boards used
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/smartboard-admin/login", { replace: true });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign out
        </Button>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active boards", value: stats.activeBoards, icon: Monitor },
            { label: "Searches today", value: stats.searchesToday, icon: Search },
            { label: "Total searches", value: stats.totalSearches, icon: BarChart3 },
            { label: "Videos played", value: stats.videosPlayed, icon: BarChart3 },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="boards">
          <TabsList>
            <TabsTrigger value="boards">My SmartBoards</TabsTrigger>
            <TabsTrigger value="reports">Usage reports</TabsTrigger>
          </TabsList>

          <TabsContent value="boards" className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {boardsAvailable > 0
                  ? `${boardsAvailable} board slot${boardsAvailable === 1 ? "" : "s"} remaining on your plan.`
                  : "You have used all board slots on your plan. Contact NewtonAI to add more."}
              </p>
              <Button onClick={() => setAddOpen(true)} disabled={boardsAvailable <= 0}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add SmartBoard
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Board</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boards.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                          No SmartBoards yet. Add your first classroom board to get started.
                        </TableCell>
                      </TableRow>
                    )}
                    {boards.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          {b.board_name}
                          <span className="block text-xs text-muted-foreground">{b.subject_focus ?? ""}</span>
                        </TableCell>
                        <TableCell>{b.grade_level ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={b.activated_at ? "default" : "secondary"}>
                            {b.activated_at ? "Activated" : "Awaiting activation"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {b.last_active_at ? new Date(b.last_active_at).toLocaleString() : "Never"}
                        </TableCell>
                        <TableCell className="space-x-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              generateCredentialPDF({
                                institutionName: institution?.name ?? "",
                                boardName: b.board_name,
                                activationCode: b.activation_code,
                              })
                            }
                          >
                            <Download className="mr-1 h-4 w-4" aria-hidden="true" /> PDF
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleReissue(b.id, b.board_name)}>
                            <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" /> New code
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4 pt-4">
            <div className="flex justify-end">
              <Button variant="outline" onClick={exportUsage} disabled={!usage.length}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" /> Export CSV
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Most searched topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {topTopics.length === 0 && <p className="text-sm text-muted-foreground">No searches recorded yet.</p>}
                {topTopics.map(([topic, count]) => (
                  <div key={topic} className="flex items-center gap-3">
                    <span className="w-48 truncate text-sm capitalize">{topic}</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(count / topTopics[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm text-muted-foreground">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Board</TableHead>
                      <TableHead>Query</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.slice(0, 25).map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {boards.find((b) => b.id === u.board_id)?.board_name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{u.video_title ?? u.search_query}</TableCell>
                        <TableCell className="text-sm capitalize">{u.action.replace("_", " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {institution && (
        <AddBoardModal
          open={addOpen}
          onOpenChange={setAddOpen}
          institutionId={institution.id}
          institutionName={institution.name}
          onCreated={refresh}
        />
      )}
    </div>
  );
}