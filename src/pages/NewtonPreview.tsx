import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/hooks/use-toast";

// Import all Lottie animations
import thinkingAnimation from "@/components/newton/lottie/newton-thinking.json";
import writingAnimation from "@/components/newton/lottie/newton-writing.json";
import completedAnimation from "@/components/newton/lottie/newton-completed.json";
import confusedAnimation from "@/components/newton/lottie/newton-confused.json";
import celebratingAnimation from "@/components/newton/lottie/newton-celebrating.json";
import sleepingAnimation from "@/components/newton/lottie/newton-sleeping.json";

type NewtonState = "thinking" | "writing" | "completed" | "confused" | "celebrating" | "sleeping";

interface AnimationInfo {
  label: string;
  duration: string;
  frames: number;
  loops: boolean;
  useCase: string;
  description: string;
  animation: object;
}

const ANIMATION_INFO: Record<NewtonState, AnimationInfo> = {
  thinking: {
    label: "Thinking",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Processing content, API calls in progress",
    description: "Head bob with floating thought dots and pulsing lightbulb",
    animation: thinkingAnimation,
  },
  writing: {
    label: "Writing",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Generating results, creating content",
    description: "Pencil motion with paper sheets appearing",
    animation: writingAnimation,
  },
  completed: {
    label: "Completed",
    duration: "1.2s",
    frames: 72,
    loops: false,
    useCase: "Success states, task completion",
    description: "Bounce entry with thumbs up and sparkles",
    animation: completedAnimation,
  },
  confused: {
    label: "Confused",
    duration: "2s",
    frames: 120,
    loops: true,
    useCase: "Error states, validation failures",
    description: "Head tilt with floating question marks",
    animation: confusedAnimation,
  },
  celebrating: {
    label: "Celebrating",
    duration: "1.5s",
    frames: 90,
    loops: false,
    useCase: "Level-ups, achievements, streaks",
    description: "Jumping motion with arms raised and confetti",
    animation: celebratingAnimation,
  },
  sleeping: {
    label: "Sleeping",
    duration: "3s",
    frames: 180,
    loops: true,
    useCase: "Idle timeout, inactivity detection",
    description: "Closed eyes with gentle breathing and floating ZZZ",
    animation: sleepingAnimation,
  },
};

const STATES: NewtonState[] = ["thinking", "writing", "completed", "confused", "celebrating", "sleeping"];

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-48 h-48",
};

// Separate component to handle individual animation refs properly
interface AnimationCardProps {
  state: NewtonState;
  info: AnimationInfo;
  isSelected: boolean;
  isPlaying: boolean;
  globalSize: "sm" | "md" | "lg";
  copiedState: NewtonState | null;
  onSelect: () => void;
  onTogglePlay: () => void;
  onRestart: () => void;
  onCopy: () => void;
  registerRef: (ref: LottieRefCurrentProps | null) => void;
}

