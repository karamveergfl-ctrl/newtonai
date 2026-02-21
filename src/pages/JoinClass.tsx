import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import SEOHead from "@/components/SEOHead";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { OptimizedBackgroundBlobs } from "@/components/OptimizedBackgroundBlobs";
import newtonCharacter from "@/assets/newton-character-sm.webp";

const JoinClass = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { joinClass } = useClasses();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleJoin = async () => {
    if (code.length < 6) return;
    setLoading(true);
    setError(false);
    const result = await joinClass(code.trim());
    setLoading(false);
    if (result) {
      navigate(`/student/class/${result.class_id}`);
    } else {
      setError(true);
      setTimeout(() => setError(false), 600);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <SEOHead title="Join Class" description="Join a class with an invite code" noIndex />
      <OptimizedBackgroundBlobs />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Newton mascot */}
        <motion.img
          src={newtonCharacter}
          alt="Newton"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="h-20 w-20 mx-auto mb-4"
        />

        <Card className="glass border-border/50">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3"
            >
              <GraduationCap className="h-7 w-7 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-display">Join a Class</CardTitle>
            <CardDescription>Enter the 6-digit invite code from your teacher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            <motion.div
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center"
            >
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(val) => setCode(val.toUpperCase())}
                autoFocus
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-14 w-11 text-xl font-mono font-bold"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </motion.div>

            <Button
              onClick={handleJoin}
              disabled={code.length < 6 || loading}
              className="w-full h-12 text-base"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Join Class
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default JoinClass;
