import { useRef, useEffect, useCallback, useState } from "react";

interface UseAudioWaveformOptions {
  barCount?: number;
  minBarHeight?: number;
  maxBarHeight?: number;
  smoothingFactor?: number;
}

interface UseAudioWaveformReturn {
  analyzerRef: React.RefObject<AnalyserNode | null>;
  waveformData: number[];
  connectToStream: (stream: MediaStream) => void;
  connectToAudioElement: (audio: HTMLAudioElement) => void;
  disconnect: () => void;
  isActive: boolean;
}

export function useAudioWaveform(options: UseAudioWaveformOptions = {}): UseAudioWaveformReturn {
  const {
    barCount = 32,
    minBarHeight = 4,
    maxBarHeight = 100,
    smoothingFactor = 0.8,
  } = options;

  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(() => Array(barCount).fill(minBarHeight));
  const [isActive, setIsActive] = useState(false);
  const previousDataRef = useRef<number[]>(Array(barCount).fill(minBarHeight));

  const createAnalyzer = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const analyzer = audioContextRef.current.createAnalyser();
    analyzer.fftSize = 128;
    analyzer.smoothingTimeConstant = smoothingFactor;
    analyzerRef.current = analyzer;
    
    return analyzer;
  }, [smoothingFactor]);

  const updateWaveform = useCallback(() => {
    if (!analyzerRef.current || !isActive) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzerRef.current.getByteFrequencyData(dataArray);

    // Map frequency data to bar heights with smoothing
    const bars: number[] = [];
    const step = Math.floor(bufferLength / barCount);
    
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      const start = i * step;
      for (let j = 0; j < step; j++) {
        sum += dataArray[start + j] || 0;
      }
      const average = sum / step;
      // Normalize to percentage (0-100)
      const normalized = (average / 255) * maxBarHeight;
      // Apply smoothing with previous value
      const smoothed = previousDataRef.current[i] * 0.3 + normalized * 0.7;
      bars.push(Math.max(minBarHeight, Math.min(maxBarHeight, smoothed)));
    }

    previousDataRef.current = bars;
    setWaveformData(bars);

    animationRef.current = requestAnimationFrame(updateWaveform);
  }, [barCount, minBarHeight, maxBarHeight, isActive]);

  const connectToStream = useCallback((stream: MediaStream) => {
    const analyzer = createAnalyzer();
    if (!audioContextRef.current) return;

    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyzer);
    
    setIsActive(true);
  }, [createAnalyzer]);

  const connectToAudioElement = useCallback((audio: HTMLAudioElement) => {
    const analyzer = createAnalyzer();
    if (!audioContextRef.current) return;

    // Check if audio element is already connected
    try {
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
      sourceRef.current.connect(analyzer);
      analyzer.connect(audioContextRef.current.destination);
    } catch (e) {
      // Already connected, just update the analyzer
    }
    
    setIsActive(true);
  }, [createAnalyzer]);

  const disconnect = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        // Already disconnected
      }
      sourceRef.current = null;
    }

    setIsActive(false);
    setWaveformData(Array(barCount).fill(minBarHeight));
    previousDataRef.current = Array(barCount).fill(minBarHeight);
  }, [barCount, minBarHeight]);

  // Start/stop animation based on isActive
  useEffect(() => {
    if (isActive) {
      animationRef.current = requestAnimationFrame(updateWaveform);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, updateWaveform]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [disconnect]);

  return {
    analyzerRef,
    waveformData,
    connectToStream,
    connectToAudioElement,
    disconnect,
    isActive,
  };
}
