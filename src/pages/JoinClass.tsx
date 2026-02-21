import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, GraduationCap } from "lucide-react";
import { useClasses } from "@/hooks/useClasses";
import SEOHead from "@/components/SEOHead";

const JoinClass = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { joinClass } = useClasses();
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const result = await joinClass(code.trim());
    setLoading(false);
    if (result) {
      navigate(`/student/class/${result.class_id}`);
    }
  };

  // Auto-join if code is in URL
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && urlCode.length === 6) {
      setCode(urlCode);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <SEOHead title="Join Class" description="Join a class with an invite code" noIndex />
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Join a Class</CardTitle>
          <CardDescription>Enter the invite code from your teacher</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="text-center text-2xl font-mono tracking-widest h-14"
            autoFocus
          />
          <Button onClick={handleJoin} disabled={code.length < 6 || loading} className="w-full h-12">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Join Class
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinClass;
