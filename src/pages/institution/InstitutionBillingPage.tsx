import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { useInstitutionSubscription } from "@/hooks/useInstitutionSubscription";
import { useQuery } from "@tanstack/react-query";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Users, GraduationCap, TrendingUp, CheckCircle2, X } from "lucide-react";
import { format } from "date-fns";
import { TIER_CONFIGS, type InstitutionTier } from "@/lib/institutionTierConfig";

function BillingContent() {
  const { institution, loading: instLoading } = useInstitution();
  const { billingStats, tier, tierConfig, loading } = useInstitutionSubscription();

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["institution-payments", institution?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_payments")
        .select("*")
        .eq("institution_id", institution!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!institution?.id,
  });

  if (loading || instLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tierOrder: InstitutionTier[] = ["starter", "growth", "enterprise"];
  const features = [
    { label: "Live Sessions/month", key: "live_sessions" as const },
    { label: "AI Insights", key: "ai_insights" as const },
    { label: "Result Processing", key: "result_processing" as const },
    { label: "Faculty Monitoring", key: "faculty_monitoring" as const },
    { label: "Compliance/Audit", key: "compliance_audit" as const },
    { label: "Report Card PDFs/month", key: "report_card_pdfs" as const },
  ];

  const formatLimit = (val: number | boolean | string) => {
    if (val === true) return <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />;
    if (val === false || val === "none") return <X className="h-4 w-4 text-muted-foreground mx-auto" />;
    if (val === -1) return "Unlimited";
    return String(val);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-2xl font-bold">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground">{institution?.name} · Manage your plan</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Subscription</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Subscription Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="default" className="text-sm px-3 py-1 capitalize">
                  {tierConfig.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {billingStats?.billing_cycle === "yearly" ? "Annual" : "Monthly"} billing
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Price per student</p>
                  <p className="font-semibold">₹{billingStats?.price_per_student ?? tierConfig.pricePerStudent}/mo</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Price per teacher</p>
                  <p className="font-semibold">₹{billingStats?.price_per_teacher ?? tierConfig.pricePerTeacher}/mo</p>
                </div>
                {billingStats?.current_period_end && (
                  <div>
                    <p className="text-muted-foreground">Renewal date</p>
                    <p className="font-semibold">{format(new Date(billingStats.current_period_end), "MMM d, yyyy")}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={billingStats?.status === "active" ? "default" : "secondary"} className="capitalize">
                    {billingStats?.status ?? "active"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seat Utilization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" /> Student Seats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{billingStats?.active_students ?? 0} used</span>
                  <span className="text-muted-foreground">
                    {billingStats?.student_seats === -1 ? "Unlimited" : `of ${billingStats?.student_seats ?? 50}`}
                  </span>
                </div>
                <Progress value={Math.min(billingStats?.student_utilization ?? 0, 100)} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" /> Teacher Seats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{billingStats?.active_teachers ?? 0} used</span>
                  <span className="text-muted-foreground">
                    {billingStats?.teacher_seats === -1 ? "Unlimited" : `of ${billingStats?.teacher_seats ?? 5}`}
                  </span>
                </div>
                <Progress value={Math.min(billingStats?.teacher_utilization ?? 0, 100)} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Plan Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    {tierOrder.map((t) => (
                      <TableHead key={t} className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={t === tier ? "font-bold text-primary" : ""}>{TIER_CONFIGS[t].label}</span>
                          {t === tier && <Badge variant="outline" className="text-[10px]">Current</Badge>}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Student Seats</TableCell>
                    {tierOrder.map((t) => (
                      <TableCell key={t} className="text-center">
                        {TIER_CONFIGS[t].maxStudentSeats === -1 ? "Unlimited" : `Up to ${TIER_CONFIGS[t].maxStudentSeats}`}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Teacher Seats</TableCell>
                    {tierOrder.map((t) => (
                      <TableCell key={t} className="text-center">
                        {TIER_CONFIGS[t].maxTeacherSeats === -1 ? "Unlimited" : `Up to ${TIER_CONFIGS[t].maxTeacherSeats}`}
                      </TableCell>
                    ))}
                  </TableRow>
                  {features.map((f) => (
                    <TableRow key={f.key}>
                      <TableCell className="font-medium">{f.label}</TableCell>
                      {tierOrder.map((t) => (
                        <TableCell key={t} className="text-center">
                          {formatLimit(TIER_CONFIGS[t].limits[f.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="font-medium">Price/Student</TableCell>
                    {tierOrder.map((t) => (
                      <TableCell key={t} className="text-center">₹{TIER_CONFIGS[t].pricePerStudent}/mo</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Price/Teacher</TableCell>
                    {tierOrder.map((t) => (
                      <TableCell key={t} className="text-center">₹{TIER_CONFIGS[t].pricePerTeacher}/mo</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Active Students</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{billingStats?.active_students ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Active Teachers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{billingStats?.active_teachers ?? 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">₹{((billingStats?.total_paid ?? 0) / 100).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" /> Seat Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Students</span>
                  <span className="text-muted-foreground">{billingStats?.student_utilization ?? 0}%</span>
                </div>
                <Progress value={Math.min(billingStats?.student_utilization ?? 0, 100)} className="h-3" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Teachers</span>
                  <span className="text-muted-foreground">{billingStats?.teacher_utilization ?? 0}%</span>
                </div>
                <Progress value={Math.min(billingStats?.teacher_utilization ?? 0, 100)} className="h-3" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5" /> Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : payments && payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Billing Period</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm">
                          {format(new Date(p.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{(p.amount / 100).toLocaleString()} {p.currency}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === "captured" ? "default" : "secondary"} className="capitalize">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {p.billing_period_start && p.billing_period_end
                            ? `${format(new Date(p.billing_period_start), "MMM d")} – ${format(new Date(p.billing_period_end), "MMM d, yyyy")}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">No payments yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function InstitutionBillingPage() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <BillingContent />
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
