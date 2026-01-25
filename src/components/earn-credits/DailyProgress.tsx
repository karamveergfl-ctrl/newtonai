import { Clock, Film, Coins } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface DailyProgressProps {
  adsWatched: number;
  maxAds: number;
  creditsEarned: number;
  maxCredits: number;
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

export function DailyProgress({ 
  adsWatched, 
  maxAds, 
  creditsEarned, 
  maxCredits 
}: DailyProgressProps) {
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilMidnight());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilMidnight());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const adsProgress = (adsWatched / maxAds) * 100;
  const creditsProgress = (creditsEarned / maxCredits) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Today's Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-500" />
              <span>Videos watched</span>
            </div>
            <span className="font-medium">{adsWatched}/{maxAds}</span>
          </div>
          <Progress 
            value={adsProgress} 
            className="h-2"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span>Credits earned</span>
            </div>
            <span className="font-medium">{creditsEarned}/{maxCredits}</span>
          </div>
          <Progress 
            value={creditsProgress} 
            className="h-2"
          />
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Resets in <span className="font-medium text-foreground">{timeUntilReset}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
