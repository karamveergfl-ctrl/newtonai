import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ConceptCheck, ConceptCheckResults } from "@/types/liveSession";

interface UseConceptCheckHistoryProps {
  sessionId: string;
}

export function useConceptCheckHistory({ sessionId }: UseConceptCheckHistoryProps) {
  const [checks, setChecks] = useState<ConceptCheck[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, ConceptCheckResults>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("concept_checks")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("fetchHistory error:", error.message);
          setIsLoading(false);
          return;
        }

        const fetchedChecks = (data || []) as unknown as ConceptCheck[];
        setChecks(fetchedChecks);

        // Fetch results for each check
        const results: Record<string, ConceptCheckResults> = {};
        await Promise.all(
          fetchedChecks.map(async (check) => {
            try {
              const { data: resultData, error: resultError } = await supabase.rpc(
                "get_concept_check_results",
                { p_check_id: check.id }
              );
              if (!resultError && resultData) {
                results[check.id] = resultData as unknown as ConceptCheckResults;
              }
            } catch {
              // skip failed result fetches
            }
          })
        );

        setResultsMap(results);
      } catch (err) {
        console.error("fetchHistory exception:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [sessionId]);

  const totalChecks = checks.length;

  const avgCorrectPercentage = useMemo(() => {
    const percentages = Object.values(resultsMap)
      .map((r) => r.correct_percentage)
      .filter((p) => typeof p === "number" && !isNaN(p));
    if (percentages.length === 0) return 0;
    return Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);
  }, [resultsMap]);

  const hardestCheck = useMemo((): ConceptCheck | null => {
    let lowest: ConceptCheck | null = null;
    let lowestPct = Infinity;
    for (const check of checks) {
      const result = resultsMap[check.id];
      if (result && result.correct_percentage < lowestPct) {
        lowestPct = result.correct_percentage;
        lowest = check;
      }
    }
    return lowest;
  }, [checks, resultsMap]);

  const easiestCheck = useMemo((): ConceptCheck | null => {
    let highest: ConceptCheck | null = null;
    let highestPct = -Infinity;
    for (const check of checks) {
      const result = resultsMap[check.id];
      if (result && result.correct_percentage > highestPct) {
        highestPct = result.correct_percentage;
        highest = check;
      }
    }
    return highest;
  }, [checks, resultsMap]);

  return {
    checks,
    resultsMap,
    isLoading,
    totalChecks,
    avgCorrectPercentage,
    hardestCheck,
    easiestCheck,
  };
}
