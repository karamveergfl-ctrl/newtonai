import { useState } from "react";
import { useSpotlightSync } from "@/hooks/useSpotlightSync";
import { SpotlightSyncIndicator } from "./SpotlightSyncIndicator";

interface SpotlightTeacherControlsProps {
  sessionId: string;
}

export function SpotlightTeacherControls({ sessionId }: SpotlightTeacherControlsProps) {
  const { spotlightEnabled, teacherSlideTitle, updateSlideContent } = useSpotlightSync({
    sessionId,
    role: "teacher",
  });
  const [enabled, setEnabled] = useState(spotlightEnabled);

  const handleToggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await updateSlideContent(0, "", "");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-100">
          <span>🔦</span>
          <span>Spotlight</span>
        </div>
        <button
          onClick={handleToggle}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
            enabled ? "bg-teal-500" : "bg-gray-600"
          }`}
          aria-label={enabled ? "Disable spotlight" : "Enable spotlight"}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled ? (
        <div className="space-y-2">
          <SpotlightSyncIndicator sessionId={sessionId} />
          {teacherSlideTitle && (
            <p className="text-xs text-gray-400 truncate">
              Showing: <span className="text-gray-200">{teacherSlideTitle}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400">Students see normal session view</p>
      )}
    </div>
  );
}
