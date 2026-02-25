import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

interface ReportCardGeneratorProps {
  classId: string;
  courseId: string;
  className: string;
  courseName: string;
  institutionName: string;
}

export function ReportCardGenerator({ classId, courseId, className, courseName, institutionName }: ReportCardGeneratorProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("generate_rank_list", {
        p_class_id: classId,
        p_course_id: courseId,
      });
      if (error) throw error;
      const students = (data as any) || [];
      if (students.length === 0) {
        toast.error("No student data to generate report cards");
        return;
      }

      const doc = new jsPDF();
      students.forEach((student: any, idx: number) => {
        if (idx > 0) doc.addPage();

        // Header
        doc.setFontSize(16);
        doc.text(institutionName, 105, 20, { align: "center" });
        doc.setFontSize(12);
        doc.text("Student Report Card", 105, 30, { align: "center" });
        doc.setFontSize(10);
        doc.text(`${courseName} · ${className}`, 105, 38, { align: "center" });

        // Student info
        doc.setFontSize(11);
        doc.text(`Student: ${student.student_name || "Unknown"}`, 20, 55);
        doc.text(`Rank: #${student.rank}`, 150, 55);

        // Marks table
        const marks = [
          ["Mid Sem 1", student.midsem1 ?? "—"],
          ["Mid Sem 2", student.midsem2 ?? "—"],
          ["End Sem", student.endsem ?? "—"],
          ["Assignment", student.assignment_marks ?? "—"],
          ["Attendance", student.attendance_marks ?? "—"],
          ["Practical", student.practical_marks ?? "—"],
          ["Project", student.project_marks ?? "—"],
          ["Total", student.total_marks ?? "—"],
          ["Grade", student.grade || "—"],
        ];

        let y = 70;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Component", 20, y);
        doc.text("Marks", 120, y);
        doc.setFont("helvetica", "normal");
        y += 8;

        marks.forEach(([label, value]) => {
          doc.text(String(label), 20, y);
          doc.text(String(value), 120, y);
          y += 7;
        });
      });

      doc.save(`report-cards-${className}-${courseName}.pdf`);
      toast.success(`Generated report cards for ${students.length} students`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate report cards");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Card PDF
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Generate PDF report cards for all students in {className} · {courseName}.
        </p>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          Generate Report Cards
        </Button>
      </CardContent>
    </Card>
  );
}
