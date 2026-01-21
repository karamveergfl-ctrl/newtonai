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
import { 
  ProcessingState, 
  animationMap, 
  animationMeta, 
  isLoopingState,
  type AnimationMeta 
} from "@/components/newton/animationConfig";

// Primary display states (unique animations only, excluding IDLE)
const PRIMARY_STATES: ProcessingState[] = [
  ProcessingState.THINKING,
  ProcessingState.WRITING,
  ProcessingState.DONE,
  ProcessingState.CONFUSED,
  ProcessingState.CELEBRATING,
  ProcessingState.SLEEPING,
];

const sizeClasses = {
  sm: "w-24 h-24",
  md: "w-32 h-32",
  lg: "w-48 h-48",
};

// Separate component to handle individual animation refs properly
interface AnimationCardProps {
  state: ProcessingState;
  info: AnimationMeta;
  isSelected: boolean;
  isPlaying: boolean;
  globalSize: "sm" | "md" | "lg";
  copiedState: ProcessingState | null;
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

  const animationData = animationMap[state];
  const loops = isLoopingState(state);

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
            <Badge variant={loops ? "secondary" : "outline"}>
              {loops ? "Loop" : "Play Once"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Animation Display */}
          <div className="flex justify-center items-center bg-muted/30 rounded-lg p-4 min-h-[120px]">
            <div className={sizeClasses[globalSize]}>
              <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop={loops}
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
  const [playingStates, setPlayingStates] = useState<Record<ProcessingState, boolean>>(
    () => PRIMARY_STATES.reduce((acc, state) => ({ ...acc, [state]: true }), {} as Record<ProcessingState, boolean>)
  );
  const [globalSize, setGlobalSize] = useState<"sm" | "md" | "lg">("md");
  const [globalSpeed, setGlobalSpeed] = useState(1);
  const [selectedState, setSelectedState] = useState<ProcessingState>(ProcessingState.THINKING);
  const [copiedState, setCopiedState] = useState<ProcessingState | null>(null);

  const togglePlay = useCallback((state: ProcessingState) => {
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

  const restartAnimation = useCallback((state: ProcessingState) => {
    const ref = lottieRefs.current[state];
    if (ref) {
      ref.goToAndPlay(0);
      setPlayingStates(prev => ({ ...prev, [state]: true }));
    }
  }, []);

  const playAll = useCallback(() => {
    PRIMARY_STATES.forEach(state => {
      lottieRefs.current[state]?.play();
    });
    setPlayingStates(PRIMARY_STATES.reduce((acc, state) => ({ ...acc, [state]: true }), {} as Record<ProcessingState, boolean>));
  }, []);

  const stopAll = useCallback(() => {
    PRIMARY_STATES.forEach(state => {
      lottieRefs.current[state]?.pause();
    });
    setPlayingStates(PRIMARY_STATES.reduce((acc, state) => ({ ...acc, [state]: false }), {} as Record<ProcessingState, boolean>));
  }, []);

  const handleSpeedChange = useCallback((value: number[]) => {
    const speed = value[0];
    setGlobalSpeed(speed);
    PRIMARY_STATES.forEach(state => {
      lottieRefs.current[state]?.setSpeed(speed);
    });
  }, []);

  const copyCodeSnippet = useCallback((state: ProcessingState) => {
    const code = `<LottieNewton processingState={ProcessingState.${state}} size="md" />`;
    navigator.clipboard.writeText(code);
    setCopiedState(state);
    toast({ title: "Copied!", description: "Code snippet copied to clipboard" });
    setTimeout(() => setCopiedState(null), 2000);
  }, []);

  const selectedInfo = animationMeta[selectedState];

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
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Newton Animation Preview</h1>
              <p className="text-sm text-muted-foreground">
                Testing all {PRIMARY_STATES.length} Lottie states • Using centralized animationConfig
              </p>
            </div>
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
          {PRIMARY_STATES.map((state) => (
            <AnimationCard
              key={state}
              state={state}
              info={animationMeta[state]}
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
              <Badge variant="outline" className="font-mono text-xs">
                ProcessingState.{selectedState}
              </Badge>
              <Badge variant={isLoopingState(selectedState) ? "secondary" : "outline"}>
                {isLoopingState(selectedState) ? "Looping" : "Play Once"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-1">Technical Specs</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Duration: {selectedInfo.duration} ({selectedInfo.frames} frames @ 60fps)</li>
                  <li>• Loop: {isLoopingState(selectedState) ? "Yes" : "No (plays once)"}</li>
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

            {/* State Aliases */}
            {(selectedState === ProcessingState.THINKING || selectedState === ProcessingState.WRITING) && (
              <div>
                <h4 className="font-medium mb-1">Also used by</h4>
                <div className="flex gap-2">
                  {selectedState === ProcessingState.THINKING && (
                    <Badge variant="outline" className="font-mono text-xs">ProcessingState.ANALYZING</Badge>
                  )}
                  {selectedState === ProcessingState.WRITING && (
                    <Badge variant="outline" className="font-mono text-xs">ProcessingState.SUMMARIZING</Badge>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Code Example</h4>
              <div className="bg-muted rounded-lg p-3 font-mono text-sm">
                <pre className="overflow-x-auto">{`import { LottieNewton } from "@/components/newton/LottieNewton";
import { ProcessingState } from "@/components/newton/animationConfig";

<LottieNewton processingState={ProcessingState.${selectedState}} size="md" />`}</pre>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => copyCodeSnippet(selectedState)}
              >
                {copiedState === selectedState ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copy snippet
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
