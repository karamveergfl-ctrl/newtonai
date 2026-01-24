import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  Trophy, 
  Star, 
  Zap, 
  Award,
  Target,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakReward {
  day: number;
  icon: React.ReactNode;
  label: string;
  xpBonus: number;
  unlocked: boolean;
}

interface StudyStreakWidgetProps {
  className?: string;
}

export function StudyStreakWidget({ className }: StudyStreakWidgetProps) {
  const [streak, setStreak] = useState(0);
  const [todayActive, setTodayActive] = useState(false);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    // Load streak data from localStorage
    const savedStreak = localStorage.getItem('smartreader_streak');
    const lastActive = localStorage.getItem('smartreader_last_active');
    const today = new Date().toDateString();
    
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10));
    }
    
    setTodayActive(lastActive === today);
  }, []);

  const rewards: StreakReward[] = [
    { day: 3, icon: <Flame className="w-4 h-4" />, label: "On Fire", xpBonus: 10, unlocked: streak >= 3 },
    { day: 7, icon: <Zap className="w-4 h-4" />, label: "Week Warrior", xpBonus: 25, unlocked: streak >= 7 },
    { day: 14, icon: <Star className="w-4 h-4" />, label: "Dedicated", xpBonus: 50, unlocked: streak >= 14 },
    { day: 30, icon: <Trophy className="w-4 h-4" />, label: "Champion", xpBonus: 100, unlocked: streak >= 30 },
  ];

  const nextReward = rewards.find(r => !r.unlocked);
  const daysToNext = nextReward ? nextReward.day - streak : 0;
  const progress = nextReward ? (streak / nextReward.day) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border border-border/50 bg-card overflow-hidden",
        className
      )}
    >
      {/* Header with streak count */}
      <div className="p-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatDelay: 2
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30"
            >
              <Flame className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <motion.span 
                  key={streak}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-2xl font-bold text-foreground"
                >
                  {streak}
                </motion.span>
                <span className="text-sm text-muted-foreground">day streak</span>
              </div>
              {todayActive ? (
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Active today!
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Study to keep your streak!
                </span>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowRewards(!showRewards)}
            className="p-2 rounded-lg hover:bg-background/50 transition-colors"
          >
            <Award className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Progress to next reward */}
        {nextReward && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Next reward</span>
              <span className="text-foreground font-medium flex items-center gap-1">
                {nextReward.icon}
                {nextReward.label} ({daysToNext} days)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Rewards section (expandable) */}
      <AnimatePresence>
        {showRewards && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/50 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Streak Rewards
              </h4>
              {rewards.map((reward, index) => (
                <motion.div
                  key={reward.day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-lg transition-colors",
                    reward.unlocked 
                      ? "bg-gradient-to-r from-orange-500/10 to-transparent" 
                      : "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      reward.unlocked
                        ? "bg-gradient-to-br from-orange-400 to-red-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {reward.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{reward.label}</p>
                      <p className="text-xs text-muted-foreground">{reward.day} day streak</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Target className="w-3 h-3 text-primary" />
                    <span className="font-medium">+{reward.xpBonus} XP</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Weekly mini-calendar */}
      <div className="px-4 pb-4">
        <WeekMiniCalendar streak={streak} />
      </div>
    </motion.div>
  );
}

function WeekMiniCalendar({ streak }: { streak: number }) {
  const [activeDays, setActiveDays] = useState<string[]>([]);
  
  useEffect(() => {
    const savedActiveDays = localStorage.getItem('smartreader_active_days');
    if (savedActiveDays) {
      setActiveDays(JSON.parse(savedActiveDays));
    }
  }, []);

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  
  const weekDays = days.map((label, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index) - today.getDay() + index);
    const isActive = activeDays.includes(date.toDateString());
    const isToday = date.toDateString() === today.toDateString();
    
    return { label, date, isActive, isToday };
  });

  return (
    <div className="flex justify-between gap-1 mt-3">
      {weekDays.map((day, index) => (
        <motion.div
          key={index}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.03, type: "spring", damping: 15 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] text-muted-foreground">{day.label}</span>
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all",
              day.isActive
                ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md shadow-orange-500/20"
                : "bg-muted/50 text-muted-foreground",
              day.isToday && !day.isActive && "ring-1 ring-primary"
            )}
          >
            {day.isActive ? "✓" : day.date.getDate()}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
