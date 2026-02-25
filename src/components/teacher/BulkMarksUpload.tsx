import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classId: string;
  courseId?: string;
}

interface ParsedRow {
  student_id: string;
  assignment_marks: string;
  attendance_marks: string;
  midsem1: string;
  midsem2: string;
  endsem: string;
  practical_marks: string;
  project_marks: string;
  grade: string;
}

const TEMPLATE_HEADERS = [
  "student_id",
  "assignment_marks",
  "attendance_marks",
  "midsem1",
  "midsem2",
  "endsem",
  "practical_marks",
  "project_marks",
  "grade",
];

export function BulkMarksUpload({ classId, courseId }: Props) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error("CSV must have a header + at least one row"); return; }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const parsed: ParsedRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const row: any = {};
        TEMPLATE_HEADERS.forEach((h, idx) => {
          const colIdx = headers.indexOf(h);
          row[h] = colIdx >= 0 ? cols[colIdx] || "" : "";
        });
        if (row.student_id) parsed.push(row);
      }

      setRows(parsed);
      setUploaded(false);
      toast.success(`Parsed ${parsed.length} rows`);
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  const downloadTemplate = () => {
    const csv = TEMPLATE_HEADERS.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marks_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!courseId) { toast.error("Select a course first"); return; }
    setUploading(true);

    const payload = rows.map((r) => ({
      student_id: r.student_id,
      course_id: courseId,
      class_id: classId,
      assignment_marks: r.assignment_marks ? Number(r.assignment_marks) : 0,
      attendance_marks: r.attendance_marks ? Number(r.attendance_marks) : 0,
      midsem1: r.midsem1 ? Number(r.midsem1) : null,
      midsem2: r.midsem2 ? Number(r.midsem2) : null,
      endsem: r.endsem ? Number(r.endsem) : null,
      practical_marks: r.practical_marks ? Number(r.practical_marks) : null,
      project_marks: r.project_marks ? Number(r.project_marks) : null,
      grade: r.grade || null,
    }));

    const { data, error } = await supabase.rpc("bulk_upsert_student_marks", {
      p_marks: payload,
    } as any);

    setUploading(false);

    if (error) {
      toast.error("Bulk upload failed");
      console.error(error);
    } else {
      toast.success(`Uploaded ${rows.length} marks records`);
      setUploaded(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Download Template
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">Use the template above for correct column headers</p>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <Badge variant="secondary">{rows.length} rows parsed</Badge>
            {uploaded ? (
              <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/30">
                <CheckCircle2 className="h-3 w-3" /> Uploaded
              </Badge>
            ) : (
              <Button onClick={handleUpload} disabled={uploading || !courseId} size="sm" className="gap-1.5">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload Marks
              </Button>
            )}
          </div>

          <div className="overflow-auto rounded-lg border border-border max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {TEMPLATE_HEADERS.map((h) => (
                    <TableHead key={h} className="text-xs whitespace-nowrap">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 20).map((r, i) => (
                  <TableRow key={i}>
                    {TEMPLATE_HEADERS.map((h) => (
                      <TableCell key={h} className="text-xs">{(r as any)[h] || "—"}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {rows.length > 20 && (
            <p className="text-xs text-muted-foreground text-center">Showing first 20 of {rows.length} rows</p>
          )}
        </>
      )}
    </div>
  );
}
