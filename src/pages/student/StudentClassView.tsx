import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { resolveMaterialUrl } from "@/utils/materialUrl";
import { useAssignments, Submission } from "@/hooks/useAssignments";
import { LiveQuizTaker } from "@/components/student/LiveQuizTaker";
import { StudentQuizTaker } from "@/components/student/StudentQuizTaker";
import { StudentPerformanceTab } from "@/components/student/StudentPerformanceTab";
import { AnnouncementsBanner } from "@/components/student/AnnouncementsBanner";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ClipboardList, ExternalLink, ArrowLeft, File, Link as LinkIcon, Video, Radio, Trophy, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import { AssignmentStatusBadge } from "@/components/student/AssignmentStatusBadge";
import { LiveSessionProvider } from "@/contexts/LiveSessionContext";
import { StudentLiveView } from "@/components/live-session";
import { LiveSessionBadge } from "@/components/live-session";

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  content_ref: string | null;
}

const materialIcons: Record<string, typeof FileText> = { pdf: File, link: LinkIcon, video: Video, default: FileText };
const materialBorderColors: Record<string, string> = { pdf: "border-l-red-500", link: "border-l-blue-500", video: "border-l-purple-500", default: "border-l-primary" };

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url);
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
}

function getSubmissionStatus(assignmentId: string, submissions: Submission[]): "not_started" | "submitted" | "graded" {
  const sub = submissions.find(s => s.assignment_id === assignmentId);
  if (!sub) return "not_started";
  if (sub.status === "graded") return "graded";
  return "submitted";
}

function getDaysUntilDue(dueDate: string): string {
  const diffDays = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}

