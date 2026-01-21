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

    const { content, selectedText, detailLevel = "standard", format = "concise", language = "en" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToSummarize = selectedText || content;
    if (!textToSummarize) {
      throw new Error("No content provided");
    }

    const targetLanguage = languageNames[language] || "English";
    console.log(`Generating ${format} summary with ${detailLevel} detail in ${targetLanguage} for ${textToSummarize.length} characters`);

    // Format-specific prompts with language instruction
    const formatPrompts: Record<string, string> = {
      "concise": `You are an expert summarizer. Create a CONCISE summary that captures the essence of the content.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All headings, bullet points, and text must be written in ${targetLanguage}.

## Overview
[1-2 sentences introducing the main topic]

## Key Points
- **Point 1**: Brief, essential takeaway
- **Point 2**: Second key insight
- **Point 3**: Third important point
[3-5 bullet points maximum]

## Summary
[2-3 sentences summarizing the entire content]

RULES:
- Be brief and to the point
- Focus only on the most essential information
- Use clear, simple language
- Write everything in ${targetLanguage}`,

      "detailed": `You are an expert study guide creator. Create a DETAILED analysis with comprehensive coverage.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All headings, terms, definitions, and text must be written in ${targetLanguage}.

## Overview
[2-3 sentences introducing the topic and its importance]

## Key Topics
- **Topic 1**: Detailed explanation with context
- **Topic 2**: In-depth coverage with examples
[Continue for 5-8 major topics]

## Key Terms & Definitions
| Term | Definition |
|------|------------|
| Term 1 | Comprehensive definition with context |
| Term 2 | Detailed explanation |
[Include 8-12 important terms]

## Analysis
- In-depth examination of main concepts
- Connections between ideas
- Implications and applications

## Key Takeaways
- Detailed summary point 1
- Comprehensive takeaway 2
- Important conclusion 3
[Include 5-8 bullet points]

RULES:
- Be thorough and comprehensive
- Include examples where relevant
- Explain relationships between concepts
- Write everything in ${targetLanguage}`,

      "bullet-points": `You are a skilled note-taker. Create an easy-to-scan BULLET POINT summary.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All points and text must be written in ${targetLanguage}.

## Main Topic
- Core concept or theme

## Key Points
• First major point
  - Supporting detail
  - Additional context
• Second major point
  - Supporting detail
• Third major point
  - Supporting detail
[Continue for all major points]

## Quick Facts
- Fact 1
- Fact 2
- Fact 3

## Action Items / Takeaways
□ First takeaway
□ Second takeaway
□ Third takeaway

RULES:
- Use bullet points exclusively
- Keep each point brief (under 15 words)
- Use indentation for hierarchy
- Make it scannable at a glance
- Write everything in ${targetLanguage}`,

      "academic": `You are an academic writer. Create a FORMAL, scholarly summary.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All sections, terms, and text must be written in ${targetLanguage}.

## Abstract
[Formal 3-4 sentence overview of the content and its significance]

## Introduction
[Context and background, significance of the topic]

## Main Themes
### Theme 1
[Formal analysis with supporting evidence]

### Theme 2
[Scholarly examination of the concept]

### Theme 3
[Academic discussion of implications]

## Key Concepts & Terminology
| Concept | Definition | Significance |
|---------|------------|--------------|
| Term 1 | Formal definition | Why it matters |
| Term 2 | Academic explanation | Relevance |

## Conclusions
[Formal summary of findings and implications]

## Further Considerations
- Areas for deeper exploration
- Related topics to investigate

RULES:
- Use formal, academic language
- Maintain objective tone
- Include scholarly structure
- Reference key concepts formally
- Write everything in ${targetLanguage}`
    };

    const systemPrompt = formatPrompts[format] || formatPrompts["concise"];

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
    
    console.log("Generated study guide successfully");

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
