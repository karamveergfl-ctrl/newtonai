import { useMemo } from "react";
import type { FormattedSlide, SlideSection } from "@/types/liveSession";

interface UseSlideContentProps {
  slideContent: string;
  slideTitle: string;
}

interface UseSlideContentReturn {
  formattedContent: FormattedSlide | null;
  isProcessing: boolean;
}

function parseSlideContent(raw: string, slideTitle: string): FormattedSlide {
  const lines = raw.split("\n");
  const sections: SlideSection[] = [];
  let detectedTitle = slideTitle;

  for (const line of lines) {
    const trimmed = line.trimEnd();

    if (trimmed.trim() === "") {
      sections.push({ type: "empty", content: "" });
      continue;
    }

    // Heading: starts with # or is ALL CAPS short line
    if (/^#{1,6}\s/.test(trimmed)) {
      const content = trimmed.replace(/^#{1,6}\s+/, "");
      if (!detectedTitle) detectedTitle = content;
      sections.push({ type: "heading", content });
      continue;
    }

    const stripped = trimmed.trim();
    if (
      stripped.length < 60 &&
      stripped.length > 1 &&
      stripped === stripped.toUpperCase() &&
      /[A-Z]/.test(stripped)
    ) {
      if (!detectedTitle) detectedTitle = stripped;
      sections.push({ type: "heading", content: stripped });
      continue;
    }

    // Bullet: starts with - • * or numbered list
    if (/^\s*[-•*]\s/.test(trimmed) || /^\s*\d+[.)]\s/.test(trimmed)) {
      const content = trimmed.replace(/^\s*[-•*]\s+/, "").replace(/^\s*\d+[.)]\s+/, "");
      sections.push({ type: "bullet", content });
      continue;
    }

    // Code: 4+ leading spaces
    if (/^\s{4,}/.test(line) && trimmed.trim().length > 0) {
      sections.push({ type: "code", content: trimmed });
      continue;
    }

    // Body text
    sections.push({ type: "body", content: stripped });
  }

  return {
    title: detectedTitle || "Untitled Slide",
    sections,
  };
}

export function useSlideContent({ slideContent, slideTitle }: UseSlideContentProps): UseSlideContentReturn {
  const formattedContent = useMemo(() => {
    if (!slideContent || slideContent.trim().length === 0) return null;
    return parseSlideContent(slideContent, slideTitle);
  }, [slideContent, slideTitle]);

  return {
    formattedContent,
    isProcessing: false,
  };
}
