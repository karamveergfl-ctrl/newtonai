import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";
import { useGuestTrial } from "@/contexts/GuestTrialContext";
import { GuestTrialLimitModal } from "@/components/GuestTrialLimitModal";

interface ToolAuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps interactive tool UI. Shows children if authenticated OR
 * if guest has remaining trial uses. Once trial is exhausted,
 * shows a conversion CTA. Educational content outside this gate
 * remains visible to crawlers.
 */
export function ToolAuthGate({ children, fallback }: ToolAuthGateProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { guestLimitReached, showTrialPrompt, setShowTrialPrompt } = useGuestTrial();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  // Authenticated users always pass through
  if (session) return <>{children}</>;

  // Guest with remaining trial uses — allow access
  if (!guestLimitReached) {
    return (
      <>
        {children}
        {/* Subtle banner for guests */}
        <p className="text-xs text-center text-muted-foreground mt-3 px-4">
          Sign up to save your generated content
        </p>
        {/* Popup modal when guest attempts generation */}
        <GuestTrialLimitModal
          open={showTrialPrompt}
          onOpenChange={setShowTrialPrompt}
        />
      </>
    );
  }

  // Guest trial exhausted — show inline CTA + modal
  return (
    <>
      {fallback || (
        <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl bg-muted/30">
          <h3 className="text-lg font-semibold mb-2">Create a free account to continue</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            You've used your free trial. Sign up to unlock unlimited AI study tools and save your progress.
          </p>
          <button
            onClick={() => setShowTrialPrompt(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-6 hover:bg-primary/90 transition-colors"
          >
            Get Started Free
          </button>
        </div>
      )}
      <GuestTrialLimitModal
        open={showTrialPrompt}
        onOpenChange={setShowTrialPrompt}
      />
    </>
  );
}
