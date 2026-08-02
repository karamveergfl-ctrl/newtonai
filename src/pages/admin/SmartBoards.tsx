import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Download, Loader2, Monitor, Plus, RefreshCw, Search, UserPlus } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SbBoard, SbInstitution } from "@/hooks/useSmartboardAdmin";
import AddBoardModal from "@/components/smartboard-admin/AddBoardModal";
import { generateCredentialPDF } from "@/lib/smartboardCredentialPdf";

export default function AdminSmartBoards() {
  const [institutions, setInstitutions] = useState<SbInstitution[]>([]);
  const [boards, setBoards] = useState<SbBoard[]>([]);
  const [usageCount, setUsageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminTarget, setAdminTarget] = useState<SbInstitution | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkedAdmins, setLinkedAdmins] = useState<{ user_id: string; email: string }[]>([]);
  const [boardTarget, setBoardTarget] = useState<SbInstitution | null>(null);
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    state: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    max_smartboards: 5,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [instRes, boardRes, usageRes] = await Promise.all([
      supabase.from("sb_institutions").select("*").order("created_at", { ascending: false }),
      supabase.from("sb_boards").select("*"),
      supabase.from("sb_board_usage").select("id", { count: "exact", head: true }),
    ]);
    setInstitutions((instRes.data as SbInstitution[]) ?? []);
    setBoards((boardRes.data as SbBoard[]) ?? []);
    setUsageCount(usageRes.count ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () =>
      institutions.filter((i) =>
        [i.name, i.city, i.contact_email].filter(Boolean).join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [institutions, query],
  );

  const createSchool = async () => {
    if (!form.name.trim() || !form.contact_email.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("sb_institutions").insert({
      name: form.name.trim(),
      city: form.city.trim() || null,
      state: form.state.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim(),
      contact_phone: form.contact_phone.trim() || null,
      max_smartboards: Number(form.max_smartboards) || 1,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("SmartBoard school created.");
    setOpen(false);
    setForm({ name: "", city: "", state: "", contact_name: "", contact_email: "", contact_phone: "", max_smartboards: 5 });
    void load();
  };

  const toggleActive = async (inst: SbInstitution) => {
    const { error } = await supabase.from("sb_institutions").update({ is_active: !inst.is_active }).eq("id", inst.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    void load();
  };

  const openAdminDialog = async (inst: SbInstitution) => {
    setAdminTarget(inst);
    setAdminEmail(inst.contact_email ?? "");
    setLinkedAdmins([]);
    const { data } = await supabase.rpc("sb_list_institution_admins" as any, { p_institution_id: inst.id });
    setLinkedAdmins((data as { user_id: string; email: string }[]) ?? []);
  };

  const linkAdmin = async () => {
    if (!adminTarget || !adminEmail.trim()) return;
    setLinking(true);
    const { data, error } = await supabase.rpc("sb_link_institution_admin" as any, {
      p_institution_id: adminTarget.id,
      p_email: adminEmail.trim(),
    });
    setLinking(false);
    const result = data as { success?: boolean; error?: string } | null;
    if (error || !result?.success) {
      toast.error(error?.message ?? result?.error ?? "Could not link this administrator.");
      return;
    }
    toast.success("School administrator linked. They can now sign in at /smartboard-admin/login.");
    void openAdminDialog(adminTarget);
  };

  const reissueCode = async (board: SbBoard) => {
    const { data, error } = await supabase.rpc("sb_reissue_board_code", { p_board_id: board.id });
    const result = data as { success?: boolean; error?: string; activation_code?: string } | null;
    if (error || !result?.success) {
      toast.error(error?.message ?? result?.error ?? "Could not reissue the code.");
      return;
    }
    toast.success(`New activation code for ${board.board_name}: ${result.activation_code}`);
    void load();
  };

  const targetBoards = boardTarget ? boards.filter((b) => b.institution_id === boardTarget.id) : [];
  const boardSlotsLeft = boardTarget ? boardTarget.max_smartboards - targetBoards.length : 0;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5">
      <SEOHead
        title="SmartBoard Administration"
        description="Manage NewtonAI SmartBoard schools, boards and usage."
        canonicalPath="/admin/smartboards"
        noIndex
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">SmartBoard Plan</h1>
          <p className="text-sm text-muted-foreground">Schools subscribed to the classroom video SmartBoard tier</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add school
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Schools", value: institutions.length, icon: Building2 },
          { label: "Boards", value: boards.length, icon: Monitor },
          { label: "Logged searches", value: usageCount, icon: Search },
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

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search schools by name, city or email"
        aria-label="Search SmartBoard schools"
        className="max-w-sm"
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Boards</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No SmartBoard schools yet.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((inst) => {
                const count = boards.filter((b) => b.institution_id === inst.id).length;
                return (
                  <TableRow key={inst.id}>
                    <TableCell className="font-medium">
                      {inst.name}
                      <span className="block text-xs text-muted-foreground">
                        {[inst.city, inst.state].filter(Boolean).join(", ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {inst.contact_name ?? "—"}
                      <span className="block text-xs text-muted-foreground">{inst.contact_email}</span>
                    </TableCell>
                    <TableCell>
                      {count}/{inst.max_smartboards}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inst.is_active ? "default" : "secondary"}>
                        {inst.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setBoardTarget(inst)}>
                          <Monitor className="mr-1.5 h-4 w-4" aria-hidden="true" /> Boards
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openAdminDialog(inst)}>
                          <UserPlus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Admins
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleActive(inst)}>
                          {inst.is_active ? "Suspend" : "Reactivate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add SmartBoard school</DialogTitle>
            <DialogDescription>Create a school account for the SmartBoard plan.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="sb-name">School name</Label>
              <Input id="sb-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-city">City</Label>
              <Input id="sb-city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-state">State</Label>
              <Input id="sb-state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-contact">Contact name</Label>
              <Input
                id="sb-contact"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-phone">Contact phone</Label>
              <Input
                id="sb-phone"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-email">Contact email</Label>
              <Input
                id="sb-email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-max">Max boards</Label>
              <Input
                id="sb-max"
                type="number"
                min={1}
                value={form.max_smartboards}
                onChange={(e) => setForm({ ...form, max_smartboards: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createSchool} disabled={saving || !form.name.trim() || !form.contact_email.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />} Create school
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!boardTarget} onOpenChange={(o) => !o && setBoardTarget(null)}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>SmartBoards — {boardTarget?.name}</DialogTitle>
            <DialogDescription>
              Create classroom boards, download their credential PDFs and reissue activation codes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {boardSlotsLeft > 0
                ? `${boardSlotsLeft} board slot${boardSlotsLeft === 1 ? "" : "s"} remaining on this plan.`
                : "All board slots on this plan are used. Raise Max boards to add more."}
            </p>
            <Button size="sm" onClick={() => setAddBoardOpen(true)} disabled={boardSlotsLeft <= 0}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Add board
            </Button>
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Board</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targetBoards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No boards yet for this school.
                    </TableCell>
                  </TableRow>
                )}
                {targetBoards.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {b.board_name}
                      <span className="block text-xs text-muted-foreground">
                        {[b.grade_level, b.subject_focus].filter(Boolean).join(" · ")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{b.activation_code}</TableCell>
                    <TableCell>
                      <Badge variant={b.activated_at ? "default" : "secondary"}>
                        {b.activated_at ? "Activated" : "Awaiting activation"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            generateCredentialPDF({
                              institutionName: boardTarget?.name ?? "",
                              boardName: b.board_name,
                              activationCode: b.activation_code,
                            })
                          }
                        >
                          <Download className="mr-1 h-4 w-4" aria-hidden="true" /> PDF
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => reissueCode(b)}>
                          <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" /> New code
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBoardTarget(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {boardTarget && (
        <AddBoardModal
          open={addBoardOpen}
          onOpenChange={setAddBoardOpen}
          institutionId={boardTarget.id}
          institutionName={boardTarget.name}
          onCreated={load}
        />
      )}

      <Dialog open={!!adminTarget} onOpenChange={(o) => !o && setAdminTarget(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>School administrators</DialogTitle>
            <DialogDescription>
              Link a signed-up NewtonAI account to {adminTarget?.name} so they can use the SmartBoard School Portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="sb-admin-email">Account email</Label>
              <Input
                id="sb-admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="principal@school.edu"
              />
              <p className="text-xs text-muted-foreground">
                The person must already have a NewtonAI account with this email.
              </p>
            </div>

            <div className="rounded-lg border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Linked administrators</p>
              {linkedAdmins.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {linkedAdmins.map((a) => (
                    <li key={a.user_id}>{a.email}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAdminTarget(null)}>
              Close
            </Button>
            <Button onClick={linkAdmin} disabled={linking || !adminEmail.trim()}>
              {linking && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />} Link administrator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}