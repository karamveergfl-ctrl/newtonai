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
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Coffee,
  GraduationCap,
  Microscope,
  MessageSquare,
  Sparkles,
  User,
  Settings2,
  Globe,
  Mic,
  Volume2,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { usePodcastPreferences } from "@/hooks/usePodcastPreferences";

// Supported languages
const LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "es", name: "Spanish (Español)", flag: "🇪🇸" },
  { code: "fr", name: "French (Français)", flag: "🇫🇷" },
  { code: "de", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "pt", name: "Portuguese (Português)", flag: "🇧🇷" },
  { code: "ja", name: "Japanese (日本語)", flag: "🇯🇵" },
  { code: "zh", name: "Chinese (中文)", flag: "🇨🇳" },
  { code: "ko", name: "Korean (한국어)", flag: "🇰🇷" },
  { code: "ar", name: "Arabic (العربية)", flag: "🇸🇦" },
  { code: "ta", name: "Tamil (தமிழ்)", flag: "🇮🇳" },
  { code: "te", name: "Telugu (తెలుగు)", flag: "🇮🇳" },
  { code: "bn", name: "Bengali (বাংলা)", flag: "🇮🇳" },
];

// ElevenLabs voice options
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female";
  accent?: string;
  preview?: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Warm, conversational male voice", gender: "male", accent: "American" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Clear, engaging female voice", gender: "female", accent: "American" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Professional female narrator", gender: "female", accent: "American" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Friendly, casual male voice", gender: "male", accent: "British" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Authoritative British male", gender: "male", accent: "British" },
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Energetic young male", gender: "male", accent: "American" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Smooth, professional male", gender: "male", accent: "American" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Warm, friendly female", gender: "female", accent: "British" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Clear, articulate female", gender: "female", accent: "American" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Deep, resonant male voice", gender: "male", accent: "American" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Expressive female voice", gender: "female", accent: "American" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Mature, trustworthy male", gender: "male", accent: "American" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", description: "Casual, relatable male", gender: "male", accent: "American" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Deep, authoritative male", gender: "male", accent: "American" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Versatile multilingual male", gender: "male", accent: "British" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Bright, cheerful female", gender: "female", accent: "British" },
];

export interface PodcastStyle {
  id: "casual" | "academic" | "deep-dive" | "interview";
  name: string;
  description: string;
  icon: React.ReactNode;
  host1Personality: string;
  host2Personality: string;
  tone: string;
  segmentCount: number;
}

export interface PodcastSettings {
  style: PodcastStyle["id"];
  host1Name: string;
  host1Personality: string;
  host1VoiceId: string;
  host2Name: string;
  host2Personality: string;
  host2VoiceId: string;
  tone: "enthusiastic" | "balanced" | "serious";
  depth: number; // 1-5, affects segment count and detail
  customInstructions: string;
  language: string; // Language code (en, hi, es, etc.)
}

const PRESETS: PodcastStyle[] = [
  {
    id: "casual",
    name: "Casual Chat",
    description: "Friendly, relaxed conversation like talking with study buddies",
    icon: <Coffee className="w-5 h-5" />,
    host1Personality: "Friendly and curious, uses relatable examples and casual language",
    host2Personality: "Warm and encouraging, explains things simply with humor",
    tone: "Light-hearted and accessible",
    segmentCount: 10,
  },
  {
    id: "academic",
    name: "Academic",
    description: "Structured, formal discussion like a university lecture",
    icon: <GraduationCap className="w-5 h-5" />,
    host1Personality: "Analytical and precise, asks probing questions",
    host2Personality: "Authoritative and thorough, cites research and evidence",
    tone: "Professional and educational",
    segmentCount: 12,
  },
  {
    id: "deep-dive",
    name: "Deep Dive",
    description: "Comprehensive exploration with detailed analysis",
    icon: <Microscope className="w-5 h-5" />,
    host1Personality: "Inquisitive and detail-oriented, digs into nuances",
    host2Personality: "Expert and comprehensive, provides deep insights",
    tone: "Thorough and investigative",
    segmentCount: 18,
  },
  {
    id: "interview",
    name: "Interview",
    description: "Q&A format like interviewing an expert on the topic",
    icon: <MessageSquare className="w-5 h-5" />,
    host1Personality: "Skilled interviewer who asks insightful questions",
    host2Personality: "Subject matter expert sharing knowledge confidently",
    tone: "Engaging and conversational",
    segmentCount: 14,
  },
];

const DEFAULT_SETTINGS: PodcastSettings = {
  style: "casual",
  host1Name: "Alex",
  host1Personality: PRESETS[0].host1Personality,
  host1VoiceId: "CwhRBWXzGAHq8TQ4Fs17", // Roger
  host2Name: "Sarah",
  host2Personality: PRESETS[0].host2Personality,
  host2VoiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
  tone: "balanced",
  depth: 3,
  customInstructions: "",
  language: "en",
};

