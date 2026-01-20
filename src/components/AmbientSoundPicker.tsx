import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Loader2, Volume2, VolumeX, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAmbientAudio, AmbientPreset, AMBIENT_PRESETS } from "@/hooks/useAmbientAudio";
import { toast } from "sonner";

interface AmbientSoundPickerProps {
  className?: string;
}

export function AmbientSoundPicker({ className }: AmbientSoundPickerProps) {
  const [open, setOpen] = useState(false);
  const {
    isLoading,
    isPlaying,
    currentPreset,
    volume,
    cachedPresets,
    play,
    stop,
    setVolume,
  } = useAmbientAudio();

  const categories = [
    { id: "nature", label: "Nature", icon: "🌿" },
    { id: "focus", label: "Focus", icon: "🎯" },
    { id: "cozy", label: "Cozy", icon: "🏠" },
    { id: "urban", label: "Urban", icon: "🏙️" },
  ];

  const handlePresetClick = async (preset: AmbientPreset) => {
    try {
      if (currentPreset?.id === preset.id && isPlaying) {
        stop();
        toast.success("Ambient sound stopped");
      } else {
        await play(preset);
        toast.success(`Playing ${preset.name} ambience`);
      }
    } catch (error) {
      toast.error("Failed to play ambient sound");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isPlaying ? "secondary" : "ghost"}
          size="icon"
          className={cn("relative", className)}
          title="Ambient Sounds"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Music className="w-4 h-4" />
          )}
          {isPlaying && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Ambient Sounds</h4>
            {isPlaying && currentPreset && (
              <Badge variant="secondary" className="gap-1">
                {currentPreset.icon} {currentPreset.name}
              </Badge>
            )}
          </div>

          {/* Volume Control */}
          {isPlaying && (
            <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setVolume(volume === 0 ? 0.3 : 0)}
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[volume * 100]}
                onValueChange={([v]) => setVolume(v / 100)}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}

          <Tabs defaultValue="nature" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-9">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs gap-1">
                  <span>{cat.icon}</span>
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-3">
                <div className="grid grid-cols-2 gap-2">
                  <AnimatePresence>
                    {AMBIENT_PRESETS.filter((p) => p.category === cat.id).map(
                      (preset) => {
                        const isActive = currentPreset?.id === preset.id;
                        const isCached = cachedPresets.has(preset.id);

                        return (
                          <motion.button
                            key={preset.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePresetClick(preset)}
                            disabled={isLoading}
                            className={cn(
                              "relative p-3 rounded-lg border text-left transition-colors",
                              isActive && isPlaying
                                ? "bg-primary/10 border-primary"
                                : "bg-card hover:bg-muted/50 border-border",
                              isLoading && currentPreset?.id === preset.id && "opacity-70"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{preset.icon}</span>
                              <span className="text-sm font-medium">
                                {preset.name}
                              </span>
                            </div>
                            
                            {isActive && isPlaying && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1 right-1"
                              >
                                <Check className="w-4 h-4 text-primary" />
                              </motion.div>
                            )}
                            
                            {isCached && !isActive && (
                              <span className="absolute top-1 right-1 text-[10px] text-muted-foreground">
                                cached
                              </span>
                            )}

                            {isLoading && currentPreset?.id === preset.id && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg"
                              >
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      }
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {isPlaying && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                stop();
                toast.success("Ambient sound stopped");
              }}
            >
              Stop Ambient Sound
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            AI-generated ambient sounds to enhance your listening experience
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
