import { useState, useMemo, useCallback } from "react";
import type { RevisionFlashcard } from "@/types/liveSession";

interface UseReportFlashcardsProps {
  flashcards: RevisionFlashcard[];
}

export function useReportFlashcards({ flashcards }: UseReportFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completed, setCompleted] = useState<string[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  const cardId = (card: RevisionFlashcard, idx: number) =>
    `${card.slide_index}-${idx}`;

  const currentCard = useMemo(
    () => (flashcards.length > 0 ? flashcards[currentIndex] ?? null : null),
    [flashcards, currentIndex]
  );

  const progress = useMemo(
    () => (flashcards.length > 0 ? (completed.length / flashcards.length) * 100 : 0),
    [completed.length, flashcards.length]
  );

  const remainingCount = flashcards.length - completed.length;

  const flip = useCallback(() => setIsFlipped((p) => !p), []);

  const next = useCallback(() => {
    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setSessionComplete(true);
    }
  }, [currentIndex, flashcards.length]);

  const markComplete = useCallback(
    (id: string) => {
      setCompleted((prev) => (prev.includes(id) ? prev : [...prev, id]));
    },
    []
  );

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompleted([]);
    setSessionComplete(false);
  }, []);

  return {
    currentIndex,
    isFlipped,
    completed,
    sessionComplete,
    currentCard,
    progress,
    remainingCount,
    flip,
    next,
    markComplete,
    restart,
    cardId,
  };
}
