import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, Sparkles, ArrowRight, ArrowLeft, Check, Copy, MessageCircle, ChevronRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CreateClassDialogProps {
  onCreateClass: (data: {
    name: string;
    subject?: string;
    description?: string;
    academic_year?: string;
    grade_level?: string;
    section?: string;
    thumbnail?: string;
    max_students?: number;
    settings?: Record<string, any>;
  }) => Promise<any>;
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

const thumbnailIcons = [
  { id: "math", emoji: "📐" },
  { id: "atom", emoji: "⚛️" },
  { id: "flask", emoji: "🧪" },
  { id: "cell", emoji: "🧬" },
  { id: "book", emoji: "📖" },
  { id: "globe", emoji: "🌍" },
  { id: "laptop", emoji: "💻" },
  { id: "palette", emoji: "🎨" },
  { id: "music", emoji: "🎵" },
  { id: "trophy", emoji: "🏆" },
  { id: "lightbulb", emoji: "💡" },
  { id: "rocket", emoji: "🚀" },
];

const gradeLevels = [
  "Grade 1-5", "Grade 6-8", "Grade 9-10", "Grade 11-12",
  "Undergraduate", "Postgraduate", "Professional", "Other",
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function CreateClassDialog({ onCreateClass, externalOpen, onExternalOpenChange }: CreateClassDialogProps) {
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdClass, setCreatedClass] = useState<any>(null);

  // Step 1 — Basic Info
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [thumbnail, setThumbnail] = useState("book");

  // Step 2 — Schedule
  const [hasSchedule, setHasSchedule] = useState(false);
  const [schedule, setSchedule] = useState<Record<string, { active: boolean; startTime: string; duration: string }>>(
    Object.fromEntries(days.map(d => [d, { active: false, startTime: "09:00", duration: "60" }]))
  );

  // Step 3 — Settings
  const [maxStudents, setMaxStudents] = useState(0);
  const [newtonChatEnabled, setNewtonChatEnabled] = useState(true);
  const [pulseFrequency, setPulseFrequency] = useState("10");
  const [autoNotes, setAutoNotes] = useState(true);
  const [speechTranscription, setSpeechTranscription] = useState(false);
  const [allowStudentOcr, setAllowStudentOcr] = useState(true);
  const [anonymousQuestions, setAnonymousQuestions] = useState(true);
  const [isPrivate, setIsPrivate] = useState(true);

  const open = externalOpen ?? internalOpen;
  const setOpen = onExternalOpenChange ?? setInternalOpen;

  const resetForm = () => {
    setStep(1);
    setName("");
    setSubject("");
    setDescription("");
    setAcademicYear("");
    setGradeLevel("");
    setSection("");
    setThumbnail("book");
    setHasSchedule(false);
    setSchedule(Object.fromEntries(days.map(d => [d, { active: false, startTime: "09:00", duration: "60" }])));
    setMaxStudents(0);
    setNewtonChatEnabled(true);
    setPulseFrequency("10");
    setAutoNotes(true);
    setSpeechTranscription(false);
    setAllowStudentOcr(true);
    setAnonymousQuestions(true);
    setIsPrivate(true);
    setCreatedClass(null);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const settings: Record<string, any> = {
      newton_chat_enabled: newtonChatEnabled,
      pulse_frequency: parseInt(pulseFrequency),
      auto_notes: autoNotes,
      speech_transcription: speechTranscription,
      allow_student_ocr: allowStudentOcr,
      anonymous_questions: anonymousQuestions,
      visibility: isPrivate ? "private" : "searchable",
    };

    if (hasSchedule) {
      settings.schedule = Object.fromEntries(
        Object.entries(schedule).filter(([, v]) => v.active).map(([k, v]) => [k, { startTime: v.startTime, duration: parseInt(v.duration) }])
      );
    }

    const result = await onCreateClass({
      name: name.trim(),
      subject: subject.trim() || undefined,
      description: description.trim() || undefined,
      academic_year: academicYear.trim() || undefined,
      grade_level: gradeLevel || undefined,
      section: section.trim() || undefined,
      thumbnail,
      max_students: maxStudents,
      settings,
    });

    setLoading(false);
    if (result) {
      setCreatedClass(result);
      setStep(4); // Success screen
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) resetForm();
    setOpen(val);
  };

  const stepContent = () => {
    if (step === 4 && createdClass) {
      return <SuccessScreen classData={createdClass} onGoToClass={() => { handleClose(false); navigate(`/teacher/classes/${createdClass.id}`); }} />;
    }

    switch (step) {
      case 1: return (
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="class-name">Class Name *</Label>
            <Input id="class-name" placeholder="e.g. Physics 101" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <div className="grid grid-cols-6 gap-2">
              {thumbnailIcons.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThumbnail(t.id)}
                  className={`text-xl p-2 rounded-lg border transition-all cursor-pointer ${thumbnail === t.id ? "border-primary bg-primary/10 ring-2 ring-primary/20" : "border-border/50 hover:border-primary/30"}`}
                >
                  {t.emoji}
                </button>
              ))}
            </div>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Grade Level</Label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select...</option>
                {gradeLevels.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year</Label>
              <Input id="academic-year" placeholder="e.g. 2025-26" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section / Batch</Label>
            <Input id="section" placeholder="e.g. Batch A (optional)" value={section} onChange={(e) => setSection(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Brief description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>

          <Button onClick={() => setStep(2)} disabled={!name.trim()} className="w-full gap-1.5">
            Next — Schedule <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      );

      case 2: return (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Weekly Schedule</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">No fixed schedule</span>
              <Switch checked={!hasSchedule} onCheckedChange={(v) => setHasSchedule(!v)} />
            </div>
          </div>

          {hasSchedule && (
            <div className="space-y-2">
              {days.map((day) => {
                const s = schedule[day];
                return (
                  <div key={day} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                    <button
                      type="button"
                      onClick={() => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], active: !prev[day].active } }))}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${s.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >
                      {day}
                    </button>
                    {s.active && (
                      <>
                        <Input
                          type="time"
                          value={s.startTime}
                          onChange={(e) => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], startTime: e.target.value } }))}
                          className="w-28 h-8 text-xs"
                        />
                        <select
                          value={s.duration}
                          onChange={(e) => setSchedule(prev => ({ ...prev, [day]: { ...prev[day], duration: e.target.value } }))}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
                          <option value="60">1 hr</option>
                          <option value="90">1.5 hr</option>
                          <option value="120">2 hr</option>
                        </select>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!hasSchedule && (
            <p className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed border-border/50">
              You can start sessions anytime without a fixed schedule
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1 gap-1.5">
              Next — Settings <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-4 pt-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Visibility</p>
                <p className="text-xs text-muted-foreground">{isPrivate ? "Only joinable via invite code" : "Discoverable by students"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Private</span>
                <Switch checked={!isPrivate} onCheckedChange={(v) => setIsPrivate(!v)} />
              </div>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Max Students</p>
                <p className="text-xs text-muted-foreground">0 = unlimited</p>
              </div>
              <Input
                type="number"
                min={0}
                value={maxStudents}
                onChange={(e) => setMaxStudents(parseInt(e.target.value) || 0)}
                className="w-20 h-8 text-sm text-right"
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Newton AI Chat</p>
                <p className="text-xs text-muted-foreground">Students can ask Newton during sessions</p>
              </div>
              <Switch checked={newtonChatEnabled} onCheckedChange={setNewtonChatEnabled} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Pulse Frequency</p>
                <p className="text-xs text-muted-foreground">How often to check understanding</p>
              </div>
              <select
                value={pulseFrequency}
                onChange={(e) => setPulseFrequency(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="5">Every 5 min</option>
                <option value="10">Every 10 min</option>
                <option value="15">Every 15 min</option>
                <option value="0">Manual only</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Auto Notes</p>
                <p className="text-xs text-muted-foreground">AI generates slide notes automatically</p>
              </div>
              <Switch checked={autoNotes} onCheckedChange={setAutoNotes} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Speech Transcription</p>
                <p className="text-xs text-muted-foreground">Transcribe teacher speech during sessions</p>
              </div>
              <Switch checked={speechTranscription} onCheckedChange={setSpeechTranscription} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Student OCR</p>
                <p className="text-xs text-muted-foreground">Allow students to scan handwritten content</p>
              </div>
              <Switch checked={allowStudentOcr} onCheckedChange={setAllowStudentOcr} />
            </div>

            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium">Anonymous Questions</p>
                <p className="text-xs text-muted-foreground">Students can ask questions anonymously</p>
              </div>
              <Switch checked={anonymousQuestions} onCheckedChange={setAnonymousQuestions} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={handleCreate} disabled={loading} className="flex-1 gap-1.5">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Create Class
            </Button>
          </div>
        </div>
      );

      default: return null;
    }
  };

  const stepIndicator = step < 4 ? (
    <div className="flex items-center justify-center gap-2 mb-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            s === step ? "bg-primary text-primary-foreground" : s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
          }`}>
            {s < step ? <Check className="h-3.5 w-3.5" /> : s}
          </div>
          {s < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
        </div>
      ))}
    </div>
  ) : null;

  const stepTitle = step === 1 ? "Basic Info" : step === 2 ? "Schedule" : step === 3 ? "Settings" : "Class Created!";

  const content = (
    <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {step === 4 ? "🎉 Class Created!" : `Create a New Class — ${stepTitle}`}
        </DialogTitle>
      </DialogHeader>
      {stepIndicator}
      {stepContent()}
    </DialogContent>
  );

  if (externalOpen !== undefined) {
    return <Dialog open={open} onOpenChange={handleClose}>{content}</Dialog>;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Class
        </Button>
      </DialogTrigger>
      {content}
    </Dialog>
  );
}

function SuccessScreen({ classData, onGoToClass }: { classData: any; onGoToClass: () => void }) {
  const joinLink = `${window.location.origin}/join-class?code=${classData.invite_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink);
    toast.success("Invite link copied!");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(classData.invite_code);
    toast.success("Invite code copied!");
  };

  const shareWhatsApp = () => {
    const text = `Join my class "${classData.name}" on NewtonAI!\n\nUse code: ${classData.invite_code}\nOr click: ${joinLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <div className="p-4 bg-white rounded-xl shadow-sm">
        <QRCodeSVG value={joinLink} size={180} level="M" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">Invite Code</p>
        <button
          onClick={copyCode}
          className="text-3xl font-mono font-bold tracking-[0.3em] text-primary hover:text-primary/80 transition-colors cursor-pointer"
        >
          {classData.invite_code}
        </button>
      </div>

      <div className="flex gap-2 w-full max-w-xs">
        <Button variant="outline" className="flex-1 gap-1.5" onClick={copyLink}>
          <Copy className="h-3.5 w-3.5" /> Copy Link
        </Button>
        <Button variant="outline" className="flex-1 gap-1.5" onClick={shareWhatsApp}>
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </Button>
      </div>

      <Button onClick={onGoToClass} className="w-full max-w-xs gap-1.5">
        Go to Class <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
