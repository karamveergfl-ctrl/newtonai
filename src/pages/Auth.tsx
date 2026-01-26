import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Eye, EyeOff, AlertTriangle, ShieldAlert, BookOpen, Brain, Layers, Mic } from "lucide-react";
import FloatingToolsShowcase from "@/components/FloatingToolsShowcase";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const sha1UpperHex = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
};

const getPwnedPasswordCount = async (password: string) => {
  const hash = await sha1UpperHex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
  });

  if (!res.ok) throw new Error("Failed to verify password safety");

  const text = await res.text();
  const lines = text.split("\n");

  for (const line of lines) {
    const [remoteSuffixRaw, countRaw] = line.trim().split(":");
    if (!remoteSuffixRaw || !countRaw) continue;
    if (remoteSuffixRaw.toUpperCase() === suffix) {
      const count = Number(countRaw);
      return Number.isFinite(count) ? count : 0;
    }
  }
  return 0;
};

type AuthMode = "login" | "signup" | "forgot-password" | "reset-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  const [sessionVerified, setSessionVerified] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check URL for reset mode and wait for session verification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    
    // Check for password reset flow (access_token in hash or type=recovery)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    
    // Not a password reset flow
    if (urlMode !== 'reset' && type !== 'recovery' && !accessToken) {
      return;
    }
    
    setMode('reset-password');
    setIsVerifyingSession(true);
    setRecoveryError(null);
    
    let sessionFound = false;
    
    // Listen for PASSWORD_RECOVERY event from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        sessionFound = true;
        setSessionVerified(true);
        setIsVerifyingSession(false);
      }
    });
    
    // Also check if session already exists (token already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sessionFound = true;
        setSessionVerified(true);
        setIsVerifyingSession(false);
      }
    });
    
    // Timeout for expired/invalid tokens (5 seconds)
    const timeout = setTimeout(() => {
      if (!sessionFound) {
        setIsVerifyingSession(false);
        setRecoveryError('Your password reset link has expired or is invalid. Please request a new one.');
      }
    }, 5000);
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const checkOnboardingAndRedirect = async (session: any) => {
      if (!session) return;
      
      // Check if user has completed onboarding
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();
      
      // Handle stale session - user exists in JWT but not in database
      if (error || !profile) {
        console.warn("Stale session detected in Auth - signing out", error);
        await supabase.auth.signOut();
        return; // Stay on auth page after sign out
      }
      
      if (profile.onboarding_completed) {
        navigate("/dashboard");
      } else {
        navigate("/onboarding");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) checkOnboardingAndRedirect(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) checkOnboardingAndRedirect(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError(null);

    try {
      if (mode === "reset-password") {
        // Verify we have a session before attempting password update
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setRecoveryError("Session expired. Please request a new password reset link.");
          setLoading(false);
          return;
        }
        
        // Validate new password
        if (password.length < 6) {
          setPasswordError("Password must be at least 6 characters");
          throw new Error("Password must be at least 6 characters");
        }
        if (!/[A-Z]/.test(password)) {
          setPasswordError("Password must contain at least 1 capital letter");
          throw new Error("Password must contain at least 1 capital letter");
        }
        if (password !== confirmPassword) {
          setPasswordError("Passwords do not match");
          throw new Error("Passwords do not match");
        }

        const pwnedCount = await getPwnedPasswordCount(password);
        if (pwnedCount > 0) {
          setPasswordError("This password has appeared in data breaches. Please choose a different, more secure password.");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        
        toast({ title: "Password updated!", description: "You can now sign in with your new password." });
        
        // Clear URL params and redirect to login
        window.history.replaceState({}, document.title, '/auth');
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setSessionVerified(false);
      } else if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?mode=reset`,
        });
        if (error) throw error;
        setResetEmailSent(true);
        toast({ title: "Check your email", description: "We've sent you a password reset link." });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You've successfully logged in." });
        navigate("/dashboard");
      } else {
        // Signup mode
        if (password.length < 6) {
          setPasswordError("Password must be at least 6 characters");
          throw new Error("Password must be at least 6 characters");
        }
        if (!/[A-Z]/.test(password)) {
          setPasswordError("Password must contain at least 1 capital letter");
          throw new Error("Password must contain at least 1 capital letter");
        }

        const pwnedCount = await getPwnedPasswordCount(password);
        if (pwnedCount > 0) {
          setPasswordError("This password has appeared in data breaches. Please choose a different, more secure password.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });

        if (error) throw error;

        // Send welcome email in background (don't block signup)
        if (data.user) {
          supabase.functions.invoke('send-welcome-email', {
            body: { email, name: '' }
          }).catch(err => console.error('Failed to send welcome email:', err));
          
          // Set flag for welcome modal
          localStorage.setItem('newtonai_new_signup', 'true');
        }

        toast({ title: "Account created!", description: "You can now log in with your credentials." });
        setMode("login");
      }
    } catch (error: any) {
      if (!passwordError) {
        toast({
          title: "Error",
          description: error.message || "An error occurred during authentication",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEOHead
        title={mode === "login" ? "Sign In" : mode === "forgot-password" ? "Reset Password" : "Sign Up"}
        description="Sign up or log in to NewtonAI. Access AI-powered flashcards, quizzes, summaries, and study tools to boost your learning."
        canonicalPath="/auth"
        noIndex={true}
        keywords="sign up, login, create account, NewtonAI account, student login"
      />
      <div className="flex-1 flex">
        {/* Left Panel - Floating Tools Showcase */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 bg-[hsl(222,47%,11%)] relative overflow-hidden flex-col items-center justify-center p-8 pt-12"
        >
          {/* Background gradient effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
          
          {/* Subtle dot matrix pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.15]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Logo and Tagline Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative z-10 text-center mb-8"
          >
            <Logo size="lg" />
            <p className="mt-4 text-slate-300 text-base max-w-md mx-auto leading-relaxed">
              Transform your learning with AI-powered study tools. Create flashcards, quizzes, and summaries in seconds.
            </p>
          </motion.div>
          
          {/* Floating Tools Showcase - without CTA button */}
          <div className="relative z-10 w-full max-w-xl">
            <FloatingToolsShowcase showCTA={false} />
          </div>
        </motion.div>

      {/* Right Panel - Form */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12"
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo & Tagline */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:hidden text-center mb-8"
          >
            <Logo size="lg" />
            <p className="mt-3 text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              Transform your learning with AI-powered study tools.
            </p>
            
            {/* Mobile Tool Badges */}
            <div className="flex gap-2 justify-center flex-wrap mt-4 px-2">
              {[
                { icon: BookOpen, label: "Notes", color: "from-teal-500/20 to-teal-500/5" },
                { icon: Brain, label: "Quiz", color: "from-purple-500/20 to-purple-500/5" },
                { icon: Layers, label: "Flashcards", color: "from-blue-500/20 to-blue-500/5" },
                { icon: Mic, label: "Podcast", color: "from-amber-500/20 to-amber-500/5" },
              ].map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <span 
                    key={tool.label}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r ${tool.color} border border-border/50 text-foreground flex items-center gap-1.5`}
                  >
                    <IconComponent className="w-3 h-3" />
                    {tool.label}
                  </span>
                );
              })}
            </div>
          </motion.div>

          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              {mode === "login" ? "Welcome Back" : mode === "forgot-password" ? "Reset Password" : mode === "reset-password" ? "Set New Password" : "Start For Free"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
              {mode === "login" ? "Sign in to NewtonAI" : mode === "forgot-password" ? "Forgot your password?" : mode === "reset-password" ? "Create a new password" : "Sign up to NewtonAI"}
            </h2>
            {mode === "forgot-password" && (
              <p className="text-muted-foreground mt-2 text-sm">
                {resetEmailSent 
                  ? "Check your inbox for the reset link." 
                  : "Enter your email and we'll send you a reset link."}
              </p>
            )}
            {mode === "reset-password" && !isVerifyingSession && !recoveryError && (
              <p className="text-muted-foreground mt-2 text-sm">
                Enter your new password below.
              </p>
            )}
          </motion.div>

          {/* Session Verification Loading State */}
          {mode === "reset-password" && isVerifyingSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Verifying your reset link...</p>
            </motion.div>
          )}

          {/* Recovery Error State */}
          {mode === "reset-password" && recoveryError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Reset link expired</p>
                    <p className="text-sm text-muted-foreground mt-1">{recoveryError}</p>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setMode("forgot-password");
                  setRecoveryError(null);
                  setSessionVerified(false);
                  window.history.replaceState({}, document.title, '/auth');
                }}
                className="w-full h-12"
              >
                Request New Reset Link
              </Button>
            </motion.div>
          )}

          {/* Form - Only show when not verifying and no recovery error for reset-password mode */}
          {(mode !== "reset-password" || (sessionVerified && !recoveryError)) && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleAuth}
            className="space-y-5"
          >
            {/* Email Field - Hidden for reset-password mode */}
            {mode !== "reset-password" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 pr-10 bg-background border-border"
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Password Field - Hidden for forgot password, shown for reset-password */}
            {(mode !== "forgot-password") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    {mode === "reset-password" ? "New Password" : "Password"}
                  </Label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => { setMode("forgot-password"); setResetEmailSent(false); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={mode === "login" ? "Enter your password" : mode === "reset-password" ? "Enter new password" : "6+ Characters, 1 Capital letter"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                    required
                    disabled={loading}
                    minLength={6}
                    className={`h-12 pr-10 bg-background border-border ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Error Display */}
                {passwordError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">Password Security Issue</p>
                        <p className="text-xs text-destructive/80 mt-1">{passwordError}</p>
                        {passwordError.includes("data breaches") && (
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 Tip: Use a mix of letters, numbers, and symbols to create a unique password.
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Confirm Password Field - Only for reset-password mode */}
            {mode === "reset-password" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(null); }}
                    required
                    disabled={loading}
                    minLength={6}
                    className={`h-12 pr-10 bg-background border-border ${passwordError?.includes("match") ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90" 
              disabled={loading || (mode === "forgot-password" && resetEmailSent)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {mode === "login" ? "Signing in..." : mode === "forgot-password" ? "Sending..." : mode === "reset-password" ? "Updating password..." : "Creating account..."}
                </>
              ) : (
                <>{mode === "login" ? "Sign In" : mode === "forgot-password" ? (resetEmailSent ? "Email Sent!" : "Send Reset Link") : mode === "reset-password" ? "Update Password" : "Create an account"}</>
              )}
            </Button>

            {/* Divider - Hidden for forgot password and reset-password */}
            {mode !== "forgot-password" && mode !== "reset-password" && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-background px-4 text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-12 text-base font-medium border-border hover:bg-muted/50"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign {mode === "login" ? "in" : "up"} with Google
                </Button>
              </>
            )}

          </motion.form>
          )}

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            {mode === "forgot-password" || mode === "reset-password" ? (
              <p className="text-sm text-muted-foreground">
                {mode === "reset-password" ? "Changed your mind?" : "Remember your password?"}{" "}
                <button
                  type="button"
                  onClick={() => { 
                    setMode("login"); 
                    setResetEmailSent(false); 
                    setPassword("");
                    setConfirmPassword("");
                    setPasswordError(null);
                    // Clear URL params
                    window.history.replaceState({}, document.title, '/auth');
                  }}
                  className="text-primary font-semibold hover:underline"
                  disabled={loading}
                >
                  Back to sign in
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary font-semibold hover:underline"
                  disabled={loading}
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            )}
          </motion.div>

          {/* Terms */}
          {mode === "signup" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-xs text-muted-foreground"
            >
              By creating an account, you agree to our{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </motion.p>
          )}
        </div>
      </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
