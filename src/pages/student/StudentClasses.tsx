import { useClasses } from "@/hooks/useClasses";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SEOHead from "@/components/SEOHead";
import { AppLayout } from "@/components/AppLayout";

const StudentClasses = () => {
  const { classes, loading } = useClasses();
  const navigate = useNavigate();

  return (
    <AppLayout>
      <SEOHead title="My Classes" description="View your enrolled classes" noIndex />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">My Classes</h1>
          <Button onClick={() => navigate("/join-class")} variant="outline">
            Join a Class
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : classes.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No classes yet</h2>
              <p className="text-muted-foreground mb-6">Ask your teacher for an invite code</p>
              <Button onClick={() => navigate("/join-class")}>Join a Class</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <Card
                key={cls.id}
                className="cursor-pointer hover:border-primary/30 transition-colors group"
                onClick={() => navigate(`/student/class/${cls.id}`)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold text-lg">{cls.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {cls.subject && <Badge variant="secondary">{cls.subject}</Badge>}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StudentClasses;
