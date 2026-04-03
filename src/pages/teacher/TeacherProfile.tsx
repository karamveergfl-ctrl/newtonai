import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppLayout } from "@/components/AppLayout";
import SEOHead from "@/components/SEOHead";
import { toast } from "sonner";
import {
  User, GraduationCap, Users, Radio, Clock, MessageCircle,
  Edit2, Save, X, ArrowLeft, Loader2, Building, Phone, IdCard, BookOpen
} from "lucide-react";

interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  totalSessions: number;
  totalHours: number;
  chatAnswered: number;
}

interface TeacherProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  teacher_preferences: any;
  created_at: string;
}

const TeacherProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<TeacherStats>({ totalClasses: 0, totalStudents: 0, totalSessions: 0, totalHours: 0, chatAnswered: 0 });

  // Editable fields
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [department, setDepartment] = useState("");
  const [facultyId, setFacultyId] = useState("");

  const fetchProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    setEmail(session.user.email || "");

    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    if (data) {
      setProfile(data as any);
      setFullName(data.full_name || "");
      setBio(data.bio || "");
      const prefs = (data as any).teacher_preferences || {};
      setPhone(prefs.phone || "");
      setInstitutionName(prefs.institution_name || "");
      setDepartment(prefs.department || "");
      setFacultyId(prefs.faculty_id || "");
    }

    // Fetch stats
    const userId = session.user.id;
    const [classesRes, sessionsRes, chatRes] = await Promise.all([
      supabase.from("classes").select("id", { count: "exact" }).eq("teacher_id", userId),
      supabase.from("live_sessions" as any).select("id, started_at, status").eq("teacher_id", userId),
      supabase.from("newton_conversations").select("id", { count: "exact" }).eq("user_id", userId),
    ]);

    const classIds = (classesRes.data || []).map((c: any) => c.id);
    let totalStudents = 0;
    if (classIds.length > 0) {
      const { count } = await supabase.from("class_enrollments").select("id", { count: "exact" }).in("class_id", classIds).eq("status", "active");
      totalStudents = count || 0;
    }

    const sessions = sessionsRes.data || [];
    const endedSessions = sessions.filter((s: any) => s.status === "ended");
    // Approximate hours from session count (avg 45min per session)
    const totalHours = Math.round(endedSessions.length * 0.75 * 10) / 10;

    setStats({
      totalClasses: classesRes.count || 0,
      totalStudents,
      totalSessions: endedSessions.length,
      totalHours,
      chatAnswered: chatRes.count || 0,
    });

    setLoading(false);
  }, [navigate]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const currentPrefs = profile.teacher_preferences || {};
      await supabase.from("profiles").update({
        full_name: fullName,
        bio,
        teacher_preferences: { ...currentPrefs, phone, institution_name: institutionName, department, faculty_id: facultyId },
      } as any).eq("id", profile.id);
      toast.success("Profile updated!");
      setEditing(false);
      fetchProfile();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const statCards = useMemo(() => [
    { label: "Classes Created", value: stats.totalClasses, icon: GraduationCap, color: "text-primary" },
    { label: "Students Taught", value: stats.totalStudents, icon: Users, color: "text-emerald-500" },
    { label: "Live Sessions", value: stats.totalSessions, icon: Radio, color: "text-destructive" },
    { label: "Teaching Hours", value: stats.totalHours, icon: Clock, color: "text-amber-500" },
    { label: "Chat Conversations", value: stats.chatAnswered, icon: MessageCircle, color: "text-secondary" },
  ], [stats]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Teacher Profile" description="Manage your teaching profile" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/teacher")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        {/* Profile Header */}
        <Card className="mb-6 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{profile?.full_name || "Teacher"}</h1>
                    <p className="text-muted-foreground text-sm">{email}</p>
                    {institutionName && (
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{institutionName}</span>
                      </div>
                    )}
                  </div>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                {profile?.bio && !editing && <p className="text-sm text-foreground mt-2">{profile.bio}</p>}
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Badge variant="secondary">{profile?.teacher_preferences?.class_level || "Teacher"}</Badge>
                  <Badge variant="outline">{profile?.teacher_preferences?.teaching_style || "Hybrid"}</Badge>
                  {department && <Badge variant="outline">{department}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50">
                <CardContent className="pt-4 pb-3 text-center">
                  <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Editable Form */}
        {editing && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Dr. Jane Smith" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Institution Name</label>
                    <Input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} placeholder="Delhi University" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Department</label>
                    <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Faculty / Employee ID</label>
                    <Input value={facultyId} onChange={(e) => setFacultyId(e.target.value)} placeholder="FAC-2024-001" />
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Bio</label>
                  <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short description about yourself" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Member Since */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}
        </p>
      </div>
    </AppLayout>
  );
};

export default TeacherProfile;
