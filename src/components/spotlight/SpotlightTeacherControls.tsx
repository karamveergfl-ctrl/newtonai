import { SpotlightSyncIndicator } from "./SpotlightSyncIndicator";
import type { SpotlightSyncStats } from "@/types/liveSession";

interface SpotlightTeacherControlsProps {
  sessionId: string;
  spotlightEnabled: boolean;
  teacherSlideTitle: string;
  syncStats: SpotlightSyncStats | null;
  onToggleSpotlight: (enabled: boolean) => void;
}

export function SpotlightTeacherControls({
  spotlightEnabled,
  teacherSlideTitle,
  syncStats,
  onToggleSpotlight,
}: SpotlightTeacherControlsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-100">
          <span>🔦</span>
          <span>Spotlight</span>
        </div>
        <button
          onClick={() => onToggleSpotlight(!spotlightEnabled)}
          className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
            spotlightEnabled ? "bg-teal-500" : "bg-gray-600"
          }`}
          aria-label={spotlightEnabled ? "Disable spotlight" : "Enable spotlight"}
          role="switch"
          aria-checked={spotlightEnabled}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
              spotlightEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {spotlightEnabled ? (
        <div className="space-y-2">
          <SpotlightSyncIndicator syncStats={syncStats} />
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
