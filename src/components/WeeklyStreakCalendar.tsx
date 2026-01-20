import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeeklyStreakCalendarProps {
  activeDays: string[]; // Array of date strings (toDateString format)
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeeklyStreakCalendar({ activeDays }: WeeklyStreakCalendarProps) {
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    
    // Get last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({
        date,
        dateString: date.toDateString(),
        dayLabel: DAY_LABELS[date.getDay()],
        isToday: i === 0,
        isActive: activeDays.includes(date.toDateString()),
      });
    }
    
    return days;
  }, [activeDays]);

  const activeCount = weekDays.filter(d => d.isActive).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          This Week
        </h4>
        <span className="text-xs text-muted-foreground">
          {activeCount}/7 days active
        </span>
      </div>
      
      <div className="flex justify-between gap-1">
        {weekDays.map((day, index) => (
          <motion.div
            key={day.dateString}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05, type: "spring", damping: 15 }}
            className="flex flex-col items-center gap-1"
          >
            <span className={cn(
              "text-[10px] font-medium",
              day.isToday ? "text-primary" : "text-muted-foreground"
            )}>
              {day.dayLabel}
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                day.isActive
                  ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md shadow-orange-500/30"
                  : "bg-muted/50 text-muted-foreground",
                day.isToday && !day.isActive && "ring-2 ring-primary/50"
              )}
            >
              {day.isActive ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10 }}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </motion.div>
              ) : (
                <span className="text-xs">{day.date.getDate()}</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Streak fire indicator */}
      {activeCount >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-4 h-4 text-orange-500" />
          </motion.div>
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {activeCount === 7 ? "Perfect week! 🎉" : `${activeCount} day streak this week!`}
          </span>
        </motion.div>
      )}
    </div>
  );
}
