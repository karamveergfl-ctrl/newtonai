import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STUDENT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "student_insights",
      description: "Return structured student learning insights.",
      parameters: {
        type: "object",
        properties: {
          weak_topics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                reason: { type: "string" },
                suggested_action: { type: "string" },
              },
              required: ["topic", "reason", "suggested_action"],
            },
          },
          engagement_analysis: {
            type: "object",
            properties: {
              level: { type: "string", enum: ["high", "medium", "low"] },
              trend: { type: "string", enum: ["rising", "falling", "stable"] },
              recommendation: { type: "string" },
            },
            required: ["level", "trend", "recommendation"],
          },
          risk_assessment: {
            type: "object",
            properties: {
              risk_level: { type: "string", enum: ["low", "medium", "high"] },
              factors: { type: "array", items: { type: "string" } },
              mitigation: { type: "string" },
            },
            required: ["risk_level", "factors", "mitigation"],
          },
          study_plan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "string" },
                focus_area: { type: "string" },
                activity: { type: "string" },
                duration_mins: { type: "number" },
              },
              required: ["day", "focus_area", "activity", "duration_mins"],
            },
          },
        },
        required: ["weak_topics", "engagement_analysis", "risk_assessment", "study_plan"],
      },
    },
  },
];

const TEACHER_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "teacher_insights",
      description: "Return structured teacher class insights.",
      parameters: {
        type: "object",
        properties: {
          reteach_topics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                reason: { type: "string" },
                affected_student_pct: { type: "number" },
              },
              required: ["topic", "reason", "affected_student_pct"],
            },
          },
          students_needing_help: {
            type: "array",
            items: {
              type: "object",
              properties: {
                student_id_short: { type: "string" },
                signals: { type: "array", items: { type: "string" } },
                priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
              },
              required: ["student_id_short", "signals", "priority"],
            },
          },
          assignment_improvements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                suggestion: { type: "string" },
                rationale: { type: "string" },
              },
              required: ["suggestion", "rationale"],
            },
          },
        },
        required: ["reteach_topics", "students_needing_help", "assignment_improvements"],
      },
    },
  },
];

const INSTITUTION_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "institution_insights",
      description: "Return structured institutional insights.",
      parameters: {
        type: "object",
        properties: {
          department_performance: {
            type: "array",
            items: {
              type: "object",
              properties: {
                department: { type: "string" },
                rating: { type: "string", enum: ["excellent", "good", "average", "needs_improvement"] },
                insight: { type: "string" },
              },
              required: ["department", "rating", "insight"],
            },
          },
          exam_difficulty_trends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                course: { type: "string" },
                finding: { type: "string" },
              },
              required: ["course", "finding"],
            },
          },
          attendance_correlations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                finding: { type: "string" },
                recommendation: { type: "string" },
              },
              required: ["finding", "recommendation"],
            },
          },
          overall_recommendations: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["department_performance", "exam_difficulty_trends", "attendance_correlations", "overall_recommendations"],
      },
    },
  },
];

const SYSTEM_PROMPTS: Record<string, string> = {
  student: `You are an academic advisor AI analyzing a student's performance data. Produce actionable insights. NEVER include any PII (names, emails). Use only anonymized IDs and aggregate metrics. Focus on identifying weak areas, engagement patterns, failure risk, and a practical 5-day study plan.`,
  teacher: `You are an educational analytics AI helping a teacher improve their class outcomes. Analyze the class-level data provided. NEVER include PII. Use only short anonymized student IDs (8 chars). Identify topics needing reteaching, students who need intervention, and ways to improve assignments.`,
  institution: `You are an institutional analytics AI producing strategic insights for university/school administrators. Analyze aggregate data across departments and courses. NEVER include PII. Focus on department performance comparisons, exam difficulty anomalies, attendance-performance correlations, and actionable recommendations.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Rate limit
    const { data: rlData } = await supabaseClient.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "generate-academic-insights",
      p_max_requests: 10,
      p_window_minutes: 60,
    });
    if (rlData === false) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, data: payload } = await req.json();
    if (!["student", "teacher", "institution"].includes(type)) {
      throw new Error("Invalid type. Must be student, teacher, or institution.");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const tools = type === "student" ? STUDENT_TOOLS : type === "teacher" ? TEACHER_TOOLS : INSTITUTION_TOOLS;
    const toolName = type === "student" ? "student_insights" : type === "teacher" ? "teacher_insights" : "institution_insights";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[type] },
          { role: "user", content: `Analyze this ${type} data and provide structured insights:\n${JSON.stringify(payload)}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured response from AI");

    const insights = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-academic-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