const StudentClassView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState<{ name: string; subject?: string | null; academic_year?: string | null } | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const { assignments, loading: loadingAssignments, fetchMySubmissions, submitAssignment } = useAssignments(id);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);

  // Assignment interaction states
  const [activeAssignmentId, setActiveAssignmentId] = useState<string | null>(null);

  // Live quiz detection
  const [liveSession, setLiveSession] = useState<any>(null);
  const [takingQuiz, setTakingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);

  // Past ended sessions for report links
  const [endedSessions, setEndedSessions] = useState<{ id: string; title: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: cls } = await supabase.from("classes").select("name, subject, academic_year").eq("id", id).single();
      if (cls) setClassInfo(cls);

      const { data: mats } = await supabase
        .from("class_materials")
        .select("*")
        .eq("class_id", id)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });
      setMaterials(mats || []);
      setLoadingMaterials(false);

      // Fetch past ended/completed sessions for report links
      const { data: pastSessions } = await supabase
        .from("live_sessions" as any)
        .select("id, title, created_at")
        .eq("class_id", id)
        .in("status", ["ended", "completed"])
        .order("created_at", { ascending: false })
        .limit(5);
      setEndedSessions((pastSessions as any[]) || []);
    };
    fetchData();
  }, [id]);

  // Fetch student's submissions
  useEffect(() => {
    if (!id || assignments.length === 0) return;
    fetchMySubmissions(id).then(setMySubmissions);
  }, [id, assignments]);

  // Poll for active live session (teaching or quiz_active)
  const [teachingSession, setTeachingSession] = useState<any>(null);
  useEffect(() => {
    if (!id) return;
    const pollSession = async () => {
      // Get quiz_active session for quiz taking
      const { data: quizData } = await supabase
        .from("live_sessions" as any)
        .select("*")
        .eq("class_id", id)
        .eq("status", "quiz_active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setLiveSession(quizData);

      // Get teaching session for pulse/questions
      const { data: teachData } = await supabase
        .from("live_sessions" as any)
        .select("*")
        .eq("class_id", id)
        .in("status", ["teaching", "quiz_active"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setTeachingSession(teachData);
    };
    pollSession();
    const interval = setInterval(pollSession, 5000);
    return () => clearInterval(interval);
  }, [id]);

  // If taking a regular assignment quiz
  if (activeAssignmentId) {
    const existingSub = mySubmissions.find(s => s.assignment_id === activeAssignmentId);
    return (
      <AppLayout>
        <SEOHead title="Quiz" description="Take assignment quiz" noIndex />
        <div className="container max-w-4xl mx-auto px-4 py-6">
          <StudentQuizTaker
            assignmentId={activeAssignmentId}
            existingSubmission={existingSub ? { score: existingSub.score, answers: existingSub.answers, status: existingSub.status } : null}
            onComplete={(score, total) => {
              setActiveAssignmentId(null);
              setQuizResult({ score, total });
              if (id) fetchMySubmissions(id).then(setMySubmissions);
            }}
            onCancel={() => setActiveAssignmentId(null)}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title={classInfo?.name || "Class"} description="View class materials and assignments" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/student/classes")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">{classInfo?.name || "Class"}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {classInfo?.subject && <Badge variant="secondary" className="text-xs">{classInfo.subject}</Badge>}
              {classInfo?.academic_year && <Badge variant="outline" className="text-xs">{classInfo.academic_year}</Badge>}
              {teachingSession && (
                <LiveSessionBadge sessionId={teachingSession.id} role="student" label={classInfo?.name} />
              )}
            </div>
          </div>
        </motion.div>

        {/* Announcements */}
        {id && <AnnouncementsBanner classId={id} />}

        {/* Live Quiz Banner */}
        {liveSession && !takingQuiz && !quizResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
            <Card className="border-destructive/30 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Radio className="h-5 w-5 text-red-500" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Live Quiz!</p>
                    <p className="text-xs text-muted-foreground">{liveSession.title} — {liveSession.time_limit_minutes} min</p>
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => setTakingQuiz(true)}>Start Quiz</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quiz Result */}
        {quizResult && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
            <Card className="border-border/50 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
              <CardContent className="py-6 text-center">
                <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{quizResult.score}/{quizResult.total}</p>
                <p className="text-sm text-muted-foreground">{Math.round((quizResult.score / quizResult.total) * 100)}% — Quiz Submitted!</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setQuizResult(null)}>Dismiss</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Taking Live Quiz */}
        {takingQuiz && liveSession && (
          <LiveQuizTaker
            assignmentId={liveSession.assignment_id}
            quizStartedAt={liveSession.quiz_started_at}
            timeLimitMinutes={liveSession.time_limit_minutes}
            onComplete={(score, total) => { setTakingQuiz(false); setQuizResult({ score, total }); }}
          />
        )}

        {/* Wrap content with StudentLiveView when a teaching session is active */}
        {teachingSession && !takingQuiz && (
          <LiveSessionProvider
            sessionId={teachingSession.id}
            role="student"
            initialSettings={{
              pulse_enabled: teachingSession.pulse_enabled,
              questions_enabled: teachingSession.questions_enabled,
              confusion_threshold: teachingSession.confusion_threshold,
            }}
          >
            <StudentLiveView sessionId={teachingSession.id}>
              <div />
            </StudentLiveView>
          </LiveSessionProvider>
        )}

        {!takingQuiz && (
          <Tabs defaultValue="materials">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="materials" className="gap-1.5 text-sm"><FileText className="h-4 w-4" /> Materials</TabsTrigger>
              <TabsTrigger value="assignments" className="gap-1.5 text-sm"><ClipboardList className="h-4 w-4" /> Assignments</TabsTrigger>
              <TabsTrigger value="performance" className="gap-1.5 text-sm"><TrendingUp className="h-4 w-4" /> Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="materials" className="mt-5">
              {loadingMaterials ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : materials.length === 0 ? (
                <Card className="text-center py-12 border-border/50">
                  <CardContent>
                    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No materials shared yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {materials.map((m, i) => {
                    const typeKey = m.material_type.toLowerCase();
                    const Icon = materialIcons[typeKey] || materialIcons.default;
                    const borderColor = materialBorderColors[typeKey] || materialBorderColors.default;
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Card className={`border-l-4 ${borderColor} border-border/50 ${m.content_ref ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}`} onClick={async () => {
                          if (!m.content_ref) return;
                          const url = await resolveMaterialUrl(m.content_ref);
                          const type = m.material_type.toLowerCase();
                          if (type === "pdf" || type === "document") {
                            navigate("/dashboard", { state: { materialUrl: url, materialName: m.title, returnTo: `/student/classes/${id}`, isPdf: true } });
                          } else if (type === "video" || isYouTubeUrl(m.content_ref)) {
                            navigate("/dashboard", { state: { materialVideoUrl: url, materialName: m.title, returnTo: `/student/classes/${id}` } });
                          } else {
                            window.open(url, "_blank", "noopener,noreferrer");
                          }
                        }}>
                          <CardContent className="flex items-center justify-between py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted/50"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                              <div>
                                <p className="font-medium text-sm">{m.title}</p>
                                {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                              </div>
                            </div>
                            {m.content_ref && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={async (e) => { e.stopPropagation(); const url = await resolveMaterialUrl(m.content_ref!); window.open(url, "_blank", "noopener,noreferrer"); }}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="mt-5">
              {loadingAssignments ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : assignments.length === 0 ? (
                <Card className="text-center py-12 border-border/50">
                  <CardContent>
                    <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No assignments yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {assignments.map((a, i) => {
                    const status = getSubmissionStatus(a.id, mySubmissions);
                    const sub = mySubmissions.find(s => s.assignment_id === a.id);
                    const isQuiz = a.assignment_type === "quiz";
                    return (
                      <motion.div key={a.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                        <Card
                          className={`border-border/50 cursor-pointer hover:border-primary/30 transition-colors ${status === "graded" ? "border-l-4 border-l-green-500" : status === "submitted" ? "border-l-4 border-l-amber-500" : ""}`}
                          onClick={() => isQuiz && setActiveAssignmentId(a.id)}
                        >
                          <CardContent className="py-3 px-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{a.title}</p>
                                {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-[10px] h-5">{a.assignment_type}</Badge>
                                  <AssignmentStatusBadge status={status} />
                                  {status === "graded" && sub?.score != null && (
                                    <Badge variant="secondary" className="text-[10px] h-5">
                                      Score: {sub.score}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {a.due_date && (
                                <span className={`text-xs font-medium shrink-0 ${new Date(a.due_date) < new Date() ? "text-destructive" : "text-muted-foreground"}`}>
                                  {getDaysUntilDue(a.due_date)}
                                </span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="performance" className="mt-5">
              {/* Past session reports */}
              {endedSessions.length > 0 && (
                <Card className="border-border/50 mb-4">
                  <CardContent className="py-3 px-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Past Session Reports</p>
                    <div className="space-y-1.5">
                      {endedSessions.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => navigate(`/report/student/${s.id}`)}
                          className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <BarChart3 className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs truncate">{s.title}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {id && <StudentPerformanceTab classId={id} />}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentClassView;
