import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface AssignToClassSelectProps {
  selectedClassId: string;
  onClassIdChange: (classId: string) => void;
}

export function AssignToClassSelect({ selectedClassId, onClassIdChange }: AssignToClassSelectProps) {
  const { isTeacher } = useUserRole();
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!isTeacher) return;
    const fetchClasses = async () => {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (data) setClasses(data);
    };
    fetchClasses();
  }, [isTeacher]);

  if (!isTeacher || classes.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Assign to Class</Label>
      </div>
      <Select value={selectedClassId} onValueChange={onClassIdChange}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="No class (personal use)" />
        </SelectTrigger>
        <SelectContent className="z-[200] bg-popover">
          <SelectItem value="none">No class (personal use)</SelectItem>
          {classes.map((cls) => (
            <SelectItem key={cls.id} value={cls.id}>
              {cls.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Quiz will be published as an assignment in the selected class
      </p>
    </div>
  );
}
