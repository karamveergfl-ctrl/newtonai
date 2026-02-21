import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ClipboardList, ExternalLink, ArrowLeft, File, Link as LinkIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";
import { AssignmentStatusBadge } from "@/components/student/AssignmentStatusBadge";

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  content_ref: string | null;
}

const materialIcons: Record<string, typeof FileText> = {
  pdf: File,
  link: LinkIcon,
  video: Video,
  default: FileText,
};

const materialBorderColors: Record<string, string> = {
  pdf: "border-l-red-500",
  link: "border-l-blue-500",
  video: "border-l-purple-500",
  default: "border-l-primary",
};

function getDueDateStatus(dueDate: string | null): "not_started" | "overdue" {
  if (!dueDate) return "not_started";
  return new Date(dueDate) < new Date() ? "overdue" : "not_started";
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
  const { assignments, loading: loadingAssignments } = useAssignments(id);

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
    };
    fetchData();
  }, [id]);

  return (
    <AppLayout>
      <SEOHead title={classInfo?.name || "Class"} description="View class materials and assignments" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 mb-6"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate("/student/classes")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">{classInfo?.name || "Class"}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {classInfo?.subject && <Badge variant="secondary" className="text-xs">{classInfo.subject}</Badge>}
              {classInfo?.academic_year && <Badge variant="outline" className="text-xs">{classInfo.academic_year}</Badge>}
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="materials">
          <TabsList className="grid w-full grid-cols-2 h-10">
            <TabsTrigger value="materials" className="gap-1.5 text-sm">
              <FileText className="h-4 w-4" /> Materials
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5 text-sm">
              <ClipboardList className="h-4 w-4" /> Assignments
            </TabsTrigger>
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
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className={`border-l-4 ${borderColor} border-border/50`}>
                        <CardContent className="flex items-center justify-between py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/50">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{m.title}</p>
                              {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                            </div>
                          </div>
                          {m.content_ref && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                              <a href={m.content_ref} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
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
                  const status = getDueDateStatus(a.due_date);
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Card className="border-border/50">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{a.title}</p>
                              {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] h-5">{a.assignment_type}</Badge>
                                <AssignmentStatusBadge status={status} />
                              </div>
                            </div>
                            {a.due_date && (
                              <span className={`text-xs font-medium shrink-0 ${status === "overdue" ? "text-destructive" : "text-muted-foreground"}`}>
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default StudentClassView;
