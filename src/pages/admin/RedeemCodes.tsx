import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Plus,
  MoreHorizontal,
  Copy,
  History,
  Pencil,
  Power,
  Percent,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { ExportButton } from "@/components/admin/ExportButton";
import {
  RedeemCodeFormDialog,
  type RedeemCodeFormData,
} from "@/components/admin/RedeemCodeFormDialog";
import { RedemptionHistoryDialog } from "@/components/admin/RedemptionHistoryDialog";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface RedeemCode {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

export default function AdminRedeemCodes() {
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<RedeemCode | null>(null);
  const [historyCode, setHistoryCode] = useState<RedeemCode | null>(null);

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-redeem-codes`
      );

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch codes");

      const data = await res.json();
      setCodes(data.codes || []);
    } catch (err) {
      console.error("Failed to fetch codes:", err);
      toast.error("Failed to load redeem codes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData: RedeemCodeFormData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-redeem-codes`
      );
      url.searchParams.set("action", "create");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: formData.code,
          discount_percent: formData.discount_percent,
          description: formData.description || null,
          max_uses: formData.max_uses,
          valid_from: formData.valid_from.toISOString(),
          valid_until: formData.valid_until?.toISOString() || null,
          is_active: formData.is_active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create code");
      }

      toast.success("Redeem code created");
      fetchCodes();
    } catch (err) {
      console.error("Failed to create code:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create code");
      throw err;
    }
  };

  const handleUpdate = async (formData: RedeemCodeFormData) => {
    if (!editingCode) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-redeem-codes`
      );
      url.searchParams.set("action", "update");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingCode.id,
          discount_percent: formData.discount_percent,
          description: formData.description || null,
          max_uses: formData.max_uses,
          valid_from: formData.valid_from.toISOString(),
          valid_until: formData.valid_until?.toISOString() || null,
          is_active: formData.is_active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update code");
      }

      toast.success("Redeem code updated");
      setEditingCode(null);
      fetchCodes();
    } catch (err) {
      console.error("Failed to update code:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update code");
      throw err;
    }
  };

  const toggleActive = async (code: RedeemCode) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-redeem-codes`
      );
      url.searchParams.set("action", "toggle-active");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: code.id,
          is_active: !code.is_active,
        }),
      });

      if (!res.ok) throw new Error("Failed to toggle status");

      toast.success(code.is_active ? "Code disabled" : "Code enabled");
      fetchCodes();
    } catch (err) {
      console.error("Failed to toggle code:", err);
      toast.error("Failed to update code status");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const getStatusBadge = (code: RedeemCode) => {
    const now = new Date();
    const validUntil = code.valid_until ? new Date(code.valid_until) : null;

    if (!code.is_active) {
      return (
        <Badge variant="secondary" className="gap-1">
          <XCircle className="h-3 w-3" /> Disabled
        </Badge>
      );
    }

    if (validUntil && validUntil < now) {
      return (
        <Badge variant="destructive" className="gap-1">
          Expired
        </Badge>
      );
    }

    if (code.max_uses && code.current_uses >= code.max_uses) {
      return (
        <Badge variant="outline" className="gap-1">
          Exhausted
        </Badge>
      );
    }

    return (
      <Badge className="gap-1 bg-green-600">
        <CheckCircle2 className="h-3 w-3" /> Active
      </Badge>
    );
  };

  const getUsageProgress = (code: RedeemCode) => {
    if (!code.max_uses) return null;
    return (code.current_uses / code.max_uses) * 100;
  };

  // Stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => c.is_active).length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.current_uses, 0);
  const avgDiscount =
    codes.length > 0
      ? Math.round(
          codes.reduce((sum, c) => sum + c.discount_percent, 0) / codes.length
        )
      : 0;

  // Export columns
  const exportColumns = [
    { key: "code", header: "Code" },
    { key: "discount_percent", header: "Discount %" },
    { key: "current_uses", header: "Uses" },
    {
      key: "max_uses",
      header: "Max Uses",
      formatter: (v: unknown) => (v as number | null)?.toString() || "Unlimited",
    },
    {
      key: "is_active",
      header: "Status",
      formatter: (v: unknown) => ((v as boolean) ? "Active" : "Disabled"),
    },
    { key: "description", header: "Description" },
    {
      key: "created_at",
      header: "Created",
      formatter: (v: unknown) => format(new Date(v as string), "yyyy-MM-dd"),
    },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Redeem Codes</h1>
              <p className="text-muted-foreground">
                Create and manage discount codes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Code
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{totalCodes}</p>
                    <p className="text-sm text-muted-foreground">Total Codes</p>
                  </div>
                  <Gift className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {activeCodes}
                    </p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{totalRedemptions}</p>
                    <p className="text-sm text-muted-foreground">Redemptions</p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{avgDiscount}%</p>
                    <p className="text-sm text-muted-foreground">Avg Discount</p>
                  </div>
                  <Percent className="h-8 w-8 text-muted-foreground opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  All Codes ({codes.length})
                </CardTitle>
                <ExportButton
                  data={codes as unknown as Record<string, unknown>[]}
                  columns={exportColumns}
                  filename="redeem-codes"
                  disabled={loading}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : codes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No redeem codes yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create your first code
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.map((code) => (
                      <motion.tr
                        key={code.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b"
                      >
                        <TableCell>
                          <div>
                            <p className="font-mono font-bold">{code.code}</p>
                            {code.description && (
                              <p className="text-sm text-muted-foreground">
                                {code.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              code.discount_percent === 100
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {code.discount_percent}% off
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[120px]">
                            <p className="text-sm">
                              {code.current_uses}
                              {code.max_uses ? ` / ${code.max_uses}` : " / ∞"}
                            </p>
                            {code.max_uses && (
                              <Progress
                                value={getUsageProgress(code) || 0}
                                className="h-1.5 mt-1"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(code)}</TableCell>
                        <TableCell>
                          {code.valid_until
                            ? formatDistanceToNow(new Date(code.valid_until), {
                                addSuffix: true,
                              })
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => copyCode(code.code)}>
                                <Copy className="h-4 w-4 mr-2" /> Copy Code
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingCode(code);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setHistoryCode(code)}
                              >
                                <History className="h-4 w-4 mr-2" /> View History
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleActive(code)}>
                                <Power className="h-4 w-4 mr-2" />
                                {code.is_active ? "Disable" : "Enable"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create Dialog */}
          <RedeemCodeFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={handleCreate}
          />

          {/* Edit Dialog */}
          <RedeemCodeFormDialog
            open={!!editingCode}
            onOpenChange={(open) => !open && setEditingCode(null)}
            onSubmit={handleUpdate}
            initialData={
              editingCode
                ? {
                    code: editingCode.code,
                    discount_percent: editingCode.discount_percent,
                    description: editingCode.description || "",
                    max_uses: editingCode.max_uses,
                    valid_from: new Date(editingCode.valid_from),
                    valid_until: editingCode.valid_until
                      ? new Date(editingCode.valid_until)
                      : null,
                    is_active: editingCode.is_active,
                  }
                : undefined
            }
            isEditing
          />

          {/* History Dialog */}
          <RedemptionHistoryDialog
            open={!!historyCode}
            onOpenChange={(open) => !open && setHistoryCode(null)}
            codeId={historyCode?.id || null}
            codeName={historyCode?.code || ""}
          />
        </main>
      </div>
    </SidebarProvider>
  );
}
