import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  assignment_type: string;
  content: any;
  due_date: string | null;
  is_published: boolean;
  max_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  answers: any;
  score: number | null;
  graded_at: string | null;
  submitted_at: string;
  status: string;
}

export function useAssignments(classId?: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    if (!classId) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });

    if (error) console.error("Failed to fetch assignments:", error);
    setAssignments(data || []);
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const createAssignment = async (data: {
    class_id: string;
    title: string;
    description?: string;
    assignment_type: string;
    content: any;
    due_date?: string;
    max_score?: number;
    is_published?: boolean;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: newAssignment, error } = await supabase
      .from("assignments")
      .insert({ ...data, teacher_id: user.id })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create assignment");
      return null;
    }

    toast.success("Assignment created!");
    await fetchAssignments();
    return newAssignment;
  };

  const publishAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from("assignments")
      .update({ is_published: true })
      .eq("id", assignmentId);

    if (error) {
      toast.error("Failed to publish");
      return false;
    }
    toast.success("Assignment published!");
    await fetchAssignments();
    return true;
  };

  const submitAssignment = async (assignmentId: string, answers: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("assignment_submissions")
      .insert({ assignment_id: assignmentId, student_id: user.id, answers })
      .select()
      .single();

    if (error) {
      toast.error("Failed to submit: " + error.message);
      return null;
    }

    // Auto-grade if quiz
    if (data) {
      const { data: gradeResult } = await supabase.rpc("auto_grade_quiz_submission", {
        p_submission_id: data.id,
      });
      const result = gradeResult as any;
      if (result?.success) {
        toast.success(`Scored ${result.score}/${result.total} (${result.percentage}%)`);
        return { ...data, score: result.score };
      }
    }

    toast.success("Submitted!");
    return data;
  };

  const fetchSubmissions = async (assignmentId: string): Promise<Submission[]> => {
    const { data, error } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("assignment_id", assignmentId);

    if (error) {
      console.error("Failed to fetch submissions:", error);
      return [];
    }
    return data || [];
  };

  const deleteAssignment = async (assignmentId: string) => {
    const { error } = await supabase
      .from("assignments")
      .delete()
      .eq("id", assignmentId);

    if (error) {
      toast.error("Failed to delete assignment");
      return false;
    }
    toast.success("Assignment deleted");
    await fetchAssignments();
    return true;
  };

  const fetchMySubmissions = async (classId: string): Promise<Submission[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("student_id", user.id);

    if (error) {
      console.error("Failed to fetch my submissions:", error);
      return [];
    }

    // Filter to only assignments in this class
    const classAssignmentIds = assignments.map(a => a.id);
    return (data || []).filter(s => classAssignmentIds.includes(s.assignment_id));
  };

  return {
    assignments,
    loading,
    fetchAssignments,
    createAssignment,
    publishAssignment,
    submitAssignment,
    fetchSubmissions,
    fetchMySubmissions,
    deleteAssignment,
  };
}
