import { useState } from "react";
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
import {
  Coffee,
  GraduationCap,
  Microscope,
  MessageSquare,
  Sparkles,
  User,
  Settings2,
} from "lucide-react";
import { motion } from "framer-motion";

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
  host2Name: string;
  host2Personality: string;
  tone: "enthusiastic" | "balanced" | "serious";
  depth: number; // 1-5, affects segment count and detail
  customInstructions: string;
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
  host2Name: "Sarah",
  host2Personality: PRESETS[0].host2Personality,
  tone: "balanced",
  depth: 3,
  customInstructions: "",
};

interface PodcastStylePresetsProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (settings: PodcastSettings) => void;
}

export function PodcastStylePresets({
  isOpen,
  onClose,
  onGenerate,
}: PodcastStylePresetsProps) {
  const [settings, setSettings] = useState<PodcastSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<"style" | "hosts" | "advanced">("style");

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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="style">Style</TabsTrigger>
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

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Est. ~{estimatedDuration} min podcast
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Podcast
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
