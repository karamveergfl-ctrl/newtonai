import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
    
    if (savedXp) setXp(parseInt(savedXp, 10));
    if (savedStats) setStats(JSON.parse(savedStats));
    
    // Calculate streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
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

    // Listen for XP updates
    const handleXpUpdate = () => {
      const newXp = localStorage.getItem('smartreader_xp');
      if (newXp) setXp(parseInt(newXp, 10));
    };
    
    window.addEventListener('storage', handleXpUpdate);
    const interval = setInterval(handleXpUpdate, 1000);
    
    return () => {
      window.removeEventListener('storage', handleXpUpdate);
      clearInterval(interval);
    };
  }, []);

  const level = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);
  const levelProgress = (xp % 100);

  const achievements: Achievement[] = [
    {
      id: 'first_steps',
      name: 'First Steps',
      description: 'Earn your first 50 XP',
      icon: <Star className="w-5 h-5" />,
      requirement: 50,
      type: 'xp',
      unlocked: xp >= 50,
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'Reach Level 5',
      icon: <Award className="w-5 h-5" />,
      requirement: 500,
      type: 'xp',
      unlocked: xp >= 400,
    },
    {
      id: 'on_fire',
      name: 'On Fire!',
      description: '3 day study streak',
      icon: <Flame className="w-5 h-5" />,
      requirement: 3,
      type: 'streak',
      unlocked: streak >= 3,
    },
    {
      id: 'dedicated',
      name: 'Dedicated Learner',
      description: '7 day study streak',
      icon: <Zap className="w-5 h-5" />,
      requirement: 7,
      type: 'streak',
      unlocked: streak >= 7,
    },
    {
      id: 'quiz_master',
      name: 'Quiz Master',
      description: 'Complete 5 quizzes',
      icon: <Brain className="w-5 h-5" />,
      requirement: 5,
      type: 'quizzes',
      unlocked: stats.quizzesCompleted >= 5,
    },
    {
      id: 'card_collector',
      name: 'Card Collector',
      description: 'Study 10 flashcard decks',
      icon: <BookOpen className="w-5 h-5" />,
      requirement: 10,
      type: 'flashcards',
      unlocked: stats.flashcardsCompleted >= 10,
    },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 h-8 px-2"
        >
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold">{xp} XP</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold">{streak}</span>
            </div>
          )}
        </Button>
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
  );
};
