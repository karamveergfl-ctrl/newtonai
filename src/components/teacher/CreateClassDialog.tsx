import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";

interface CreateClassDialogProps {
  onCreateClass: (data: { name: string; subject?: string; description?: string; academic_year?: string }) => Promise<any>;
}

export function CreateClassDialog({ onCreateClass }: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const result = await onCreateClass({
      name: name.trim(),
      subject: subject.trim() || undefined,
      description: description.trim() || undefined,
      academic_year: academicYear.trim() || undefined,
    });
    setLoading(false);
    if (result) {
      setOpen(false);
      setName("");
      setSubject("");
      setDescription("");
      setAcademicYear("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="class-name">Class Name *</Label>
            <Input id="class-name" placeholder="e.g. Physics 101" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academic-year">Academic Year</Label>
            <Input id="academic-year" placeholder="e.g. 2025-26" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Class
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
