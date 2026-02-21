import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClassData {
  id: string;
  teacher_id: string;
  name: string;
  subject: string | null;
  description: string | null;
  invite_code: string;
  academic_year: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClassWithStats extends ClassData {
  student_count?: number;
}

export function useClasses() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch classes:", error);
      setClasses([]);
    } else {
      // Fetch enrollment counts for each class
      const classesWithStats: ClassWithStats[] = await Promise.all(
        (data || []).map(async (cls) => {
          const { count } = await supabase
            .from("class_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id)
            .eq("status", "active");
          return { ...cls, student_count: count || 0 };
        })
      );
      setClasses(classesWithStats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const createClass = async (data: { name: string; subject?: string; description?: string; academic_year?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: newClass, error } = await supabase
      .from("classes")
      .insert({ ...data, teacher_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create class: " + error.message);
      return null;
    }

    toast.success("Class created!");
    await fetchClasses();
    return newClass;
  };

  const deleteClass = async (classId: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) {
      toast.error("Failed to delete class");
      return false;
    }
    toast.success("Class deleted");
    await fetchClasses();
    return true;
  };

  const joinClass = async (code: string) => {
    const { data, error } = await supabase.rpc("join_class_by_code", { p_code: code });
    if (error) {
      toast.error("Failed to join class");
      return null;
    }
    const result = data as any;
    if (!result.success) {
      toast.error(result.error);
      return null;
    }
    toast.success(`Joined ${result.class_name}!`);
    await fetchClasses();
    return result;
  };

  return { classes, loading, fetchClasses, createClass, deleteClass, joinClass };
}
