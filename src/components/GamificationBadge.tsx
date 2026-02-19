import { useState, useEffect, useRef, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Flame, 
  Star, 
  BookOpen, 
  Brain, 
  Target,
  Zap,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { LevelUpModal } from "./LevelUpModal";
import { WeeklyStreakCalendar } from "./WeeklyStreakCalendar";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requirement: number;
  type: 'xp' | 'streak' | 'flashcards' | 'quizzes' | 'videos';
  unlocked: boolean;
}

export const GamificationBadge = () => {
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const prevLevelRef = useRef(1);
  const xpRef = useRef(0);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [stats, setStats] = useState({
    flashcardsCompleted: 0,
    quizzesCompleted: 0,
    videosWatched: 0,
  });

  useEffect(() => {
    // Load from localStorage
    const savedXp = localStorage.getItem('smartreader_xp');
    const savedStreak = localStorage.getItem('smartreader_streak');
    const savedStats = localStorage.getItem('smartreader_stats');
    const lastActive = localStorage.getItem('smartreader_last_active');
    
    if (savedXp) {
      const val = parseInt(savedXp, 10);
      xpRef.current = val;
      setXp(val);
    }
    if (savedStats) setStats(JSON.parse(savedStats));
    
    // Load active days
    const savedActiveDays = localStorage.getItem('smartreader_active_days');
    if (savedActiveDays) {
      setActiveDays(JSON.parse(savedActiveDays));
    }
    
    // Calculate streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    // Calculate streak and track active days
    if (lastActive === today) {
      setStreak(parseInt(savedStreak || '0', 10));
    } else if (lastActive === yesterday) {
      const newStreak = (parseInt(savedStreak || '0', 10)) + 1;
      setStreak(newStreak);
      localStorage.setItem('smartreader_streak', newStreak.toString());
      localStorage.setItem('smartreader_last_active', today);
    } else {
      setStreak(1);
      localStorage.setItem('smartreader_streak', '1');
      localStorage.setItem('smartreader_last_active', today);
    }
    
    // Update active days - add today if not already present
    const currentActiveDays = savedActiveDays ? JSON.parse(savedActiveDays) : [];
    if (!currentActiveDays.includes(today)) {
      const updatedDays = [...currentActiveDays, today];
      // Keep only last 30 days to prevent localStorage bloat
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toDateString();
      const filteredDays = updatedDays.filter((d: string) => new Date(d) >= new Date(thirtyDaysAgo));
      localStorage.setItem('smartreader_active_days', JSON.stringify(filteredDays));
      setActiveDays(filteredDays);
    }

    // Listen for XP updates (storage event for cross-tab, custom event for same-tab)
    const handleXpUpdate = () => {
      const newXp = localStorage.getItem('smartreader_xp');
      if (newXp) {
        const newXpValue = parseInt(newXp, 10);
        const currentLevel = Math.floor(newXpValue / 100) + 1;
        
        if (newXpValue > xpRef.current) {
          setIsGlowing(true);
          setTimeout(() => setIsGlowing(false), 1500);
          
          if (currentLevel > prevLevelRef.current) {
            setNewLevel(currentLevel);
            setShowConfetti(true);
            setShowLevelUp(true);
          }
        }
        
        prevLevelRef.current = currentLevel;
        xpRef.current = newXpValue;
        setXp(newXpValue);
      }
    };
    
    window.addEventListener('storage', handleXpUpdate);
    window.addEventListener('xp-update', handleXpUpdate);
    
    return () => {
      window.removeEventListener('storage', handleXpUpdate);
      window.removeEventListener('xp-update', handleXpUpdate);
    };
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);
  const levelProgress = (xp % 100);
  
  // Keep prevLevelRef in sync
  useEffect(() => {
    prevLevelRef.current = level;
  }, [level]);

  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Earn your first 50 XP',
      icon: <Star className="w-5 h-5" />,
      requirement: 50,
      type: 'xp' as const,
      unlocked: xp >= 50,
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'Reach Level 5',
      icon: <Award className="w-5 h-5" />,
      requirement: 500,
      type: 'xp' as const,
      unlocked: xp >= 400,
    },
    {
      id: 'on_fire',
      name: 'On Fire!',
      description: '3 day study streak',
      icon: <Flame className="w-5 h-5" />,
      requirement: 3,
      type: 'streak' as const,
      unlocked: streak >= 3,
    },
    {
      id: 'dedicated',
      name: 'Dedicated Learner',
      description: '7 day study streak',
      icon: <Zap className="w-5 h-5" />,
      requirement: 7,
      type: 'streak' as const,
      unlocked: streak >= 7,
    },
    {
      id: 'quiz_master',
      name: 'Quiz Master',
      description: 'Complete 5 quizzes',
      icon: <Brain className="w-5 h-5" />,
      requirement: 5,
      type: 'quizzes' as const,
      unlocked: stats.quizzesCompleted >= 5,
    },
    {
      id: 'card_collector',
      name: 'Card Collector',
      description: 'Study 10 flashcard decks',
      icon: <BookOpen className="w-5 h-5" />,
      requirement: 10,
      type: 'flashcards' as const,
      unlocked: stats.flashcardsCompleted >= 10,
    },
  ], [xp, streak, stats.quizzesCompleted, stats.flashcardsCompleted]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  const handleLevelUpClose = () => {
    setShowLevelUp(false);
  };

  return (
    <>
      {/* Confetti celebration */}
      <ConfettiCelebration 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
      
      {/* Level up modal */}
      <LevelUpModal 
        isOpen={showLevelUp} 
        level={newLevel} 
        onClose={handleLevelUpClose} 
      />
      
      <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 border border-border hover:bg-muted hover:border-primary/30 transition-all duration-300 cursor-pointer",
            isGlowing && "border-yellow-500/50 shadow-[0_0_12px_hsl(45,100%,50%/0.4)] scale-105"
          )}
        >
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-foreground">{xp} XP</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-foreground">{streak}</span>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">{level}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Level {level}</p>
              <div className="flex items-center gap-2">
                <Progress value={levelProgress} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground">{xpToNextLevel} XP to next</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center p-2 rounded-lg bg-card/50">
              <Trophy className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
              <p className="text-lg font-bold">{xp}</p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-card/50">
              <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold">{streak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-card/50">
              <Target className="w-5 h-5 mx-auto text-green-500 mb-1" />
              <p className="text-lg font-bold">{unlockedCount}/{achievements.length}</p>
              <p className="text-xs text-muted-foreground">Badges</p>
            </div>
          </div>
        </div>
        
        {/* Weekly Streak Calendar */}
        <div className="p-4 border-b">
          <WeeklyStreakCalendar activeDays={activeDays} />
        </div>
        
        <div className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Achievements
          </h4>
          <div className="space-y-2 max-h-48 overflow-auto">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  achievement.unlocked 
                    ? "bg-primary/10" 
                    : "bg-muted/50 opacity-60"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  achievement.unlocked 
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                </div>
                {achievement.unlocked && (
                  <Star className="w-4 h-4 text-yellow-500 shrink-0" fill="currentColor" />
                )}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
      </Popover>
    </>
  );
};
