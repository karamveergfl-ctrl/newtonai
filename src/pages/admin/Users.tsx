import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  MoreHorizontal,
  Shield,
  ShieldOff,
  Crown,
  Sparkles,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface UserData {
  id: string;
  full_name: string | null;
  email: string;
  subscription_tier: string;
  created_at: string;
  updated_at: string;
  roles: string[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("admin-users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: null,
        method: "GET",
      });

      // Use query params approach since we can't pass body with GET
      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("pageSize", pageSize.toString());
      if (search) url.searchParams.set("search", search);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch users");

      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateTier = async (userId: string, tier: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`);
      url.searchParams.set("action", "update-tier");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, tier }),
      });

      if (!res.ok) throw new Error("Failed to update tier");

      toast.success(`User tier updated to ${tier}`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to update tier:", err);
      toast.error("Failed to update user tier");
    }
  };

  const grantAdmin = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`);
      url.searchParams.set("action", "grant-admin");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error("Failed to grant admin");

      toast.success("Admin access granted");
      fetchUsers();
    } catch (err) {
      console.error("Failed to grant admin:", err);
      toast.error("Failed to grant admin access");
    }
  };

  const revokeAdmin = async (userId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`);
      url.searchParams.set("action", "revoke-admin");

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke admin");

      toast.success("Admin access revoked");
      fetchUsers();
    } catch (err) {
      console.error("Failed to revoke admin:", err);
      toast.error(err instanceof Error ? err.message : "Failed to revoke admin access");
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "pro":
        return (
          <Badge className="bg-primary gap-1">
            <Crown className="h-3 w-3" /> Pro
          </Badge>
        );
      case "ultra":
        return (
          <Badge className="bg-secondary gap-1">
            <Sparkles className="h-3 w-3" /> Ultra
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" /> Free
          </Badge>
        );
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage users, roles, and subscriptions
              </p>
            </div>
            <NotificationBell />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Users ({total})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">
                            {user.full_name || "N/A"}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getTierBadge(user.subscription_tier)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.roles.includes("admin") && (
                                <Badge variant="destructive" className="gap-1">
                                  <Shield className="h-3 w-3" /> Admin
                                </Badge>
                              )}
                              {user.roles.length === 0 && (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDistanceToNow(new Date(user.created_at), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Change Tier</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => updateTier(user.id, "free")}>
                                  <User className="h-4 w-4 mr-2" /> Set Free
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTier(user.id, "pro")}>
                                  <Crown className="h-4 w-4 mr-2" /> Set Pro
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateTier(user.id, "ultra")}>
                                  <Sparkles className="h-4 w-4 mr-2" /> Set Ultra
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Admin Access</DropdownMenuLabel>
                                {user.roles.includes("admin") ? (
                                  <DropdownMenuItem
                                    onClick={() => revokeAdmin(user.id)}
                                    className="text-destructive"
                                  >
                                    <ShieldOff className="h-4 w-4 mr-2" /> Revoke Admin
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => grantAdmin(user.id)}>
                                    <Shield className="h-4 w-4 mr-2" /> Grant Admin
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                        >
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </SidebarProvider>
  );
}
