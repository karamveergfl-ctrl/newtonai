import type { FormattedSlide } from "@/types/liveSession";

interface SlideContentRendererProps {
  formattedSlide: FormattedSlide | null;
  isLoading: boolean;
}

export function SlideContentRenderer({ formattedSlide, isLoading }: SlideContentRendererProps) {
  if (isLoading || !formattedSlide) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <p className="text-gray-400 animate-pulse text-sm">Waiting for slide content…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-1">
      {formattedSlide.title && (
        <h2 className="text-xl font-bold text-white mb-4">{formattedSlide.title}</h2>
      )}

      {formattedSlide.sections.map((section, idx) => {
        switch (section.type) {
          case "heading":
            return (
              <h3 key={idx} className="text-xl font-bold text-white pt-4">
                {section.content}
              </h3>
            );
          case "body":
            return (
              <p key={idx} className="text-base text-gray-200 leading-relaxed">
                {section.content}
              </p>
            );
          case "bullet":
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-teal-400 mt-1.5 text-xs">●</span>
                <span className="text-base text-gray-200">{section.content}</span>
              </div>
            );
          case "code":
            return (
              <pre
                key={idx}
                className="font-mono text-sm text-teal-300 bg-gray-800 rounded px-3 py-2 overflow-x-auto"
              >
                {section.content}
              </pre>
            );
          case "empty":
            return <div key={idx} className="h-2" />;
          default:
            return null;
        }
      })}
    </div>
  );
}
