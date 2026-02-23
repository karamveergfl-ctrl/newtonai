import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { InviteCodePill } from "@/components/teacher/InviteCodePill";
import { ClassAnalyticsCharts } from "@/components/teacher/ClassAnalyticsCharts";
import { StudentProgressTable } from "@/components/teacher/StudentProgressTable";
import { AssignmentResultsPanel } from "@/components/teacher/AssignmentResultsPanel";
import { AttendanceGrid } from "@/components/teacher/AttendanceGrid";
import { LiveSessionDialog } from "@/components/teacher/LiveSessionDialog";
import { LiveSessionPanel } from "@/components/teacher/LiveSessionPanel";
import { ClassAnnouncementInput } from "@/components/teacher/ClassAnnouncementInput";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Users, FileText, ClipboardList, BarChart3, MoreHorizontal, ArrowLeft, Share2, Radio, Trash2, Eye, BookOpen, Plus, ExternalLink, File, Link as LinkIcon, Video } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface ClassInfo {
  id: string;
  name: string;
  subject: string | null;
  description: string | null;
  invite_code: string;
  academic_year: string | null;
}

interface Enrollment {
  id: string;
  student_id: string;
  enrolled_at: string;
  status: string;
  profile?: { full_name: string | null };
}

interface ClassMaterial {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  content_ref: string | null;
  is_visible: boolean;
  created_at: string;
}

const ClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingClass, setLoadingClass] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const { assignments, loading: loadingAssignments, deleteAssignment, fetchSubmissions } = useAssignments(id);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});

  // Materials state
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);

  const fetchActiveSession = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("live_sessions" as any)
      .select("*")
      .eq("class_id", id)
      .in("status", ["teaching", "quiz_active", "completed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActiveSession(data);
  }, [id]);

  useEffect(() => { fetchActiveSession(); }, [fetchActiveSession]);

  const fetchMaterials = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from("class_materials")
      .select("*")
      .eq("class_id", id)
      .order("created_at", { ascending: false });
    setMaterials(data || []);
    setLoadingMaterials(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchClass = async () => {
      const { data } = await supabase.from("classes").select("*").eq("id", id).single();
      setClassInfo(data);
      setLoadingClass(false);
    };

    const fetchEnrollments = async () => {
      const { data } = await supabase
        .from("class_enrollments")
        .select("*")
        .eq("class_id", id)
        .eq("status", "active");

      if (data) {
        const enriched = await Promise.all(
          data.map(async (e) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", e.student_id)
              .maybeSingle();
            return { ...e, profile };
          })
        );
        setEnrollments(enriched);
      }
    };

    fetchClass();
    fetchEnrollments();
    fetchMaterials();
  }, [id, fetchMaterials]);

  // Fetch submission counts for assignments
  useEffect(() => {
    if (assignments.length === 0) return;
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        assignments.map(async (a) => {
          const subs = await fetchSubmissions(a.id);
          counts[a.id] = subs.length;
        })
      );
      setSubmissionCounts(counts);
    };
    fetchCounts();
  }, [assignments]);

  const removeStudent = async (enrollmentId: string) => {
    const { error } = await supabase
      .from("class_enrollments")
      .update({ status: "removed" })
      .eq("id", enrollmentId);
    if (error) {
      toast.error("Failed to remove student");
    } else {
      setEnrollments((prev) => prev.filter((e) => e.id !== enrollmentId));
      toast.success("Student removed");
    }
  };

  const shareInvite = () => {
    const link = `${window.location.origin}/join-class?code=${classInfo?.invite_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied!");
  };

  const deleteMaterial = async (materialId: string) => {
    const { error } = await supabase.from("class_materials").delete().eq("id", materialId);
    if (error) {
      toast.error("Failed to delete material");
    } else {
      toast.success("Material deleted");
      fetchMaterials();
    }
  };

  if (loadingClass) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!classInfo) {
    return (
      <AppLayout>
        <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Class not found</h1>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title={classInfo.name} description="Manage your class" noIndex />
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate("/teacher")} className="shrink-0 self-start">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display font-bold truncate">{classInfo.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {classInfo.subject && <Badge variant="secondary" className="text-xs">{classInfo.subject}</Badge>}
              {classInfo.academic_year && <Badge variant="outline" className="text-xs">{classInfo.academic_year}</Badge>}
              <InviteCodePill code={classInfo.invite_code} />
            </div>
          </div>
          {!activeSession || activeSession.status === "completed" ? (
            <LiveSessionDialog classId={id!} onSessionStarted={fetchActiveSession}>
              <Button size="sm" className="gap-1.5 shrink-0">
                <Radio className="h-3.5 w-3.5" /> Live Session
              </Button>
            </LiveSessionDialog>
          ) : null}
        </motion.div>

        {/* Announcements Input */}
        {id && <ClassAnnouncementInput classId={id} />}

        {activeSession && (
          <LiveSessionPanel classId={id!} session={activeSession} onUpdate={fetchActiveSession} />
        )}

        {classInfo.description && (
          <p className="text-muted-foreground text-sm mb-6">{classInfo.description}</p>
        )}

        <Tabs defaultValue="students">
          <TabsList className="grid w-full grid-cols-4 h-10">
            <TabsTrigger value="students" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span> ({enrollments.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5 text-xs sm:text-sm">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span> ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="mt-5">
            {enrollments.length === 0 ? (
              <Card className="text-center py-12 border-border/50">
                <CardContent>
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No students enrolled yet. Share the invite code!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {enrollments.map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="border-border/50">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                            {(e.profile?.full_name || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{e.profile?.full_name || "Unknown Student"}</p>
                            <p className="text-xs text-muted-foreground">Joined {new Date(e.enrolled_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => removeStudent(e.id)} className="text-destructive focus:text-destructive">
                              Remove Student
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assignments Tab - Enhanced with actions */}
          <TabsContent value="assignments" className="mt-5">
            {loadingAssignments ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : assignments.length === 0 ? (
              <Card className="text-center py-12 border-border/50">
                <CardContent>
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {assignments.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Card className="border-border/50">
                      <CardContent className="flex items-center justify-between py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${a.is_published ? "bg-green-500" : "bg-amber-400"}`} />
                          <div>
                            <p className="font-medium text-sm">{a.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px] h-5">{a.assignment_type}</Badge>
                              {a.is_published ? (
                                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">Published</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-medium">Draft</span>
                              )}
                              {submissionCounts[a.id] != null && (
                                <Badge variant="secondary" className="text-[10px] h-5">
                                  {submissionCounts[a.id]} submission{submissionCounts[a.id] !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {a.due_date && <DueDateBadge dueDate={a.due_date} />}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                const tabEl = document.querySelector('[data-value="analytics"]') as HTMLElement;
                                tabEl?.click();
                              }}>
                                <Eye className="h-3.5 w-3.5 mr-2" /> View Results
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteAssignment(a.id)} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="mt-5">
            <AddMaterialDialog classId={id!} onAdded={fetchMaterials} />
            {loadingMaterials ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : materials.length === 0 ? (
              <Card className="text-center py-12 border-border/50">
                <CardContent>
                  <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No materials yet. Add one above!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {materials.map((m, i) => {
                  const typeIcons: Record<string, typeof FileText> = { pdf: File, link: LinkIcon, video: Video, document: FileText, default: FileText };
                  const Icon = typeIcons[m.material_type.toLowerCase()] || typeIcons.default;
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <Card className="border-border/50">
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/50"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                            <div>
                              <p className="font-medium text-sm">{m.title}</p>
                              {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {m.content_ref && (
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <a href={m.content_ref} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMaterial(m.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-5">
            <AnalyticsTab classId={id!} />
          </TabsContent>
        </Tabs>

        {/* Mobile FAB */}
        {isMobile && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
            onClick={shareInvite}
          >
            <Share2 className="h-5 w-5" />
          </motion.button>
        )}
      </div>
    </AppLayout>
  );
};

function AddMaterialDialog({ classId, onAdded }: { classId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("link");
  const [contentRef, setContentRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isFileType = type === "document";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (isFileType && !file) { toast.error("Please select a file"); return; }
    if (!isFileType && !contentRef.trim()) { toast.error("Please enter a URL"); return; }

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    let finalRef = contentRef.trim() || null;
    let finalType = type;

    // Upload file to Supabase storage if document type
    if (isFileType && file) {
      setUploading(true);
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const filePath = `${classId}/${crypto.randomUUID()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("class-materials")
        .upload(filePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        // If bucket doesn't exist, fall back to base64 data URL approach
        console.error("Upload error:", uploadError);
        toast.error("File upload failed. Saving as reference only.");
        finalRef = file.name;
        finalType = ext === "pdf" ? "pdf" : "document";
      } else {
        const { data: urlData } = supabase.storage.from("class-materials").getPublicUrl(filePath);
        finalRef = urlData.publicUrl;
        finalType = ext === "pdf" ? "pdf" : "document";
      }
      setUploading(false);
    }

    const { error } = await supabase.from("class_materials").insert({
      class_id: classId,
      teacher_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      material_type: finalType,
      content_ref: finalRef,
    });

    setSaving(false);
    if (error) {
      toast.error("Failed to add material");
    } else {
      toast.success("Material added!");
      setTitle(""); setDescription(""); setContentRef(""); setFile(null); setOpen(false);
      onAdded();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 mb-4">
          <Plus className="h-3.5 w-3.5" /> Add Material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Material</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Select value={type} onValueChange={(v) => { setType(v); setFile(null); setContentRef(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="pdf">PDF Link</SelectItem>
              <SelectItem value="video">Video Link</SelectItem>
              <SelectItem value="document">Upload Document</SelectItem>
            </SelectContent>
          </Select>

          {isFileType ? (
            <div className="border-2 border-dashed border-border rounded-lg p-5 text-center">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="material-file-upload"
              />
              <label htmlFor="material-file-upload" className="cursor-pointer">
                <File className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {file ? file.name : "Click to upload PDF, DOCX, PPTX, or TXT"}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">Max 20MB</p>
              </label>
            </div>
          ) : (
            <Input placeholder="URL" value={contentRef} onChange={(e) => setContentRef(e.target.value)} />
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !title.trim() || (isFileType ? !file : !contentRef.trim())}
            className="w-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {uploading ? "Uploading..." : "Saving..."}
              </>
            ) : (
              "Add Material"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DueDateBadge({ dueDate }: { dueDate: string }) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return <span className="text-xs text-destructive font-medium">Overdue</span>;
  if (diffDays === 0) return <span className="text-xs text-amber-500 font-medium">Due today</span>;
  if (diffDays <= 3) return <span className="text-xs text-amber-500 font-medium">Due in {diffDays}d</span>;
  return <span className="text-xs text-muted-foreground">{due.toLocaleDateString()}</span>;
}

function AnalyticsTab({ classId }: { classId: string }) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [studentProgress, setStudentProgress] = useState<any>(null);
  const [assignmentResults, setAssignmentResults] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const [analyticsRes, progressRes, resultsRes, attendanceRes] = await Promise.all([
        supabase.rpc("get_class_analytics", { p_class_id: classId }),
        supabase.rpc("get_student_progress", { p_class_id: classId } as any),
        supabase.rpc("get_assignment_results", { p_class_id: classId } as any),
        supabase.rpc("get_attendance_grid", { p_class_id: classId } as any),
      ]);
      setAnalytics(analyticsRes.data);
      setStudentProgress(progressRes.data);
      setAssignmentResults(resultsRes.data);
      setAttendanceData(attendanceRes.data);
      setLoading(false);
    };
    fetchAll();
  }, [classId]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!analytics?.success) return <p className="text-muted-foreground text-center py-12">Failed to load analytics</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Students", value: analytics.enrollment_count },
          { label: "Assignments", value: analytics.assignment_count },
          { label: "Submissions", value: analytics.submission_count },
          { label: "Avg Score", value: analytics.average_score ?? "—" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-5 pb-4 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="students" className="text-xs">Students</TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs">Results</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ClassAnalyticsCharts analytics={analytics} assignmentResults={assignmentResults?.assignments} />
        </TabsContent>
        <TabsContent value="students">
          <StudentProgressTable students={studentProgress?.students || []} assignmentResults={assignmentResults?.assignments} />
        </TabsContent>
        <TabsContent value="assignments">
          <AssignmentResultsPanel assignments={assignmentResults?.assignments || []} />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceGrid students={attendanceData?.students || []} assignments={attendanceData?.assignments || []} attendance={attendanceData?.attendance || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ClassDetail;
