import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Sparkles } from "lucide-react";

interface CreateClassDialogProps {
  onCreateClass: (data: { name: string; subject?: string; description?: string; academic_year?: string }) => Promise<any>;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const subjectSuggestions = [
  { emoji: "📐", label: "Mathematics" },
  { emoji: "🔬", label: "Physics" },
  { emoji: "🧪", label: "Chemistry" },
  { emoji: "🧬", label: "Biology" },
  { emoji: "📚", label: "English" },
  { emoji: "🌍", label: "History" },
  { emoji: "💻", label: "Computer Science" },
  { emoji: "🎨", label: "Art" },
];

export function CreateClassDialog({ onCreateClass, externalOpen, onExternalOpenChange }: CreateClassDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("");

  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;

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

  // If controlled externally, don't render the trigger
  if (externalOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create a New Class
            </DialogTitle>
          </DialogHeader>
          <FormContent
            name={name} setName={setName}
            subject={subject} setSubject={setSubject}
            description={description} setDescription={setDescription}
            academicYear={academicYear} setAcademicYear={setAcademicYear}
            loading={loading} onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create a New Class
          </DialogTitle>
        </DialogHeader>
        <FormContent
          name={name} setName={setName}
          subject={subject} setSubject={setSubject}
          description={description} setDescription={setDescription}
          academicYear={academicYear} setAcademicYear={setAcademicYear}
          loading={loading} onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function FormContent({
  name, setName, subject, setSubject, description, setDescription,
  academicYear, setAcademicYear, loading, onSubmit,
}: {
  name: string; setName: (v: string) => void;
  subject: string; setSubject: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  academicYear: string; setAcademicYear: (v: string) => void;
  loading: boolean; onSubmit: () => void;
}) {
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="class-name">Class Name *</Label>
        <Input id="class-name" placeholder="e.g. Physics 101" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" placeholder="e.g. Physics" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <div className="flex flex-wrap gap-1.5">
          {subjectSuggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setSubject(s.label)}
              className="text-xs px-2 py-1 rounded-full border border-border/50 bg-muted/50 hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="academic-year">Academic Year</Label>
        <Input id="academic-year" placeholder="e.g. 2025-26" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
      </div>

      {/* Preview */}
      {name.trim() && (
        <div className="rounded-xl border border-border/50 p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1">Preview</p>
          <p className="font-semibold text-sm">{name}</p>
          <div className="flex gap-1.5 mt-1">
            {subject && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">{subject}</span>}
            {academicYear && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{academicYear}</span>}
          </div>
        </div>
      )}

      <Button onClick={onSubmit} disabled={!name.trim() || loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
        Create Class
      </Button>
    </div>
  );
}
