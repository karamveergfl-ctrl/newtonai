import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAssignments } from "@/hooks/useAssignments";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, ClipboardList, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  content_ref: string | null;
}

const StudentClassView = () => {
  const { id } = useParams<{ id: string }>();
  const [className, setClassName] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const { assignments, loading: loadingAssignments } = useAssignments(id);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: cls } = await supabase.from("classes").select("name").eq("id", id).single();
      if (cls) setClassName(cls.name);

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
      <SEOHead title={className || "Class"} description="View class materials and assignments" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{className}</h1>

        <Tabs defaultValue="materials">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materials" className="gap-2">
              <FileText className="h-4 w-4" /> Materials
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="h-4 w-4" /> Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="mt-6">
            {loadingMaterials ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : materials.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No materials shared yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {materials.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium">{m.title}</p>
                        {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                        <Badge variant="outline" className="mt-1">{m.material_type}</Badge>
                      </div>
                      {m.content_ref && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={m.content_ref} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            {loadingAssignments ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : assignments.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {assignments.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="py-4">
                      <p className="font-medium">{a.title}</p>
                      {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{a.assignment_type}</Badge>
                        {a.due_date && (
                          <span className="text-sm text-muted-foreground">
                            Due: {new Date(a.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default StudentClassView;
