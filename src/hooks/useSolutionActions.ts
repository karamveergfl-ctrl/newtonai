import { useState, useCallback } from "react";
import { getAuthHeaders } from "@/lib/getAuthHeaders";
import { parseSSEStream } from "@/lib/parseSSEStream";
import { useToast } from "@/hooks/use-toast";

interface SolutionData {
  content: string;
  isQuestion: boolean;
  capturedImage?: string;
  isStreaming?: boolean;
}

export function useSolutionActions(
  solutionData: SolutionData | null,
  setSolutionData: React.Dispatch<React.SetStateAction<SolutionData | null>>,
  searchQuery: string
) {
  const { toast } = useToast();
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);
  const [isFindingSimilar, setIsFindingSimilar] = useState(false);
  const [isGettingDetailed, setIsGettingDetailed] = useState(false);
  const [isSolvingSimilar, setIsSolvingSimilar] = useState(false);

  const handleFollowUpQuestion = useCallback(async (question: string) => {
    if (!solutionData) return;
    setIsAnsweringFollowUp(true);
    try {
      const { headers } = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/solution-chat`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            imageData: solutionData.capturedImage,
            currentSolution: solutionData.content,
            question,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to get answer");

      let answer = "";
      await parseSSEStream(response, (accumulated) => {
        answer = accumulated;
        setSolutionData(prev => prev ? {
          ...prev,
          content: prev.content + "\n\n---\n\n**Follow-up:** " + question + "\n\n" + answer,
        } : null);
      });

      setSolutionData(prev => prev ? {
        ...prev,
        content: prev.content.includes("**Follow-up:**")
          ? prev.content
          : prev.content + "\n\n---\n\n**Follow-up:** " + question + "\n\n" + answer,
      } : null);
    } catch (error) {
      console.error("Error with follow-up:", error);
      toast({ title: "Error", description: "Failed to answer follow-up question", variant: "destructive" });
    } finally {
      setIsAnsweringFollowUp(false);
    }
  }, [solutionData, setSolutionData, toast]);

  const handleFindSimilar = useCallback(async () => {
    if (!searchQuery) return;
    setIsFindingSimilar(true);
    try {
      const { headers } = await getAuthHeaders();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-similar`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            topic: searchQuery,
            problemType: solutionData?.isQuestion ? "numerical" : "concept",
            currentSolution: solutionData?.content?.slice(0, 2000),
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to find similar questions");
      const data = await response.json();

      if (data.similarProblems) {
        setSolutionData(prev => prev ? {
          ...prev,
          content: prev.content + "\n\n---\n\n# 📝 Practice These Similar Problems\n\n" + data.similarProblems,
        } : null);
      }

      toast({
        title: "Practice Problem Found! 📚",
        description: `Generated 1 practice problem + ${data.videos?.length || 0} video solutions`,
      });

      return data; // caller can use data.videos
    } catch (error) {
      console.error("Error finding similar:", error);
      toast({ title: "Error", description: "Failed to find similar questions", variant: "destructive" });
      return null;
    } finally {
      setIsFindingSimilar(false);
    }
  }, [searchQuery, solutionData, setSolutionData, toast]);

  const handleGetDetailedSolution = useCallback(async () => {
    if (!solutionData) return;
    setIsGettingDetailed(true);
    try {
      const { headers } = await getAuthHeaders();
      setSolutionData(prev => prev ? { ...prev, content: "", isStreaming: true } : null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detailed-solution`,
        {
          method: "POST", headers,
          body: JSON.stringify({
            imageData: solutionData.capturedImage,
            currentSolution: solutionData.content,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to get detailed solution");

      const final = await parseSSEStream(response, (accumulated) => {
        setSolutionData(prev => prev ? { ...prev, content: accumulated, isStreaming: true } : null);
      });

      setSolutionData(prev => prev ? { ...prev, content: final, isStreaming: false } : null);
    } catch (error) {
      console.error("Error getting detailed solution:", error);
      toast({ title: "Error", description: "Failed to get detailed solution", variant: "destructive" });
    } finally {
      setIsGettingDetailed(false);
    }
  }, [solutionData, setSolutionData, toast]);

  const handleSolveSimilar = useCallback(async (problemText: string) => {
    setIsSolvingSimilar(true);
    try {
      const { headers } = await getAuthHeaders();
      setSolutionData(prev => prev ? { ...prev, content: "", isStreaming: true } : null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detailed-solution`,
        {
          method: "POST", headers,
          body: JSON.stringify({ problemText, isSimilarProblem: true }),
        }
      );
      if (!response.ok) throw new Error("Failed to solve problem");

      const final = await parseSSEStream(response, (accumulated) => {
        setSolutionData(prev => prev ? { ...prev, content: accumulated, isStreaming: true } : null);
      });

      setSolutionData(prev => prev ? { ...prev, content: final, isStreaming: false } : null);
      toast({ title: "Practice Problem Solved! ✅", description: "Step-by-step solution ready" });
    } catch (error) {
      console.error("Error solving similar problem:", error);
      toast({ title: "Error", description: "Failed to solve practice problem", variant: "destructive" });
    } finally {
      setIsSolvingSimilar(false);
    }
  }, [setSolutionData, toast]);

  return {
    isAnsweringFollowUp,
    isFindingSimilar,
    isGettingDetailed,
    isSolvingSimilar,
    handleFollowUpQuestion,
    handleFindSimilar,
    handleGetDetailedSolution,
    handleSolveSimilar,
  };
}
