import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { SessionSlideNotes, NoteItem, StudentAnnotation } from "@/types/liveSession";

interface UseNotesExportProps {
  sessionId: string;
  studentId: string;
}

interface UseNotesExportReturn {
  isExporting: boolean;
  exportError: string | null;
  lastExportedAt: Date | null;
  exportNotes: (format: "pdf" | "docx" | "md") => Promise<void>;
}

function formatNoteItem(item: NoteItem): string {
  switch (item.type) {
    case "heading":
      return `## ${item.content}`;
    case "key_point":
      return `• ${item.content}`;
    case "detail":
      return `  → ${item.content}`;
    case "remember":
      return `⭐ REMEMBER: ${item.content}`;
    case "example":
      return `💡 Example: ${item.content}`;
    default:
      return `• ${item.content}`;
  }
}

function formatAnnotation(a: StudentAnnotation): string {
  if (a.annotation_type === "star") return "  ⭐ Starred";
  return `  - ${a.content}`;
}

export function useNotesExport({ sessionId, studentId }: UseNotesExportProps): UseNotesExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [lastExportedAt, setLastExportedAt] = useState<Date | null>(null);

  const exportNotes = useCallback(
    async (format: "pdf" | "docx" | "md") => {
      setIsExporting(true);
      setExportError(null);

      try {
        // Fetch all slide notes
        const { data: notesData, error: notesErr } = await supabase.rpc("get_session_notes", {
          p_session_id: sessionId,
        });
        if (notesErr) throw new Error(notesErr.message);

        const slideNotes: SessionSlideNotes[] = (notesData as Record<string, unknown>[])
          ?.filter((r) => (r as Record<string, unknown>).status === "ready")
          .map((r) => ({
            id: r.id as string,
            session_id: r.session_id as string,
            slide_index: r.slide_index as number,
            slide_title: (r.slide_title as string) ?? null,
            slide_context: r.slide_context as string,
            ai_notes: Array.isArray(r.ai_notes) ? (r.ai_notes as NoteItem[]) : [],
            status: r.status as SessionSlideNotes["status"],
            created_at: r.created_at as string,
            updated_at: r.updated_at as string,
          }))
          .sort((a, b) => a.slide_index - b.slide_index) ?? [];

        // Fetch student annotations
        const { data: annotData } = await supabase.rpc("get_student_annotations", {
          p_session_id: sessionId,
        });
        const annotMap: Record<string, StudentAnnotation[]> = {};
        if (annotData && Array.isArray(annotData)) {
          for (const row of annotData) {
            const r = row as Record<string, unknown>;
            annotMap[r.slide_note_id as string] = Array.isArray(r.annotations)
              ? (r.annotations as StudentAnnotation[])
              : [];
          }
        }

        const dateStr = new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const title = `Live Class Notes — ${dateStr}`;

        if (format === "md") {
          await exportAsMarkdown(title, slideNotes, annotMap);
        } else if (format === "pdf") {
          await exportAsPdf(title, slideNotes, annotMap);
        } else if (format === "docx") {
          await exportAsDocx(title, slideNotes, annotMap);
        }

        // Record export
        try {
          await supabase.from("session_notes_export").insert({
            session_id: sessionId,
            student_id: studentId,
            format,
            file_path: `exports/${sessionId}/${studentId}.${format}`,
          });
        } catch {
          // Non-critical — don't fail the export
        }

        setLastExportedAt(new Date());
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Export failed";
        setExportError(msg);
        console.error("exportNotes error:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [sessionId, studentId]
  );

  return { isExporting, exportError, lastExportedAt, exportNotes };
}

// --- Markdown ---
function exportAsMarkdown(
  title: string,
  notes: SessionSlideNotes[],
  annotMap: Record<string, StudentAnnotation[]>
) {
  let md = `# ${title}\n\n`;

  for (const slide of notes) {
    md += `## ${slide.slide_title || `Slide ${slide.slide_index}`}\n\n`;
    for (const item of slide.ai_notes) {
      md += `${formatNoteItem(item)}\n`;
    }

    const annotations = annotMap[slide.id] ?? [];
    if (annotations.length > 0) {
      md += `\n📝 **My Notes:**\n`;
      for (const a of annotations) {
        md += `${formatAnnotation(a)}\n`;
      }
    }
    md += "\n---\n\n";
  }

  md += `\n_Generated by NewtonAI — newtonai.site_\n`;

  const blob = new Blob([md], { type: "text/markdown" });
  downloadBlob(blob, `live-notes-${Date.now()}.md`);
}

// --- PDF ---
function exportAsPdf(
  title: string,
  notes: SessionSlideNotes[],
  annotMap: Record<string, StudentAnnotation[]>
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 15;
    }
  };

  doc.setFontSize(18);
  doc.text(title, margin, y);
  y += 12;

  for (const slide of notes) {
    checkPage(25);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(slide.slide_title || `Slide ${slide.slide_index}`, margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    for (const item of slide.ai_notes) {
      checkPage(8);
      const line = formatNoteItem(item).replace(/^##\s*/, "");
      const lines = doc.splitTextToSize(line, maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    }

    const annotations = annotMap[slide.id] ?? [];
    if (annotations.length > 0) {
      checkPage(10);
      doc.setFont("helvetica", "bold");
      doc.text("My Notes:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      for (const a of annotations) {
        checkPage(6);
        const txt = a.annotation_type === "star" ? "⭐ Starred" : `- ${a.content}`;
        const lines = doc.splitTextToSize(txt, maxWidth);
        doc.text(lines, margin + 3, y);
        y += lines.length * 5;
      }
    }

    y += 6;
    checkPage(2);
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  checkPage(10);
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Generated by NewtonAI — newtonai.site", margin, y);

  doc.save(`live-notes-${Date.now()}.pdf`);
}

// --- DOCX ---
async function exportAsDocx(
  title: string,
  notes: SessionSlideNotes[],
  annotMap: Record<string, StudentAnnotation[]>
) {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({ text: title, heading: HeadingLevel.TITLE, spacing: { after: 300 } })
  );

  for (const slide of notes) {
    children.push(
      new Paragraph({
        text: slide.slide_title || `Slide ${slide.slide_index}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      })
    );

    for (const item of slide.ai_notes) {
      const prefix =
        item.type === "remember"
          ? "REMEMBER: "
          : item.type === "example"
          ? "Example: "
          : "";
      children.push(
        new Paragraph({
          children: [
            ...(prefix
              ? [new TextRun({ text: prefix, bold: true })]
              : []),
            new TextRun({ text: item.content }),
          ],
          bullet: item.type !== "heading" ? { level: item.type === "detail" ? 1 : 0 } : undefined,
          heading: item.type === "heading" ? HeadingLevel.HEADING_3 : undefined,
          spacing: { after: 60 },
        })
      );
    }

    const annotations = annotMap[slide.id] ?? [];
    if (annotations.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: "My Notes:", bold: true })],
          spacing: { before: 100, after: 60 },
        })
      );
      for (const a of annotations) {
        children.push(
          new Paragraph({
            text: a.annotation_type === "star" ? "⭐ Starred" : a.content,
            bullet: { level: 0 },
            spacing: { after: 40 },
          })
        );
      }
    }
  }

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Generated by NewtonAI — newtonai.site", italics: true, size: 16 })],
      spacing: { before: 400 },
    })
  );

  const docFile = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(docFile);
  downloadBlob(blob, `live-notes-${Date.now()}.docx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
