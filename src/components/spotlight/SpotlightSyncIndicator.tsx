import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { SpotlightSyncStats } from "@/types/liveSession";

interface SpotlightSyncIndicatorProps {
  syncStats: SpotlightSyncStats | null;
}

export function SpotlightSyncIndicator({ syncStats }: SpotlightSyncIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  if (!syncStats) return null;

  const pct = syncStats.sync_percentage;
  const chipColor =
    pct >= 80 ? "bg-green-500/20 text-green-400" :
    pct >= 50 ? "bg-amber-500/20 text-amber-400" :
    "bg-red-500/20 text-red-400";

  const dotColor =
    pct >= 80 ? "bg-green-400" :
    pct >= 50 ? "bg-amber-400" :
    "bg-red-400";

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded((p) => !p)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${chipColor} transition-colors duration-150`}
        aria-label={`${Math.round(pct)}% students synced`}
        aria-expanded={expanded}
      >
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <RefreshCw className="w-3 h-3" />
        <span>{Math.round(pct)}% synced</span>
      </button>

      {expanded && (
        <div className="absolute top-full mt-1 right-0 z-20 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg min-w-[180px] text-xs space-y-1">
          <div className="flex justify-between text-gray-300">
            <span>Total</span>
            <span className="text-white font-medium">{syncStats.total_enrolled}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Synced</span>
            <span className="text-green-400 font-medium">{syncStats.synced_count}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Browsing</span>
            <span className="text-amber-400 font-medium">{syncStats.unsynced_count}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>In Spotlight</span>
            <span className="text-teal-400 font-medium">{syncStats.spotlight_view_count}</span>
          </div>
        </div>
      )}
    </div>
  );
}
