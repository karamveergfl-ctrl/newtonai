import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  Mic,
  Globe,
  Users,
  Volume2,
  Check,
  Podcast,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  usePodcastPreferences, 
  VOICE_OPTIONS, 
  PODCAST_STYLES, 
  PODCAST_LANGUAGES 
} from "@/hooks/usePodcastPreferences";

// Indicator dot component
const IndicatorDot = ({ color }: { color: string }) => (
  <span className={`w-3 h-3 rounded-full ${color} shrink-0`} />
);

// Row item component for consistent styling
const SettingRow = ({
  label,
  value,
  onClick,
  showArrow = true,
}: {
  label: string;
  value?: React.ReactNode;
  onClick?: () => void;
  showArrow?: boolean;
}) => (
  <div
    className={`flex items-center justify-between py-3 ${
      onClick
        ? "cursor-pointer hover:bg-muted/50 -mx-4 px-4 rounded-lg transition-colors"
        : ""
    }`}
    onClick={onClick}
  >
    <span className="text-foreground">{label}</span>
    <div className="flex items-center gap-2 text-muted-foreground">
      {value}
      {showArrow && onClick && <ChevronRight className="h-4 w-4" />}
    </div>
  </div>
);

export function PodcastSettingsSection() {
  const { preferences, savePreferences, hasCompletedSetup } = usePodcastPreferences();
  
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false);
  const [hostNamesDialogOpen, setHostNamesDialogOpen] = useState(false);
  const [depthDialogOpen, setDepthDialogOpen] = useState(false);
  const [activeVoiceHost, setActiveVoiceHost] = useState<1 | 2>(1);
  const [tempHostNames, setTempHostNames] = useState({ 
    host1: preferences.host1Name, 
    host2: preferences.host2Name 
  });
  const [tempDepth, setTempDepth] = useState(preferences.depth);

  const selectedStyle = PODCAST_STYLES.find((s) => s.id === preferences.style);
  const selectedLanguage = PODCAST_LANGUAGES.find((l) => l.code === preferences.language);
  const host1Voice = VOICE_OPTIONS.find((v) => v.id === preferences.host1VoiceId);
  const host2Voice = VOICE_OPTIONS.find((v) => v.id === preferences.host2VoiceId);

  const getDepthLabel = (depth: number) => {
    switch (depth) {
      case 1: return "Quick Overview";
      case 2: return "Summary";
      case 3: return "Standard";
      case 4: return "Detailed";
      case 5: return "Comprehensive";
      default: return "Standard";
    }
  };

  const handleStyleSelect = (styleId: typeof preferences.style) => {
    savePreferences({ style: styleId });
    setStyleDialogOpen(false);
    toast.success("Podcast style updated");
  };

  const handleLanguageSelect = (code: string) => {
    savePreferences({ language: code });
    setLanguageDialogOpen(false);
    toast.success("Podcast language updated");
  };

  const handleVoiceSelect = (voiceId: string) => {
    if (activeVoiceHost === 1) {
      savePreferences({ host1VoiceId: voiceId });
    } else {
      savePreferences({ host2VoiceId: voiceId });
    }
    setVoiceDialogOpen(false);
    toast.success(`Host ${activeVoiceHost} voice updated`);
  };

  const handleHostNamesSave = () => {
    savePreferences({ 
      host1Name: tempHostNames.host1 || "Alex", 
      host2Name: tempHostNames.host2 || "Sarah" 
    });
    setHostNamesDialogOpen(false);
    toast.success("Host names updated");
  };

  const handleDepthSave = () => {
    savePreferences({ depth: tempDepth });
    setDepthDialogOpen(false);
    toast.success("Content depth updated");
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <IndicatorDot color="bg-purple-500" />
              <h3 className="font-semibold">Podcast Settings</h3>
              {!hasCompletedSetup && (
                <Badge variant="secondary" className="text-xs">Not configured</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Default settings for AI Podcast generation
            </p>
          </div>
          <div className="px-4 divide-y divide-border">
            <SettingRow
              label="Style"
              value={
                <div className="flex items-center gap-1.5">
                  <Podcast className="h-3.5 w-3.5" />
                  <span className="text-sm">{selectedStyle?.name || "Casual Chat"}</span>
                </div>
              }
              onClick={() => setStyleDialogOpen(true)}
            />
            <SettingRow
              label="Language"
              value={
                <div className="flex items-center gap-1.5">
                  <span>{selectedLanguage?.flag}</span>
                  <span className="text-sm">{selectedLanguage?.name || "English"}</span>
                </div>
              }
              onClick={() => setLanguageDialogOpen(true)}
            />
            <SettingRow
              label="Host Names"
              value={
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-sm">{preferences.host1Name} & {preferences.host2Name}</span>
                </div>
              }
              onClick={() => {
                setTempHostNames({ host1: preferences.host1Name, host2: preferences.host2Name });
                setHostNamesDialogOpen(true);
              }}
            />
            <SettingRow
              label="Host 1 Voice"
              value={
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="text-sm">{host1Voice?.name || "Roger"}</span>
                </div>
              }
              onClick={() => {
                setActiveVoiceHost(1);
                setVoiceDialogOpen(true);
              }}
            />
            <SettingRow
              label="Host 2 Voice"
              value={
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" />
                  <span className="text-sm">{host2Voice?.name || "Sarah"}</span>
                </div>
              }
              onClick={() => {
                setActiveVoiceHost(2);
                setVoiceDialogOpen(true);
              }}
            />
            <SettingRow
              label="Content Depth"
              value={
                <Badge variant="outline" className="text-xs">
                  {getDepthLabel(preferences.depth)}
                </Badge>
              }
              onClick={() => {
                setTempDepth(preferences.depth);
                setDepthDialogOpen(true);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Style Selection Dialog */}
      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Podcast Style</DialogTitle>
            <DialogDescription>Choose a default conversation style</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {PODCAST_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all",
                  preferences.style === style.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div>
                  <div className="font-medium">{style.name}</div>
                  <div className="text-sm text-muted-foreground">{style.description}</div>
                </div>
                {preferences.style === style.id && (
                  <Check className="h-5 w-5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Language Selection Dialog */}
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Podcast Language</DialogTitle>
            <DialogDescription>Select the language for podcast generation</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72 py-4">
            <div className="grid gap-2">
              {PODCAST_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all",
                    preferences.language === lang.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="font-medium">{lang.name}</span>
                  </div>
                  {preferences.language === lang.code && (
                    <Check className="h-5 w-5 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Voice Selection Dialog */}
      <Dialog open={voiceDialogOpen} onOpenChange={setVoiceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeVoiceHost === 1 ? preferences.host1Name : preferences.host2Name}'s Voice
            </DialogTitle>
            <DialogDescription>Select a voice personality for Host {activeVoiceHost}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-80 py-4">
            <div className="space-y-1">
              {VOICE_OPTIONS.map((voice) => {
                const isSelected = activeVoiceHost === 1 
                  ? preferences.host1VoiceId === voice.id 
                  : preferences.host2VoiceId === voice.id;
                return (
                  <button
                    key={voice.id}
                    onClick={() => handleVoiceSelect(voice.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-md text-left transition-all",
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                          voice.gender === "male"
                            ? "bg-blue-500/20 text-blue-600"
                            : "bg-pink-500/20 text-pink-600"
                        )}
                      >
                        {voice.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{voice.name}</div>
                        <div className="text-xs text-muted-foreground">{voice.description}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Host Names Dialog */}
      <Dialog open={hostNamesDialogOpen} onOpenChange={setHostNamesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Host Names</DialogTitle>
            <DialogDescription>Customize your podcast host names</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="host1Name">Host 1 Name</Label>
              <Input
                id="host1Name"
                value={tempHostNames.host1}
                onChange={(e) => setTempHostNames(prev => ({ ...prev, host1: e.target.value }))}
                placeholder="Alex"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="host2Name">Host 2 Name</Label>
              <Input
                id="host2Name"
                value={tempHostNames.host2}
                onChange={(e) => setTempHostNames(prev => ({ ...prev, host2: e.target.value }))}
                placeholder="Sarah"
                maxLength={20}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleHostNamesSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Depth Dialog */}
      <Dialog open={depthDialogOpen} onOpenChange={setDepthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Content Depth</DialogTitle>
            <DialogDescription>Set how detailed your podcasts should be</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <Badge variant="outline" className="text-lg px-4 py-1">
                {getDepthLabel(tempDepth)}
              </Badge>
            </div>
            <Slider
              value={[tempDepth]}
              onValueChange={([v]) => setTempDepth(v)}
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
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleDepthSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