interface PodcastStylePresetsProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: PodcastSettings) => void;
  isFirstTimeSetup?: boolean;
}

export function PodcastStylePresets({
  isOpen,
  onClose,
  onGenerate,
  isFirstTimeSetup = false,
}: PodcastStylePresetsProps) {
  const { preferences, savePreferences, markSetupComplete, isLoaded } = usePodcastPreferences();
  
  // Initialize settings from saved preferences
  const [settings, setSettings] = useState<PodcastSettings>(() => {
    const preset = PRESETS.find((p) => p.id === preferences.style) || PRESETS[0];
    return {
      style: preferences.style,
      host1Name: preferences.host1Name,
      host1Personality: preset.host1Personality,
      host1VoiceId: preferences.host1VoiceId,
      host2Name: preferences.host2Name,
      host2Personality: preset.host2Personality,
      host2VoiceId: preferences.host2VoiceId,
      tone: preferences.tone,
      depth: preferences.depth,
      customInstructions: "",
      language: preferences.language,
    };
  });

  // Update settings when preferences load
  useEffect(() => {
    if (isLoaded) {
      const preset = PRESETS.find((p) => p.id === preferences.style) || PRESETS[0];
      setSettings((s) => ({
        ...s,
        style: preferences.style,
        host1Name: preferences.host1Name,
        host1VoiceId: preferences.host1VoiceId,
        host2Name: preferences.host2Name,
        host2VoiceId: preferences.host2VoiceId,
        tone: preferences.tone,
        depth: preferences.depth,
        language: preferences.language,
        host1Personality: preset.host1Personality,
        host2Personality: preset.host2Personality,
      }));
    }
  }, [isLoaded, preferences]);
  const [activeTab, setActiveTab] = useState<"style" | "language" | "voices" | "hosts" | "advanced">("style");

  const selectedPreset = PRESETS.find((p) => p.id === settings.style) || PRESETS[0];

  const handleStyleSelect = (styleId: PodcastStyle["id"]) => {
    const preset = PRESETS.find((p) => p.id === styleId);
    if (preset) {
      setSettings((s) => ({
        ...s,
        style: styleId,
        host1Personality: preset.host1Personality,
        host2Personality: preset.host2Personality,
      }));
    }
  };

  const handleGenerate = () => {
    // Save all preferences for next time
    savePreferences({
      style: settings.style,
      host1Name: settings.host1Name,
      host1VoiceId: settings.host1VoiceId,
      host2Name: settings.host2Name,
      host2VoiceId: settings.host2VoiceId,
      tone: settings.tone,
      depth: settings.depth,
      language: settings.language,
    });
    markSetupComplete();
    onGenerate(settings);
    onClose();
  };

  const estimatedDuration = Math.round(
    (selectedPreset.segmentCount * settings.depth * 0.6) * 15 / 60
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Podcast Style & Settings
          </DialogTitle>
          <DialogDescription>
            Choose a style and customize how your podcast sounds
          </DialogDescription>
        </DialogHeader>

        {isFirstTimeSetup && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Welcome to AI Podcast!</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Let's set up your preferences. These will be saved as your defaults for future podcasts.
            </p>
          </motion.div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="style">Style</TabsTrigger>
            <TabsTrigger value="language" className="gap-1">
              <Globe className="w-3 h-3 hidden sm:inline" />
              Language
            </TabsTrigger>
            <TabsTrigger value="voices" className="gap-1">
              <Mic className="w-3 h-3 hidden sm:inline" />
              Voices
            </TabsTrigger>
            <TabsTrigger value="hosts">Hosts</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              {PRESETS.map((preset) => (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStyleSelect(preset.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    settings.style === preset.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`p-2 rounded-md ${
                        settings.style === preset.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {preset.icon}
                    </div>
                    <span className="font-medium">{preset.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                </motion.button>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tone</span>
                <Badge variant="secondary">{selectedPreset.tone}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Est. Duration</span>
                <Badge variant="outline">~{estimatedDuration} min</Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="language" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-base">Select Language</Label>
              <p className="text-sm text-muted-foreground">
                The podcast will be generated and spoken in the selected language
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGUAGES.map((lang) => (
                <motion.button
                  key={lang.code}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSettings((s) => ({ ...s, language: lang.code }))}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    settings.language === lang.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium text-sm">{lang.name}</span>
                  </div>
                </motion.button>
              ))}
            </div>
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Selected: <strong>{LANGUAGES.find(l => l.code === settings.language)?.name || "English"}</strong>
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {settings.language !== "en" && "Uses ElevenLabs multilingual voices for natural pronunciation"}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="voices" className="space-y-6 mt-4">
            {/* Host 1 Voice */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <Label className="font-medium">{settings.host1Name}'s Voice</Label>
                  <p className="text-xs text-muted-foreground">Select a voice personality for Host 1</p>
                </div>
              </div>
              <ScrollArea className="h-48 rounded-lg border p-2">
                <div className="space-y-1">
                  {VOICE_OPTIONS.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSettings((s) => ({ ...s, host1VoiceId: voice.id }))}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-md text-left transition-all",
                        settings.host1VoiceId === voice.id
                          ? "bg-teal-500/10 border border-teal-500/30"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                          voice.gender === "male" ? "bg-blue-500/20 text-blue-600" : "bg-pink-500/20 text-pink-600"
                        )}>
                          {voice.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{voice.name}</div>
                          <div className="text-xs text-muted-foreground">{voice.description}</div>
                        </div>
                      </div>
                      {settings.host1VoiceId === voice.id && (
                        <Check className="w-4 h-4 text-teal-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Host 2 Voice */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <Volume2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <Label className="font-medium">{settings.host2Name}'s Voice</Label>
                  <p className="text-xs text-muted-foreground">Select a voice personality for Host 2</p>
                </div>
              </div>
              <ScrollArea className="h-48 rounded-lg border p-2">
                <div className="space-y-1">
                  {VOICE_OPTIONS.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSettings((s) => ({ ...s, host2VoiceId: voice.id }))}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-md text-left transition-all",
                        settings.host2VoiceId === voice.id
                          ? "bg-indigo-500/10 border border-indigo-500/30"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                          voice.gender === "male" ? "bg-blue-500/20 text-blue-600" : "bg-pink-500/20 text-pink-600"
                        )}>
                          {voice.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{voice.name}</div>
                          <div className="text-xs text-muted-foreground">{voice.description}</div>
                        </div>
                      </div>
                      {settings.host2VoiceId === voice.id && (
                        <Check className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p>💡 Tip: Choose contrasting voices (different genders or accents) for a more engaging conversation.</p>
            </div>
          </TabsContent>

          <TabsContent value="hosts" className="space-y-6 mt-4">
            {/* Host 1 */}
            <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor="host1Name">Host 1 Name</Label>
                  <input
                    id="host1Name"
                    type="text"
                    value={settings.host1Name}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, host1Name: e.target.value }))
                    }
                    className="ml-2 px-2 py-1 text-sm rounded border bg-background"
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Personality</Label>
                <Textarea
                  value={settings.host1Personality}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, host1Personality: e.target.value }))
                  }
                  placeholder="Describe the host's personality..."
                  className="h-20 text-sm"
                />
              </div>
            </div>

            {/* Host 2 */}
            <div className="space-y-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <Label htmlFor="host2Name">Host 2 Name</Label>
                  <input
                    id="host2Name"
                    type="text"
                    value={settings.host2Name}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, host2Name: e.target.value }))
                    }
                    className="ml-2 px-2 py-1 text-sm rounded border bg-background"
                    maxLength={20}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Personality</Label>
                <Textarea
                  value={settings.host2Personality}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, host2Personality: e.target.value }))
                  }
                  placeholder="Describe the host's personality..."
                  className="h-20 text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Overall Tone</Label>
                <Badge variant="outline">{settings.tone}</Badge>
              </div>
              <RadioGroup
                value={settings.tone}
                onValueChange={(v) =>
                  setSettings((s) => ({ ...s, tone: v as PodcastSettings["tone"] }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="enthusiastic" id="enthusiastic" />
                  <Label htmlFor="enthusiastic" className="text-sm cursor-pointer">
                    Enthusiastic
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="balanced" id="balanced" />
                  <Label htmlFor="balanced" className="text-sm cursor-pointer">
                    Balanced
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="serious" id="serious" />
                  <Label htmlFor="serious" className="text-sm cursor-pointer">
                    Serious
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Content Depth</Label>
                <Badge variant="outline">
                  {settings.depth === 1
                    ? "Quick Overview"
                    : settings.depth === 2
                    ? "Summary"
                    : settings.depth === 3
                    ? "Standard"
                    : settings.depth === 4
                    ? "Detailed"
                    : "Comprehensive"}
                </Badge>
              </div>
              <Slider
                value={[settings.depth]}
                onValueChange={([v]) => setSettings((s) => ({ ...s, depth: v }))}
                min={1}
                max={5}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Quick</span>
                <span>Comprehensive</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Custom Instructions (Optional)
              </Label>
              <Textarea
                value={settings.customInstructions}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, customInstructions: e.target.value }))
                }
                placeholder="E.g., 'Focus more on practical examples' or 'Include analogies for complex concepts'"
                className="h-24 text-sm"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-2 mt-6 pt-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Est. ~{estimatedDuration} min podcast
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} className="gap-2">
                <Sparkles className="w-4 h-4" />
                {isFirstTimeSetup ? "Save & Generate" : "Generate Podcast"}
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Change these anytime in{" "}
            <Link to="/profile?tab=settings" className="text-primary hover:underline">
              Profile Settings
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
