import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Inquiry {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  job_title: string;
  team_size: string;
  use_case: string;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("enterprise_inquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInquiries((data as Inquiry[]) || []);
    } catch (err) {
      console.error("Failed to fetch inquiries:", err);
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("enterprise_inquiries")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Status updated to ${status}`);
      fetchInquiries();
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "contacted":
        return (
          <Badge className="gap-1 bg-blue-500">
            <Mail className="h-3 w-3" /> Contacted
          </Badge>
        );
      case "closed":
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Closed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = inquiries.filter((i) => i.status === "pending").length;
  const contactedCount = inquiries.filter((i) => i.status === "contacted").length;
  const closedCount = inquiries.filter((i) => i.status === "closed").length;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Enterprise Inquiries</h1>
              <p className="text-muted-foreground">
                Manage and respond to enterprise contact requests
              </p>
            </div>
            <NotificationBell />
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-blue-500">{contactedCount}</p>
                    <p className="text-sm text-muted-foreground">Contacted</p>
                  </div>
                  <Mail className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{closedCount}</p>
                    <p className="text-sm text-muted-foreground">Closed</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Inquiries ({inquiries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No enterprise inquiries yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Contact</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Team Size</TableHead>
                      <TableHead>Use Case</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.map((inquiry) => (
                      <motion.tr
                        key={inquiry.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {inquiry.first_name} {inquiry.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inquiry.company}</p>
                            <p className="text-sm text-muted-foreground">{inquiry.job_title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{inquiry.team_size}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {inquiry.use_case}
                        </TableCell>
                        <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(inquiry.created_at), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => updateStatus(inquiry.id, "pending")}
                              >
                                <Clock className="h-4 w-4 mr-2" /> Mark Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(inquiry.id, "contacted")}
                              >
                                <Mail className="h-4 w-4 mr-2" /> Mark Contacted
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatus(inquiry.id, "closed")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Closed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(`mailto:${inquiry.email}`, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4 mr-2" /> Send Email
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

          {/* Inquiry Detail Dialog */}
          <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
            <DialogContent className="max-w-2xl">
              {selectedInquiry && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {selectedInquiry.company}
                    </DialogTitle>
                    <DialogDescription>
                      Inquiry from {selectedInquiry.first_name} {selectedInquiry.last_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Contact</p>
                        <p className="font-medium">
                          {selectedInquiry.first_name} {selectedInquiry.last_name}
                        </p>
                        <p className="text-sm">{selectedInquiry.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Position</p>
                        <p className="font-medium">{selectedInquiry.job_title}</p>
                        <p className="text-sm">{selectedInquiry.company}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Team Size</p>
                        <p className="font-medium">{selectedInquiry.team_size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Received</p>
                        <p className="font-medium">
                          {format(new Date(selectedInquiry.created_at), "PPP")}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Use Case</p>
                      <p className="font-medium">{selectedInquiry.use_case}</p>
                    </div>
                    {selectedInquiry.message && (
                      <div>
                        <p className="text-sm text-muted-foreground">Message</p>
                        <p className="bg-muted p-3 rounded-lg">{selectedInquiry.message}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        {getStatusBadge(selectedInquiry.status)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            window.open(`mailto:${selectedInquiry.email}`, "_blank")
                          }
                        >
                          <Mail className="h-4 w-4 mr-2" /> Send Email
                        </Button>
                        <Button
                          onClick={() => {
                            updateStatus(selectedInquiry.id, "contacted");
                            setSelectedInquiry(null);
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Contacted
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
