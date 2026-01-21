import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Eye, EyeOff, BookOpen, Brain, Layers, FileText, Sparkles, AlertTriangle, ShieldAlert } from "lucide-react";
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

// Floating study icons configuration
const floatingIcons = [
  { icon: BookOpen, label: "Notes", delay: 0, x: -120, y: -80, color: "text-blue-500" },
  { icon: Brain, label: "Quiz", delay: 0.2, x: 100, y: -100, color: "text-purple-500" },
  { icon: Layers, label: "Flashcards", delay: 0.4, x: -140, y: 60, color: "text-green-500" },
  { icon: FileText, label: "PDF", delay: 0.6, x: 120, y: 40, color: "text-orange-500" },
  { icon: Sparkles, label: "Mind Map", delay: 0.8, x: -80, y: 140, color: "text-pink-500" },
];

type AuthMode = "login" | "signup" | "forgot-password";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/dashboard");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError(null);

    try {
      if (mode === "forgot-password") {
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
        {/* Left Panel - Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden items-center justify-center p-12"
        >
        <div className="text-center max-w-lg relative">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <Logo size="lg" />
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-muted-foreground mb-16"
          >
            Transform your learning with AI-powered study tools. Create flashcards, quizzes, and summaries in seconds.
          </motion.p>

          {/* Phone Mockup with Person and Floating Icons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative mx-auto flex items-end justify-center"
          >
            {/* Floating Study Icons */}
            {floatingIcons.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -10, 0],
                }}
                transition={{
                  opacity: { duration: 0.3, delay: 0.6 + item.delay },
                  scale: { duration: 0.4, delay: 0.6 + item.delay },
                  y: { 
                    duration: 2 + index * 0.3, 
                    repeat: Infinity, 
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: item.delay
                  }
                }}
                className="absolute z-10"
                style={{ 
                  left: `calc(50% + ${item.x}px)`, 
                  top: `calc(50% + ${item.y}px)`,
                }}
              >
                <div className="bg-background/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-border/50 flex items-center gap-2">
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-xs font-medium text-foreground whitespace-nowrap">{item.label}</span>
                </div>
              </motion.div>
            ))}

            {/* Phone Frame */}
            <div className="relative">
              <motion.div 
                className="bg-muted rounded-[2.5rem] p-3 shadow-2xl w-52"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              >
                <div className="bg-background rounded-[2rem] overflow-hidden">
                  {/* Phone Screen Content */}
                  <div className="p-4 space-y-4 min-h-[280px]">
                    {/* App Header */}
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <div className="w-5 h-5 rounded-lg bg-primary flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                        </div>
                      </div>
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    </div>
                    
                    {/* Chat bubbles */}
                    <div className="space-y-3 pt-2">
                      <div className="flex gap-1.5">
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        />
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                      </div>
                      <div className="flex gap-1.5">
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        />
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        />
                        <motion.div 
                          className="w-2.5 h-2.5 rounded-full bg-primary"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      <motion.div 
                        className="w-20 h-7 rounded-lg bg-primary"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Person Illustration */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -right-20 -bottom-2"
              >
                <svg width="100" height="150" viewBox="0 0 100 150" fill="none">
                  {/* Head */}
                  <ellipse cx="50" cy="22" rx="18" ry="20" fill="hsl(var(--muted-foreground) / 0.3)" />
                  {/* Hair */}
                  <path d="M32 18 Q35 8 50 6 Q65 8 68 18 Q65 12 50 10 Q35 12 32 18" fill="hsl(var(--foreground))" />
                  {/* Body/Shirt */}
                  <path d="M30 45 Q35 38 50 36 Q65 38 70 45 L68 100 L32 100 Z" fill="hsl(var(--primary))" />
                  {/* Arms */}
                  <path d="M30 50 Q20 55 18 75 Q16 80 20 82" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="8" strokeLinecap="round" fill="none" />
                  <path d="M70 50 Q80 55 82 70" stroke="hsl(var(--muted-foreground) / 0.3)" strokeWidth="8" strokeLinecap="round" fill="none" />
                  {/* Pants */}
                  <path d="M32 100 L28 148 L42 148 L48 105 L52 105 L58 148 L72 148 L68 100 Z" fill="hsl(var(--foreground))" />
                  {/* Shoes */}
                  <ellipse cx="35" cy="148" rx="10" ry="4" fill="hsl(var(--foreground))" />
                  <ellipse cx="65" cy="148" rx="10" ry="4" fill="hsl(var(--foreground))" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
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
          {/* Mobile Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:hidden flex justify-center mb-8"
          >
            <Logo size="lg" />
          </motion.div>

          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">
              {mode === "login" ? "Welcome Back" : mode === "forgot-password" ? "Reset Password" : "Start For Free"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mt-2">
              {mode === "login" ? "Sign in to NewtonAI" : mode === "forgot-password" ? "Forgot your password?" : "Sign up to NewtonAI"}
            </h2>
            {mode === "forgot-password" && (
              <p className="text-muted-foreground mt-2 text-sm">
                {resetEmailSent 
                  ? "Check your inbox for the reset link." 
                  : "Enter your email and we'll send you a reset link."}
              </p>
            )}
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            onSubmit={handleAuth}
            className="space-y-5"
          >
            {/* Email Field */}
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

            {/* Password Field - Hidden for forgot password */}
            {mode !== "forgot-password" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
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
                    placeholder={mode === "login" ? "Enter your password" : "6+ Characters, 1 Capital letter"}
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

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90" 
              disabled={loading || (mode === "forgot-password" && resetEmailSent)}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {mode === "login" ? "Signing in..." : mode === "forgot-password" ? "Sending..." : "Creating account..."}
                </>
              ) : (
                <>{mode === "login" ? "Sign In" : mode === "forgot-password" ? (resetEmailSent ? "Email Sent!" : "Send Reset Link") : "Create an account"}</>
              )}
            </Button>

            {/* Divider - Hidden for forgot password */}
            {mode !== "forgot-password" && (
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

          {/* Toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6"
          >
            {mode === "forgot-password" ? (
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => { setMode("login"); setResetEmailSent(false); }}
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
