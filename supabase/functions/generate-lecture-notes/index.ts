import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (50 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'generate-lecture-notes',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transcription, template, templateStructure, language, notesStyle = "academic", includeComparison = true, stream = false } = await req.json();

    if (!transcription) {
      throw new Error("No transcription provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log(`Generating notes: Template=${template}, Language=${language}, Style=${notesStyle}`);

    const comparisonInstruction = includeComparison ? `
COMPARISON TABLE GENERATION:
Automatically detect and create comparison tables when content discusses:
- Multiple types or categories
- Competing methods or approaches
- Pros vs cons

When detected, create markdown tables with clear headers.
` : "";

    const languageNames: Record<string, string> = {
      "en-US": "English", "es-ES": "Spanish", "fr-FR": "French",
      "de-DE": "German", "it-IT": "Italian", "pt-BR": "Portuguese",
      "zh-CN": "Chinese", "ja-JP": "Japanese", "ko-KR": "Korean",
      "ar-SA": "Arabic", "hi-IN": "Hindi", "ru-RU": "Russian",
    };
    const targetLanguage = languageNames[language] || "English";

    const styleModifiers: Record<string, string> = {
      "academic": `
WRITING STYLE: ACADEMIC & COMPREHENSIVE
- Start with an "Executive Summary" section (2-3 prose sentences)
- Each major section MUST start with "**Core Idea:**" followed by a 1-2 sentence summary
- Write in PROSE PARAGRAPHS with detailed explanations
- Use NUMBERED sections (1., 2., 3.)
- Use LaTeX notation for technical variables: $V_z$, $I_F$
- Add "Key Technical Findings" at the end
`,
      "quick-notes": `
WRITING STYLE: QUICK NOTES (Scannable)
- Use BULLET POINTS as primary format
- Keep explanations BRIEF (1-2 sentences max)
- Focus on KEY FACTS only
- Use **bold** for important terms
- Easy to review quickly
`,
      "slides": `
WRITING STYLE: SLIDES (Minimal)
- VERY sparse content
- Maximum 3-5 bullet points per section
- ONE key idea per section
- Just headlines and key takeaways
- NO paragraphs
`
    };

    const styleInstruction = styleModifiers[notesStyle] || styleModifiers["academic"];

    const templatePrompts: Record<string, string> = {
      "lecture": `Create COMPREHENSIVE lecture notes:

## Executive Summary
[2-3 sentences]

## 1. Overview
**Core Idea:** [Summary of main topic]
[Introduction paragraph]

## 2. Key Concepts
**Core Idea:** [Brief overview of concepts]
### Concept: [Name]
- **Definition**: Explanation
- **Context**: Why it matters
- **Example**: Illustration

## 3. Detailed Notes
**Core Idea:** [Coverage summary]
[Thorough content coverage]

## 4. Key Terms & Definitions
**Core Idea:** [Vocabulary overview]
| Term | Definition |

## 5. Examples & Applications
**Core Idea:** [Practical applications]

## Key Takeaways
- Essential points`,

      "study-guide": `Create a COMPREHENSIVE study guide:

## Executive Summary
[Summary of learning objectives]

## 1. Learning Objectives
**Core Idea:** [What students will understand]
[5-8 specific objectives]

## 2. Chapter Breakdown
**Core Idea:** [Content organization]
### Chapter 1: [Topic]
**Overview**: Introduction
**Key Points**: Main ideas
**Review Questions**: 2-3 questions

## 3. Complete Glossary
**Core Idea:** [All terminology]
| Term | Definition | Example |

## 4. Concept Connections
**Core Idea:** [Relationships between concepts]

## 5. Practice Questions
**Core Idea:** [Testing understanding]

## Key Takeaways`,

      "research": `Create a COMPREHENSIVE research summary:

## Executive Summary
[150-200 word summary]

## 1. Research Topics Covered
**Core Idea:** [Overview of research areas]
### Topic 1: [Name]
- **Scope**: Coverage
- **Key Findings**: Insights
- **Significance**: Importance

## 2. Detailed Analysis
**Core Idea:** [Critical examination]

## 3. Key Insights & Findings
**Core Idea:** [Significant discoveries]

## 4. Methodology Notes
**Core Idea:** [Research approach]

## 5. Implications & Applications
**Core Idea:** [Practical impact]

## Key Takeaways`,

      "project": `Create a COMPREHENSIVE project work plan:

## Executive Summary
[5-7 sentences overview]

## 1. Problem Analysis
**Core Idea:** [Core problem summary]
### Problem Statement
### Root Causes
### Impact Assessment

## 2. Proposed Solution
**Core Idea:** [Recommended approach]
### Solution Overview
### Implementation Steps

## 3. Timeline & Milestones
**Core Idea:** [Project schedule]
| Phase | Description | Duration |

## 4. Success Metrics
**Core Idea:** [Measurement criteria]

## 5. Risks & Mitigation
**Core Idea:** [Challenges and solutions]
| Risk | Impact | Mitigation |

## Key Takeaways`,
    };

    const selectedTemplatePrompt = templatePrompts[template] || templatePrompts["lecture"];
    const structureInfo = templateStructure?.length > 0 
      ? `Consider incorporating: ${templateStructure.join(", ")}` 
      : "";

    const systemPrompt = `You are an expert lecture note-taker.

${styleInstruction}

${comparisonInstruction}

CRITICAL RULES:
1. Use NUMBERED sections: ## 1. Title, ## 2. Title
2. Each section MUST start with **Core Idea:** followed by summary
3. EXPAND content - add context, explanations, definitions
4. Be THOROUGH
5. Include DEFINITIONS for key terms
6. Add EXAMPLES to clarify
7. Output MUST be in ${targetLanguage}
8. Use proper markdown formatting
9. End with "## Key Takeaways"

${structureInfo}

${selectedTemplatePrompt}`;

    // SSE streaming response
    if (stream) {
      const encoder = new TextEncoder();
      
      const sendProgress = (controller: ReadableStreamDefaultController, data: { stage: string; progress: number; message?: string }) => {
        const event = `data: ${JSON.stringify({ type: "progress", ...data })}\n\n`;
        controller.enqueue(encoder.encode(event));
      };

      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            // Stage 1: Analyzing
            sendProgress(controller, { stage: "analyzing", progress: 15, message: "Analyzing transcription..." });

            // Stage 2: Generating
            sendProgress(controller, { stage: "generating", progress: 40, message: "Newton is creating your notes..." });

            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: `Create comprehensive lecture notes from this content. Expand, add definitions, examples. Output in ${targetLanguage}:\n\n${transcription}` },
                ],
                max_tokens: 4000,
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("API error:", response.status, errorText);
              throw new Error(`API request failed: ${response.status}`);
            }

            // Stage 3: Processing
            sendProgress(controller, { stage: "processing", progress: 80, message: "Formatting notes..." });

            const data = await response.json();
            const notes = data.choices?.[0]?.message?.content;

            if (!notes) {
              throw new Error("No notes generated");
            }

            const titleMatch = notes.match(/^#\s*(.+)$/m) || notes.match(/\*\*(.+?)\*\*/);
            const title = titleMatch ? titleMatch[1].trim() : "Lecture Notes";

            // Stage 4: Complete
            sendProgress(controller, { stage: "complete", progress: 100, message: "Notes ready!" });

            // Send final result
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", data: { notes, title } })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error generating lecture notes:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Failed to generate notes" })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(streamResponse, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Non-streaming response (original behavior)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create comprehensive, detailed lecture notes from the following content. Expand on the material, add definitions, examples, and thorough explanations. Output in ${targetLanguage}:\n\n${transcription}` },
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", response.status, errorText);
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const notes = data.choices?.[0]?.message?.content;

    if (!notes) {
      throw new Error("No notes generated");
    }

    const titleMatch = notes.match(/^#\s*(.+)$/m) || notes.match(/\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : "Lecture Notes";

    return new Response(
      JSON.stringify({ notes, title }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating lecture notes:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate notes" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
