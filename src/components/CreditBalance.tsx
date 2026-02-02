import { Crown, Wallet } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AnimatedCreditCounter } from "@/components/AnimatedCreditCounter";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CreditBalanceProps {
  className?: string;
  showLabel?: boolean;
}

export function CreditBalance({ className, showLabel = false }: CreditBalanceProps) {
  const { credits, loading, isPremium } = useCredits();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const prevCreditsRef = useRef(credits);

  // Check auth state
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Watch for credit changes and trigger glow
  useEffect(() => {
    if (credits > prevCreditsRef.current) {
      setIsGlowing(true);
      setTimeout(() => setIsGlowing(false), 1500);
    }
    prevCreditsRef.current = credits;
  }, [credits]);

  // Don't render if not authenticated
  if (isAuthenticated === false) {
    return null;
  }

  if (loading) {
    return <Skeleton className="h-8 w-20" />;
  }

  if (isPremium) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 hover:border-yellow-500/50 transition-colors cursor-pointer",
            className
          )}>
            <Crown className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Premium</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" align="end">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20">
              <Crown className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold">Premium Member</h3>
              <p className="text-sm text-muted-foreground">
                You have unlimited access to all features
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                ✓ Unlimited usage • ✓ No ads • ✓ Priority support
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border hover:bg-muted hover:border-primary/30 transition-all duration-300 cursor-pointer",
          isGlowing && "border-green-500/50 shadow-[0_0_12px_hsl(142,76%,50%/0.4)] scale-105",
          className
        )}>
          <AnimatedCreditCounter value={credits} showLabel={showLabel} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Header with balance */}
        <div className="p-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Wallet className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold">{credits} <span className="text-sm font-normal text-muted-foreground">SC</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Section */}
        <div className="p-4 space-y-4">
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Premium for unlimited access to all study tools with no limits.
            </p>
          </div>

          {/* Upgrade CTA */}
          <Button 
            className="w-full gap-2" 
            onClick={() => {
              setOpen(false);
              navigate('/pricing');
            }}
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
            <span className="text-xs opacity-80">No limits</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}