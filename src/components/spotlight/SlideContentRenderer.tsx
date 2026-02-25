import type { FormattedSlide } from "@/types/liveSession";

interface SlideContentRendererProps {
  formattedSlide: FormattedSlide | null;
  isLoading: boolean;
  slideIndex?: number;
}

export function SlideContentRenderer({ formattedSlide, isLoading, slideIndex = 0 }: SlideContentRendererProps) {
  if (isLoading || !formattedSlide) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-3">
        <span className="text-2xl">📡</span>
        <p className="text-gray-300 text-sm font-medium">Waiting for your teacher to begin…</p>
        <p className="text-gray-500 text-xs">Slide content will appear here automatically</p>
        <span className="text-gray-500 text-xs tracking-widest animate-pulse">• • •</span>
      </div>
    );
  }

  return (
    <div
      key={slideIndex}
      className="p-4 md:p-6 max-w-2xl mx-auto space-y-1 slide-enter"
    >
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

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .slide-enter {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
