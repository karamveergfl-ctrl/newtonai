import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useInstitution } from "@/hooks/useInstitution";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollProvider } from "@/contexts/ScrollContext";
import { Building2, Layers, BookOpen, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function InstitutionDashboardContent() {
  const navigate = useNavigate();
  const { institution, loading } = useInstitution();
  const [stats, setStats] = useState({ departments: 0, courses: 0, members: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!institution) return;
    const fetchStats = async () => {
      const [depts, courses, members] = await Promise.all([
        supabase.from("departments").select("id", { count: "exact", head: true }).eq("institution_id", institution.id),
        supabase.from("courses").select("id", { count: "exact", head: true }).in(
          "department_id",
          (await supabase.from("departments").select("id").eq("institution_id", institution.id)).data?.map(d => d.id) || []
        ),
        supabase.from("institution_members").select("id", { count: "exact", head: true }).eq("institution_id", institution.id),
      ]);
      setStats({
        departments: depts.count ?? 0,
        courses: courses.count ?? 0,
        members: members.count ?? 0,
      });
      setStatsLoading(false);
    };
    fetchStats();
  }, [institution]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">No Institution Found</h2>
          <p className="text-muted-foreground">You are not associated with any institution yet.</p>
        </div>
      </div>
    );
  }

  const cards = [
    { title: "Departments", value: stats.departments, icon: Layers, path: "/institution/departments", color: "text-blue-500" },
    { title: "Courses", value: stats.courses, icon: BookOpen, path: "/institution/courses", color: "text-green-500" },
    { title: "Members", value: stats.members, icon: Users, path: "/institution", color: "text-purple-500" },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {institution.logo_url && <img src={institution.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />}
          <div>
            <h1 className="text-2xl font-bold">{institution.name}</h1>
            <p className="text-sm text-muted-foreground capitalize">{institution.type} · {institution.timezone}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(card.path)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button variant="outline" className="h-20 text-lg" onClick={() => navigate("/institution/departments")}>
          <Layers className="h-5 w-5 mr-2" /> Manage Departments
        </Button>
        <Button variant="outline" className="h-20 text-lg" onClick={() => navigate("/institution/courses")}>
          <BookOpen className="h-5 w-5 mr-2" /> Manage Courses
        </Button>
      </div>
    </div>
  );
}

export default function InstitutionDashboard() {
  const navigate = useNavigate();
  return (
    <ScrollProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar onSignOut={() => { supabase.auth.signOut(); navigate("/auth"); }} />
          <InstitutionDashboardContent />
        </div>
      </SidebarProvider>
    </ScrollProvider>
  );
}
