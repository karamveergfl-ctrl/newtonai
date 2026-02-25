import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, AlertTriangle, TrendingUp, TrendingDown, Minus, Shield, Calendar, BookOpen, Target } from "lucide-react";
import { toast } from "sonner";

interface Props {
  classId: string;
  performanceData: any;
}

interface StudentInsights {
  weak_topics: { topic: string; reason: string; suggested_action: string }[];
  engagement_analysis: { level: string; trend: string; recommendation: string };
  risk_assessment: { risk_level: string; factors: string[]; mitigation: string };
  study_plan: { day: string; focus_area: string; activity: string; duration_mins: number }[];
}

export function StudentLearningInsights({ classId, performanceData }: Props) {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<StudentInsights | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const payload = {
        attendance_pct: performanceData?.attendance_pct ?? 0,
        average_score: performanceData?.average_score ?? 0,
        rank: performanceData?.rank ?? 0,
        total_students: performanceData?.total_students ?? 0,
        assignments_completed: performanceData?.assignments_completed ?? 0,
        total_assignments: performanceData?.total_assignments ?? 0,
        scores: (performanceData?.scores || []).map((s: any) => ({
          title: s.title,
          percentage: s.percentage,
          status: s.status,
        })),
        weak_questions: (performanceData?.weak_questions || []).slice(0, 10).map((q: any) => ({
          question: q.question,
          assignment_title: q.assignment_title,
        })),
      };

      const { data, error } = await supabase.functions.invoke("generate-academic-insights", {
        body: { type: "student", data: payload },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsights(data.insights);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  const trendIcon = insights?.engagement_analysis?.trend === "rising"
    ? <TrendingUp className="h-4 w-4 text-green-500" />
    : insights?.engagement_analysis?.trend === "falling"
    ? <TrendingDown className="h-4 w-4 text-destructive" />
    : <Minus className="h-4 w-4 text-muted-foreground" />;

  const riskColor = insights?.risk_assessment?.risk_level === "high"
    ? "destructive" : insights?.risk_assessment?.risk_level === "medium"
    ? "secondary" : "outline";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" /> AI Learning Insights
        </h3>
        <Button size="sm" variant="outline" onClick={generateInsights} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
          {insights ? "Refresh" : "Generate"}
        </Button>
      </div>

      {!insights && !loading && (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click "Generate" to get AI-powered learning insights personalized for you.</p>
          </CardContent>
        </Card>
      )}

      {insights && (
        <div className="space-y-4">
          {/* Engagement & Risk Row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 text-center">
                {trendIcon}
                <p className="text-sm font-semibold mt-1 capitalize">{insights.engagement_analysis.level} Engagement</p>
                <p className="text-[11px] text-muted-foreground capitalize">{insights.engagement_analysis.trend} trend</p>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="pt-4 pb-3 text-center">
                <Shield className="h-4 w-4 mx-auto text-muted-foreground" />
                <Badge variant={riskColor as any} className="mt-1 capitalize">{insights.risk_assessment.risk_level} Risk</Badge>
                <p className="text-[11px] text-muted-foreground mt-1">{insights.risk_assessment.factors.length} factor(s)</p>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Recommendation */}
          <Card className="border-border/50 border-l-4 border-l-primary">
            <CardContent className="py-3 px-4">
              <p className="text-sm">{insights.engagement_analysis.recommendation}</p>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          {insights.risk_assessment.factors.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {insights.risk_assessment.factors.map((f, i) => (
                  <p key={i} className="text-sm text-muted-foreground">• {f}</p>
                ))}
                <p className="text-sm font-medium mt-2">{insights.risk_assessment.mitigation}</p>
              </CardContent>
            </Card>
          )}

          {/* Weak Topics */}
          {insights.weak_topics.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-amber-500" /> Weak Topics
              </h4>
              <div className="space-y-2">
                {insights.weak_topics.map((t, i) => (
                  <Card key={i} className="border-l-4 border-l-amber-500 border-border/50">
                    <CardContent className="py-3 px-4">
                      <p className="text-sm font-medium">{t.topic}</p>
                      <p className="text-[11px] text-muted-foreground">{t.reason}</p>
                      <p className="text-[11px] text-primary mt-1">→ {t.suggested_action}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Study Plan */}
          {insights.study_plan.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" /> Personalized Study Plan
              </h4>
              <div className="space-y-2">
                {insights.study_plan.map((s, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{s.day}: {s.focus_area}</p>
                        <p className="text-[11px] text-muted-foreground">{s.activity}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{s.duration_mins}m</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
