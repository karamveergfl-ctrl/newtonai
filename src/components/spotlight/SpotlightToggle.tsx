interface SpotlightToggleProps {
  sessionId: string;
  onToggle: (spotlightActive: boolean) => void;
  currentView: "spotlight" | "session";
}

export function SpotlightToggle({ onToggle, currentView }: SpotlightToggleProps) {
  const isSpotlight = currentView === "spotlight";

  return (
    <div className="w-full flex justify-center py-2 px-4">
      <div className="relative flex bg-gray-800 rounded-full p-0.5 max-w-xs w-full">
        {/* Sliding background */}
        <div
          className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] bg-teal-500 rounded-full transition-transform duration-200 ease-out"
          style={{ transform: isSpotlight ? "translateX(0)" : "translateX(100%)" }}
        />

        <button
          onClick={() => onToggle(true)}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 min-h-[44px] rounded-full text-sm font-medium transition-colors duration-150 ${
            isSpotlight ? "text-white" : "text-gray-400"
          }`}
          aria-label="Switch to Spotlight view"
          aria-pressed={isSpotlight}
        >
          <span>🔦</span>
          <span>Spotlight</span>
        </button>

        <button
          onClick={() => onToggle(false)}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 min-h-[44px] rounded-full text-sm font-medium transition-colors duration-150 ${
            !isSpotlight ? "text-white" : "text-gray-400"
          }`}
          aria-label="Switch to Session view"
          aria-pressed={!isSpotlight}
        >
          <span>📋</span>
          <span>Session</span>
        </button>
      </div>
    </div>
  );
}
