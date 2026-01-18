import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo: string;
  whenAuthenticated: boolean;
}

/**
 * Redirects users based on authentication status
 * - whenAuthenticated=true: redirects authenticated users to redirectTo
 * - whenAuthenticated=false: redirects unauthenticated users to redirectTo
 */
const AuthRedirect = ({ children, redirectTo, whenAuthenticated }: AuthRedirectProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuthenticated = !!session;
      
      if (whenAuthenticated && isAuthenticated) {
        navigate(redirectTo, { replace: true });
      } else if (!whenAuthenticated && !isAuthenticated) {
        navigate(redirectTo, { replace: true });
      } else {
        setShouldRender(true);
      }
      setLoading(false);
    });

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuthenticated = !!session;
      
      if (whenAuthenticated && isAuthenticated) {
        navigate(redirectTo, { replace: true });
      } else if (!whenAuthenticated && !isAuthenticated) {
        navigate(redirectTo, { replace: true });
      } else {
        setShouldRender(true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo, whenAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return shouldRender ? <>{children}</> : null;
};

export default AuthRedirect;