function AnimationCard({
  state,
  info,
  isSelected,
  isPlaying,
  globalSize,
  copiedState,
  onSelect,
  onTogglePlay,
  onRestart,
  onCopy,
  registerRef,
}: AnimationCardProps) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);

  useEffect(() => {
    registerRef(lottieRef.current);
  }, [registerRef]);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{info.label}</CardTitle>
            <Badge variant={info.loops ? "secondary" : "outline"}>
              {info.loops ? "Loop" : "Play Once"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Animation Display */}
          <div className="flex justify-center items-center bg-muted/30 rounded-lg p-4 min-h-[120px]">
            <div className={sizeClasses[globalSize]}>
              <Lottie
                lottieRef={lottieRef}
                animationData={info.animation}
                loop={info.loops}
                autoplay={true}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onRestart(); }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onCopy(); }}
            >
              {copiedState === state ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* Quick Info */}
          <p className="text-xs text-muted-foreground text-center">
            {info.frames} frames • {info.duration}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function NewtonPreview() {
  const lottieRefs = useRef<Record<string, LottieRefCurrentProps | null>>({});
  const [playingStates, setPlayingStates] = useState<Record<NewtonState, boolean>>(
    () => STATES.reduce((acc, state) => ({ ...acc, [state]: true }), {} as Record<NewtonState, boolean>)
  );
  const [globalSize, setGlobalSize] = useState<"sm" | "md" | "lg">("md");
  const [globalSpeed, setGlobalSpeed] = useState(1);
  const [selectedState, setSelectedState] = useState<NewtonState>("thinking");
  const [copiedState, setCopiedState] = useState<NewtonState | null>(null);

  const togglePlay = useCallback((state: NewtonState) => {
    const ref = lottieRefs.current[state];
    if (ref) {
      if (playingStates[state]) {
        ref.pause();
      } else {
        ref.play();
      }
      setPlayingStates(prev => ({ ...prev, [state]: !prev[state] }));
    }
  }, [playingStates]);

  const restartAnimation = useCallback((state: NewtonState) => {
    const ref = lottieRefs.current[state];
    if (ref) {
      ref.goToAndPlay(0);
      setPlayingStates(prev => ({ ...prev, [state]: true }));
    }
  }, []);

  const playAll = useCallback(() => {
    STATES.forEach(state => {
      lottieRefs.current[state]?.play();
    });
    setPlayingStates(STATES.reduce((acc, state) => ({ ...acc, [state]: true }), {} as Record<NewtonState, boolean>));
  }, []);

  const stopAll = useCallback(() => {
    STATES.forEach(state => {
      lottieRefs.current[state]?.pause();
    });
    setPlayingStates(STATES.reduce((acc, state) => ({ ...acc, [state]: false }), {} as Record<NewtonState, boolean>));
  }, []);

  const handleSpeedChange = useCallback((value: number[]) => {
    const speed = value[0];
    setGlobalSpeed(speed);
    STATES.forEach(state => {
      lottieRefs.current[state]?.setSpeed(speed);
    });
  }, []);

  const copyCodeSnippet = useCallback((state: NewtonState) => {
    const code = `<LottieNewton state="${state}" size="md" />`;
    navigator.clipboard.writeText(code);
    setCopiedState(state);
    toast({ title: "Copied!", description: "Code snippet copied to clipboard" });
    setTimeout(() => setCopiedState(null), 2000);
  }, []);

  const selectedInfo = ANIMATION_INFO[selectedState];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Newton Animation Preview</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Global Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Button onClick={playAll} variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-1" /> Play All
                </Button>
                <Button onClick={stopAll} variant="outline" size="sm">
                  <Pause className="h-4 w-4 mr-1" /> Stop All
                </Button>
              </div>
              
              <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-[300px]">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Speed: {globalSpeed.toFixed(2)}x</span>
                <Slider
                  value={[globalSpeed]}
                  onValueChange={handleSpeedChange}
                  min={0.25}
                  max={2}
                  step={0.25}
                  className="flex-1"
                />
              </div>

              <ToggleGroup type="single" value={globalSize} onValueChange={(v) => v && setGlobalSize(v as "sm" | "md" | "lg")}>
                <ToggleGroupItem value="sm" size="sm">SM</ToggleGroupItem>
                <ToggleGroupItem value="md" size="sm">MD</ToggleGroupItem>
                <ToggleGroupItem value="lg" size="sm">LG</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardContent>
        </Card>

        {/* Animation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STATES.map((state) => (
            <AnimationCard
              key={state}
              state={state}
              info={ANIMATION_INFO[state]}
              isSelected={selectedState === state}
              isPlaying={playingStates[state]}
              globalSize={globalSize}
              copiedState={copiedState}
              onSelect={() => setSelectedState(state)}
              onTogglePlay={() => togglePlay(state)}
              onRestart={() => restartAnimation(state)}
              onCopy={() => copyCodeSnippet(state)}
              registerRef={(ref) => { lottieRefs.current[state] = ref; }}
            />
          ))}
        </div>

        {/* Info Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Selected: {selectedInfo.label}</span>
              <Badge variant={selectedInfo.loops ? "secondary" : "outline"}>
                {selectedInfo.loops ? "Looping" : "Play Once"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Technical Specs</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Duration: {selectedInfo.duration} ({selectedInfo.frames} frames @ 60fps)</li>
                  <li>• Loop: {selectedInfo.loops ? "Yes" : "No (plays once)"}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">Use Case</h4>
                <p className="text-sm text-muted-foreground">{selectedInfo.useCase}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-1">Description</h4>
              <p className="text-sm text-muted-foreground">{selectedInfo.description}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Code Example</h4>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm flex items-center justify-between">
                <code>{`<LottieNewton state="${selectedState}" size="md" />`}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCodeSnippet(selectedState)}
                >
                  {copiedState === selectedState ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
