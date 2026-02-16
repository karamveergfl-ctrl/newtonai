import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SignInRequiredModal } from "@/components/SignInRequiredModal";
import { useLocation } from "react-router-dom";

interface ToolAuthGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Wraps interactive tool UI. Shows children if authenticated,
 * otherwise shows a sign-in CTA. Educational content outside
 * this gate remains visible to crawlers.
 */
export function ToolAuthGate({ children, fallback }: ToolAuthGateProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();

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

  if (session) return <>{children}</>;

  return (
    <>
      {fallback || (
        <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl bg-muted/30">
          <h3 className="text-lg font-semibold mb-2">Sign in to use this tool</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Create a free account to access AI-powered study tools. No credit card required.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-6 hover:bg-primary/90 transition-colors"
          >
            Get Started Free
          </button>
        </div>
      )}
      <SignInRequiredModal
        open={showModal}
        onOpenChange={setShowModal}
        returnTo={location.pathname}
      />
    </>
  );
}
