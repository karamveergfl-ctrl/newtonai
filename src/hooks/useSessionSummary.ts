import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PulseSummary, LiveQuestion } from "@/types/liveSession";
import jsPDF from "jspdf";

interface UseSessionSummaryProps {
  sessionId: string;
}

const defaultSummary: PulseSummary = {
  got_it: 0,
  slightly_lost: 0,
  lost: 0,
  total: 0,
  confusion_percentage: 0,
};

export function useSessionSummary({ sessionId }: UseSessionSummaryProps) {
  const [pulseSummary, setPulseSummary] = useState<PulseSummary>(defaultSummary);
  const [topQuestions, setTopQuestions] = useState<LiveQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [pulseRes, topQRes, countRes] = await Promise.all([
          supabase.rpc("get_pulse_summary", { p_session_id: sessionId }),
          supabase
            .from("live_questions" as "live_questions")
            .select("*")
            .eq("session_id", sessionId)
            .order("upvotes", { ascending: false })
            .limit(3),
          supabase
            .from("live_questions" as "live_questions")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionId),
        ]);

        if (pulseRes.data && typeof pulseRes.data === "object") {
          const d = pulseRes.data as Record<string, unknown>;
          setPulseSummary({
            got_it: (d.got_it as number) ?? 0,
            slightly_lost: (d.slightly_lost as number) ?? 0,
            lost: (d.lost as number) ?? 0,
            total: (d.total as number) ?? 0,
            confusion_percentage: (d.confusion_percentage as number) ?? 0,
          });
        }

        if (topQRes.data) {
          setTopQuestions(
            (topQRes.data as unknown as LiveQuestion[]).map((q) => ({
              ...q,
              has_upvoted: false,
            }))
          );
        }

        setTotalQuestions(countRes.count ?? 0);
      } catch (err) {
        console.error("useSessionSummary fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const exportSummaryAsPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      // Fetch session info for class name and date
      const { data: sessionData } = await supabase
        .from("live_sessions" as "live_sessions")
        .select("title, started_at, class_id")
        .eq("id", sessionId)
        .single();

      const session = sessionData as Record<string, unknown> | null;
      const title = (session?.title as string) || "Live Session";
      const startedAt = session?.started_at ? new Date(session.started_at as string) : new Date();
      const dateStr = startedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      let className = "Class";
      if (session?.class_id) {
        const { data: classData } = await supabase
          .from("classes")
          .select("name")
          .eq("id", session.class_id as string)
          .single();
        if (classData) className = classData.name;
      }

      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Live Session Summary`, 20, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`${className} — ${dateStr}`, 20, y);
      y += 5;
      doc.text(`Topic: ${title}`, 20, y);
      y += 12;

      // Section 1: Understanding Overview
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Understanding Overview", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const pctGot = pulseSummary.total > 0 ? Math.round((pulseSummary.got_it / pulseSummary.total) * 100) : 0;
      const pctSlight = pulseSummary.total > 0 ? Math.round((pulseSummary.slightly_lost / pulseSummary.total) * 100) : 0;
      const pctLost = pulseSummary.total > 0 ? Math.round((pulseSummary.lost / pulseSummary.total) * 100) : 0;

      doc.text(`✅ Got It: ${pulseSummary.got_it} students (${pctGot}%)`, 24, y); y += 6;
      doc.text(`🤔 Slightly Lost: ${pulseSummary.slightly_lost} students (${pctSlight}%)`, 24, y); y += 6;
      doc.text(`❌ Lost: ${pulseSummary.lost} students (${pctLost}%)`, 24, y); y += 6;
      doc.text(`Total responses: ${pulseSummary.total}`, 24, y); y += 6;

      if (pulseSummary.confusion_percentage > 40) {
        doc.text(`⚠️ Confusion peaked at ${Math.round(pulseSummary.confusion_percentage)}%`, 24, y);
        y += 6;
      }
      y += 6;

      // Section 2: Top Questions
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Top Questions From Students", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      if (topQuestions.length === 0) {
        doc.text("No questions were asked during this session.", 24, y);
        y += 6;
      } else {
        topQuestions.forEach((q, i) => {
          const prefix = q.is_answered ? "✓" : "•";
          const line = `${prefix} ${i + 1}. ${q.content} (${q.upvotes} upvotes)`;
          const lines = doc.splitTextToSize(line, 160);
          doc.text(lines, 24, y);
          y += lines.length * 5 + 2;

          if (q.newton_answer) {
            const answerLines = doc.splitTextToSize(`   Newton: ${q.newton_answer}`, 155);
            doc.setFont("helvetica", "italic");
            doc.text(answerLines, 28, y);
            doc.setFont("helvetica", "normal");
            y += answerLines.length * 5 + 2;
          }
        });
      }
      y += 6;

      // Section 3: Session Stats
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Session Stats", 20, y);
      y += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Total questions asked: ${totalQuestions}`, 24, y); y += 6;
      doc.text(`Total pulse responses: ${pulseSummary.total}`, 24, y); y += 12;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Generated by NewtonAI — newtonai.site", 20, 285);

      // Download
      const safeName = className.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const dateFile = startedAt.toISOString().split("T")[0];
      doc.save(`session-summary-${dateFile}-${safeName}.pdf`);
    } catch (err) {
      console.error("exportSummaryAsPDF error:", err);
    } finally {
      setIsExporting(false);
    }
  }, [sessionId, pulseSummary, topQuestions, totalQuestions]);

  return { pulseSummary, topQuestions, totalQuestions, isLoading, isExporting, exportSummaryAsPDF };
}
