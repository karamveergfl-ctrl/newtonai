import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Volume2, Play, User } from "lucide-react";

interface VoiceSettings {
  host1VoiceName: string;
  host2VoiceName: string;
  host1Pitch: number;
  host2Pitch: number;
  host1Rate: number;
  host2Rate: number;
}

interface PodcastVoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: VoiceSettings) => void;
}

const STORAGE_KEY = "podcast-voice-settings";

export function getStoredVoiceSettings(): VoiceSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function PodcastVoiceSettings({
  isOpen,
  onClose,
  onSave,
}: PodcastVoiceSettingsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>({
    host1VoiceName: "",
    host2VoiceName: "",
    host1Pitch: 0.95,
    host2Pitch: 1.1,
    host1Rate: 1,
    host2Rate: 1,
  });
  const [previewingSpeaker, setPreviewingSpeaker] = useState<"host1" | "host2" | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Load stored settings
  useEffect(() => {
    const stored = getStoredVoiceSettings();
    if (stored) {
      setSettings(stored);
    }
  }, [isOpen]);

  const englishVoices = voices.filter(
    (v) => v.lang.startsWith("en") || v.lang.startsWith("EN")
  );

  const previewVoice = (speaker: "host1" | "host2") => {
    speechSynthesis.cancel();
    setPreviewingSpeaker(speaker);

    const voiceName = speaker === "host1" ? settings.host1VoiceName : settings.host2VoiceName;
    const pitch = speaker === "host1" ? settings.host1Pitch : settings.host2Pitch;
    const rate = speaker === "host1" ? settings.host1Rate : settings.host2Rate;
    const name = speaker === "host1" ? "Alex" : "Sarah";

    const utterance = new SpeechSynthesisUtterance(
      `Hi, I'm ${name}. This is how I'll sound during the podcast.`
    );

    const voice = voices.find((v) => v.name === voiceName);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onend = () => setPreviewingSpeaker(null);
    utterance.onerror = () => setPreviewingSpeaker(null);

    speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const handleClose = () => {
    speechSynthesis.cancel();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            Voice Settings
          </DialogTitle>
          <DialogDescription>
            Customize how Alex and Sarah sound during the podcast
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Host 1 - Alex */}
          <div className="space-y-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-primary">Alex (Host 1)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewVoice("host1")}
                disabled={previewingSpeaker !== null}
              >
                <Play className="w-3 h-3 mr-1" />
                {previewingSpeaker === "host1" ? "Playing..." : "Preview"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Voice</Label>
              <Select
                value={settings.host1VoiceName}
                onValueChange={(v) => setSettings((s) => ({ ...s, host1VoiceName: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-select male voice" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">Auto-select</SelectItem>
                  {englishVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      <div className="flex items-center gap-2">
                        {voice.name}
                        {voice.localService && (
                          <Badge variant="secondary" className="text-[10px] px-1">
                            Local
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pitch</Label>
                <span className="text-xs text-muted-foreground">{settings.host1Pitch.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.host1Pitch]}
                onValueChange={([v]) => setSettings((s) => ({ ...s, host1Pitch: v }))}
                min={0.5}
                max={1.5}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Speed</Label>
                <span className="text-xs text-muted-foreground">{settings.host1Rate.toFixed(2)}x</span>
              </div>
              <Slider
                value={[settings.host1Rate]}
                onValueChange={([v]) => setSettings((s) => ({ ...s, host1Rate: v }))}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
          </div>

          {/* Host 2 - Sarah */}
          <div className="space-y-4 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-medium text-secondary">Sarah (Host 2)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => previewVoice("host2")}
                disabled={previewingSpeaker !== null}
              >
                <Play className="w-3 h-3 mr-1" />
                {previewingSpeaker === "host2" ? "Playing..." : "Preview"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Voice</Label>
              <Select
                value={settings.host2VoiceName}
                onValueChange={(v) => setSettings((s) => ({ ...s, host2VoiceName: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-select female voice" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="">Auto-select</SelectItem>
                  {englishVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      <div className="flex items-center gap-2">
                        {voice.name}
                        {voice.localService && (
                          <Badge variant="secondary" className="text-[10px] px-1">
                            Local
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pitch</Label>
                <span className="text-xs text-muted-foreground">{settings.host2Pitch.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.host2Pitch]}
                onValueChange={([v]) => setSettings((s) => ({ ...s, host2Pitch: v }))}
                min={0.5}
                max={1.5}
                step={0.05}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Speed</Label>
                <span className="text-xs text-muted-foreground">{settings.host2Rate.toFixed(2)}x</span>
              </div>
              <Slider
                value={[settings.host2Rate]}
                onValueChange={([v]) => setSettings((s) => ({ ...s, host2Rate: v }))}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
