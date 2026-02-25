import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface GradeScale {
  min: number;
  grade: string;
}

const DEFAULT_SCALE: GradeScale[] = [
  { min: 90, grade: "A+" },
  { min: 80, grade: "A" },
  { min: 70, grade: "B+" },
  { min: 60, grade: "B" },
  { min: 50, grade: "C" },
  { min: 40, grade: "D" },
  { min: 0, grade: "F" },
];

interface GradeCalculatorProps {
  classId: string;
  className: string;
}

export function GradeCalculator({ classId, className }: GradeCalculatorProps) {
  const [scale, setScale] = useState<GradeScale[]>(DEFAULT_SCALE);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("calculate_grades_batch", {
        p_class_id: classId,
        p_grading_scale: scale as any,
      });
      if (error) throw error;
      const result = data as any;
      toast.success(`Grades calculated for ${result?.updated ?? 0} students`);
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate grades");
    } finally {
      setLoading(false);
    }
  };

  const updateScale = (index: number, field: keyof GradeScale, value: string) => {
    const updated = [...scale];
    if (field === "min") {
      updated[index].min = Number(value) || 0;
    } else {
      updated[index].grade = value;
    }
    setScale(updated);
  };

  const addRow = () => setScale([...scale, { min: 0, grade: "" }]);
  const removeRow = (i: number) => setScale(scale.filter((_, idx) => idx !== i));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grade Calculator — {className}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Grading Scale</Label>
          <div className="space-y-2">
            {scale.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  type="number"
                  value={row.min}
                  onChange={(e) => updateScale(i, "min", e.target.value)}
                  className="w-24"
                  placeholder="Min %"
                />
                <span className="text-sm text-muted-foreground">→</span>
                <Input
                  value={row.grade}
                  onChange={(e) => updateScale(i, "grade", e.target.value)}
                  className="w-24"
                  placeholder="Grade"
                />
                <Button variant="ghost" size="icon" onClick={() => removeRow(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" /> Add Row
          </Button>
        </div>

        <Button onClick={handleCalculate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Calculate Grades
        </Button>
      </CardContent>
    </Card>
  );
}
