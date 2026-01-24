import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const languageNames: Record<string, string> = {
  "en": "English", "hi": "Hindi", "es": "Spanish", "fr": "French",
  "de": "German", "zh": "Chinese", "ja": "Japanese", "ko": "Korean",
  "ar": "Arabic", "pt": "Portuguese", "ru": "Russian", "it": "Italian",
  "bn": "Bengali", "ta": "Tamil", "te": "Telugu", "mr": "Marathi",
  "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam", "pa": "Punjabi"
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
      p_function_name: 'generate-summary',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { content, selectedText, detailLevel = "standard", format = "concise", language = "en", notesStyle = "academic", includeComparison = true, stream = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToSummarize = selectedText || content;
    if (!textToSummarize) {
      throw new Error("No content provided");
    }

    const targetLanguage = languageNames[language] || "English";
    console.log(`Generating ${format} summary with ${detailLevel} detail in ${targetLanguage}`);

    const comparisonInstruction = includeComparison ? `
COMPARISON TABLE GENERATION:
When the content discusses multiple related concepts, automatically create comparison tables:
- Identify 2-4 comparable items
- Create a markdown table with relevant comparison dimensions
- Format: | Feature | Concept A | Concept B |
` : "";

    const styleModifiers: Record<string, string> = {
      "academic": `
STYLE ENHANCEMENT - ACADEMIC:
- Start with an "Executive Summary" prose paragraph
- Each major section should have a "**Core Idea:**" callout (1-2 sentences)
- Write in prose paragraphs where appropriate
- Include COMPARISON TABLES when contrasting concepts
- Use LaTeX for technical variables: $V_z$, $I_c$
- Add "Key Technical Findings" section at the end
`,
      "quick-notes": `
STYLE ENHANCEMENT - QUICK NOTES:
- Use bullet points primarily
- Keep each point brief (1-2 sentences max)
- Focus on essential facts only
- Use **bold** for key terms
- Make it scannable and fast to read
`,
      "slides": `
STYLE ENHANCEMENT - SLIDES:
- Minimal text, sparse content
- Max 3-5 points per section
- One key idea per section
- Headlines and takeaways only
- No paragraphs or detailed explanations
`
    };

    const styleInstruction = styleModifiers[notesStyle] || "";

    const formatPrompts: Record<string, string> = {
      "concise": `You are an expert summarizer. Create a CONCISE summary.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE:
## Executive Summary
[1-2 sentences introducing the main topic]

## 1. Overview
**Core Idea:** [One sentence capturing the main point]
[Brief paragraph explaining the main topic]

## 2. Key Points
**Core Idea:** [The most important insights]
- **Point 1**: Brief, essential takeaway
- **Point 2**: Second key insight
- **Point 3**: Third important point

## 3. Summary
**Core Idea:** [Final synthesis]
[2-3 sentences summarizing the entire content]

## Key Takeaways
- Main insight 1
- Main insight 2
- Main insight 3

RULES:
- Use NUMBERED sections (## 1., ## 2., ## 3.)
- Each section MUST start with **Core Idea:** line
- Write everything in ${targetLanguage}`,

      "detailed": `You are an expert study guide creator. Create a DETAILED analysis.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE:
## Executive Summary
[2-3 prose sentences]

## 1. Overview
**Core Idea:** [1-2 sentence summary]
[Detailed prose paragraph]

## 2. Key Topics
**Core Idea:** [Main themes covered]
[Detailed explanations with examples]

## 3. Key Terms & Definitions
**Core Idea:** [Essential vocabulary]
| Term | Definition | Context |
|------|------------|---------|
[Include 8-12 important terms]

## 4. Comparison (if applicable)
**Core Idea:** [How concepts relate]
| Feature | Option A | Option B |
[Include when content has contrasting concepts]

## 5. Technical Findings
**Core Idea:** [Key technical insights]
- Detailed summary with LaTeX where relevant

## Key Takeaways
- Main insight 1 through 5

RULES:
- Use NUMBERED sections
- Each section MUST start with **Core Idea:** line
- Write everything in ${targetLanguage}`,

      "bullet-points": `You are a skilled note-taker. Create a BULLET POINT summary.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE:
## Executive Summary
[1-2 sentences]

## 1. Main Topic
**Core Idea:** [The central theme]
- Core concept

## 2. Key Points
**Core Idea:** [Most important takeaways]
• **First major point**
  - Supporting detail
• **Second major point**
  - Supporting detail

## 3. Quick Facts
**Core Idea:** [Essential facts]
- Fact 1, 2, 3

## Key Takeaways
□ First through third takeaway

RULES:
- Use NUMBERED sections
- Each section MUST start with **Core Idea:** line
- Write everything in ${targetLanguage}`,

      "academic": `You are an academic writer. Create a FORMAL, scholarly summary.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE:
## Executive Summary
[Formal 3-4 sentence prose paragraph]

## 1. Introduction
**Core Idea:** [Purpose of this section]
[Prose paragraph with context]

## 2. Main Themes
**Core Idea:** [Overview of major themes]
### 2.1 Theme 1: [Name]
[Formal prose analysis with LaTeX]

### 2.2 Theme 2: [Name]
[Scholarly examination]

## 3. Comparison (if applicable)
**Core Idea:** [Contrasting concepts]
| Feature | Concept A | Concept B |

## 4. Key Concepts & Terminology
**Core Idea:** [Academic vocabulary]
| Concept | Definition | Significance |

## 5. Conclusions
**Core Idea:** [Final synthesis]
[Formal prose summary]

## Key Takeaways
- Key findings 1-4

RULES:
- Use NUMBERED sections
- Each section MUST start with **Core Idea:** line
- Write everything in ${targetLanguage}`
    };

    const systemPrompt = `${formatPrompts[format] || formatPrompts["concise"]}\n\n${comparisonInstruction}`;

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
            sendProgress(controller, { stage: "analyzing", progress: 15, message: "Analyzing content..." });

            // Stage 2: Generating
            sendProgress(controller, { stage: "generating", progress: 40, message: "Newton is creating your summary..." });

            const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: `Create a study guide in ${targetLanguage} for this content:\n\n${textToSummarize.slice(0, 10000)}` }
                ],
              }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error("AI gateway error:", response.status, errorText);
              throw new Error(response.status === 429 ? "Rate limit exceeded." : response.status === 402 ? "Payment required." : "AI gateway error");
            }

            // Stage 3: Processing
            sendProgress(controller, { stage: "processing", progress: 80, message: "Formatting summary..." });

            const data = await response.json();
            const summary = data.choices?.[0]?.message?.content || '';

            // Stage 4: Complete
            sendProgress(controller, { stage: "complete", progress: 100, message: "Summary ready!" });

            // Send final result
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", data: { summary } })}\n\n`));
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (error) {
            console.error("Error generating summary:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Failed to generate summary" })}\n\n`));
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
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a study guide in ${targetLanguage} for this content:\n\n${textToSummarize.slice(0, 10000)}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate summary" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
