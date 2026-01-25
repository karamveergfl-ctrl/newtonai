import { Play, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdButtonProps {
  duration: 30 | 60;
  reward: number;
  disabled?: boolean;
  loading?: boolean;
  isBestValue?: boolean;
  onClick: () => void;
}

export function AdButton({ 
  duration, 
  reward, 
  disabled, 
  loading, 
  isBestValue,
  onClick 
}: AdButtonProps) {
  return (
    <Button
      variant="outline"
      className={cn(
        "w-full justify-between h-auto py-4 px-5 text-left transition-all",
        isBestValue && "border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full",
          isBestValue ? "bg-primary/20" : "bg-muted"
        )}>
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className={cn(
              "w-5 h-5",
              isBestValue ? "text-primary" : "text-muted-foreground"
            )} />
          )}
        </div>
        <div>
          <div className="font-medium text-foreground">
            Watch {duration} sec video
          </div>
          <div className="text-xs text-muted-foreground">
            {isBestValue ? (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                Best value
              </span>
            ) : (
              "Quick & easy"
            )}
          </div>
        </div>
      </div>
      <div className={cn(
        "text-lg font-bold",
        isBestValue ? "text-primary" : "text-green-600 dark:text-green-400"
      )}>
        +{reward} SC
      </div>
    </Button>
  );
}
