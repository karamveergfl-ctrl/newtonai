import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ScrollText, Search, File, Link as LinkIcon, Video, FileText, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { resolveMaterialUrl } from "@/utils/materialUrl";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

interface MaterialRow {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  content_ref: string | null;
  class_name: string;
  created_at: string;
}

const typeIcons: Record<string, typeof FileText> = { pdf: File, link: LinkIcon, video: Video };
const typeBorders: Record<string, string> = { pdf: "border-l-red-500", link: "border-l-blue-500", video: "border-l-purple-500" };

const TeacherMaterials = () => {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: classes } = await supabase
        .from("classes")
        .select("id, name")
        .eq("teacher_id", user.id);

      if (!classes || classes.length === 0) { setLoading(false); return; }

      const classIds = classes.map(c => c.id);
      const classNameMap = new Map(classes.map(c => [c.id, c.name]));

      const { data: mats } = await supabase
        .from("class_materials")
        .select("*")
        .in("class_id", classIds)
        .order("created_at", { ascending: false });

      setMaterials((mats || []).map(m => ({
        ...m,
        class_name: classNameMap.get(m.class_id) || "Class",
      })));
      setLoading(false);
    };
    fetchMaterials();
  }, []);

  const types = useMemo(() => {
    const set = new Set(materials.map(m => m.material_type.toLowerCase()));
    return Array.from(set);
  }, [materials]);

  const filtered = useMemo(() => {
    let result = materials;
    if (typeFilter) result = result.filter(m => m.material_type.toLowerCase() === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.class_name.toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [materials, search, typeFilter]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <SEOHead title="Materials" description="Manage teaching materials" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ScrollText className="h-8 w-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Materials</h1>
          <p className="text-muted-foreground mt-1">{materials.length} materials across all classes</p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search materials..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1.5">
            <Button variant={typeFilter === null ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(null)} className="text-xs">All</Button>
            {types.map(t => (
              <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" onClick={() => setTypeFilter(t)} className="text-xs capitalize">{t}</Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-border/50 text-center py-12">
            <CardContent>
              <ScrollText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{search || typeFilter ? "No materials match" : "No materials uploaded yet"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((m, i) => {
              const typeKey = m.material_type.toLowerCase();
              const Icon = typeIcons[typeKey] || FileText;
              const border = typeBorders[typeKey] || "border-l-primary";
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <Card className={`border-l-4 ${border} border-border/50`}>
                    <CardContent className="flex items-center justify-between py-3 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-muted/50 shrink-0"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{m.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[9px] h-4">{m.class_name}</Badge>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_at), "MMM d, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                      {m.content_ref && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={async () => {
                          const url = await resolveMaterialUrl(m.content_ref!);
                          window.open(url, "_blank", "noopener,noreferrer");
                        }}>
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
      </div>
    </AppLayout>
  );
};

export default TeacherMaterials;
