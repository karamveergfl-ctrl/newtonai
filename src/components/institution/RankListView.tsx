import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";

interface RankListViewProps {
  classId: string;
  courseId: string;
  className: string;
  courseName: string;
}

export function RankListView({ classId, courseId, className, courseName }: RankListViewProps) {
  const [rankList, setRankList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("generate_rank_list", {
        p_class_id: classId,
        p_course_id: courseId,
      });
      if (error) throw error;
      setRankList((data as any) || []);
      setGenerated(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate rank list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Rank List — {className} · {courseName}
        </CardTitle>
        <Button onClick={handleGenerate} disabled={loading} size="sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {generated ? "Refresh" : "Generate"}
        </Button>
      </CardHeader>
      <CardContent>
        {generated && rankList.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Student</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Grade</TableHead>
                <TableHead className="text-center">Mid 1</TableHead>
                <TableHead className="text-center">Mid 2</TableHead>
                <TableHead className="text-center">End Sem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankList.map((s: any) => (
                <TableRow key={s.student_id}>
                  <TableCell className="font-bold">
                    {s.rank <= 3 ? (
                      <span className={s.rank === 1 ? "text-amber-500" : s.rank === 2 ? "text-muted-foreground" : "text-orange-600"}>
                        #{s.rank}
                      </span>
                    ) : `#${s.rank}`}
                  </TableCell>
                  <TableCell className="font-medium">{s.student_name || "Unknown"}</TableCell>
                  <TableCell className="text-center font-semibold">{s.total_marks ?? "—"}</TableCell>
                  <TableCell className="text-center">{s.grade || "—"}</TableCell>
                  <TableCell className="text-center">{s.midsem1 ?? "—"}</TableCell>
                  <TableCell className="text-center">{s.midsem2 ?? "—"}</TableCell>
                  <TableCell className="text-center">{s.endsem ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : generated ? (
          <p className="text-center text-muted-foreground py-8">No marks data found</p>
        ) : (
          <p className="text-center text-muted-foreground py-8">Click Generate to create the rank list</p>
        )}
      </CardContent>
    </Card>
  );
}
