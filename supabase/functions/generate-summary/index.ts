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

    const { content, selectedText, detailLevel = "standard", format = "concise", language = "en", notesStyle = "academic", includeComparison = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const textToSummarize = selectedText || content;
    if (!textToSummarize) {
      throw new Error("No content provided");
    }

    const targetLanguage = languageNames[language] || "English";
    console.log(`Generating ${format} summary with ${detailLevel} detail in ${targetLanguage}, style: ${notesStyle}, comparison: ${includeComparison}, for ${textToSummarize.length} characters`);

    // Comparison table instruction when enabled
    const comparisonInstruction = includeComparison ? `
COMPARISON TABLE GENERATION:
When the content discusses multiple related concepts, methods, types, or approaches, automatically create comparison tables:
- Identify 2-4 comparable items (e.g., "Type A vs Type B", "Method 1 vs Method 2")
- Create a markdown table with relevant comparison dimensions
- Include at least 4-6 rows comparing different attributes
- Format: | Feature | Concept A | Concept B | Concept C |

Example triggers for comparison tables:
- "Types of X" → Compare the types in a table
- "Method A vs Method B" → Direct comparison table
- "Advantages and disadvantages" → Pros/cons table
- "Different approaches" → Approach comparison table
- "Comparing X and Y" → Side-by-side comparison
` : "";

    // Style modifiers based on user preference
    const styleModifiers: Record<string, string> = {
      "academic": `
STYLE ENHANCEMENT - ACADEMIC:
- Start with an "Executive Summary" prose paragraph
- Each major section should have a "**Core Idea:**" callout (1-2 sentences)
- Write in prose paragraphs where appropriate, not just bullets
- Include COMPARISON TABLES when contrasting concepts
- Use LaTeX for technical variables: $V_z$, $I_c$, $\\alpha$
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

    // Format-specific prompts with language instruction
    const formatPrompts: Record<string, string> = {
      "concise": `You are an expert summarizer. Create a CONCISE summary that captures the essence of the content.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All headings, bullet points, and text must be written in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE (follow exactly):

## Executive Summary
[1-2 sentences introducing the main topic and its significance]

## 1. Overview
**Core Idea:** [One sentence capturing the main point of this section]

[Brief paragraph explaining the main topic]

## 2. Key Points
**Core Idea:** [The most important insights at a glance]

- **Point 1**: Brief, essential takeaway
- **Point 2**: Second key insight  
- **Point 3**: Third important point

## 3. Summary
**Core Idea:** [Final synthesis of the content]

[2-3 sentences summarizing the entire content]

## Key Takeaways
- Main insight 1
- Main insight 2
- Main insight 3

RULES:
- Use NUMBERED sections (## 1., ## 2., ## 3.)
- Each section MUST start with **Core Idea:** line
- Be brief and to the point
- Focus only on the most essential information
- Use LaTeX for technical variables: $V_z$, $I_c$
- Write everything in ${targetLanguage}`,

      "detailed": `You are an expert study guide creator. Create a DETAILED analysis with comprehensive coverage.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All headings, terms, definitions, and text must be written in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE (follow exactly):

## Executive Summary
[2-3 prose sentences introducing the topic, its importance, and what will be covered]

## 1. Overview
**Core Idea:** [1-2 sentence summary of this section's main point]

[Detailed prose paragraph explaining the concept]

## 2. Key Topics
**Core Idea:** [The main themes and subjects covered]

For each topic, include:
- Detailed explanation with context
- Examples and applications
[Continue for all major topics]

## 3. Key Terms & Definitions
**Core Idea:** [Essential vocabulary for understanding this topic]

| Term | Definition | Context |
|------|------------|---------|
| Term 1 | Comprehensive definition | Why it matters |
| Term 2 | Detailed explanation | Application |
[Include 8-12 important terms]

## 4. Comparison (if applicable)
**Core Idea:** [How different concepts relate and contrast]

| Feature | Option A | Option B |
|---------|----------|----------|
| Purpose | Description | Description |
[Include when content has contrasting concepts]

## 5. Technical Findings
**Core Idea:** [Key technical insights and conclusions]

- Detailed summary point 1 with LaTeX where relevant ($V_z$, $I_c$)
- Comprehensive takeaway 2
- Important conclusion 3

## Key Takeaways
- Main insight 1
- Main insight 2
- Main insight 3
- Main insight 4
- Main insight 5

RULES:
- Use NUMBERED sections (## 1., ## 2., ## 3., etc.)
- Each section MUST start with **Core Idea:** line
- Be thorough and comprehensive
- Include examples where relevant
- Use LaTeX for technical variables: $V_z$, $I_c$, $\\alpha$
- Write everything in ${targetLanguage}`,

      "bullet-points": `You are a skilled note-taker. Create an easy-to-scan BULLET POINT summary.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All points and text must be written in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE (follow exactly):

## Executive Summary
[1-2 sentences introducing the main topic]

## 1. Main Topic
**Core Idea:** [The central theme or concept being covered]

- Core concept or theme

## 2. Key Points
**Core Idea:** [The most important takeaways]

• **First major point**
  - Supporting detail
  - Additional context
• **Second major point**
  - Supporting detail with technical notation where relevant ($V_z$)
• **Third major point**
  - Supporting detail
[Continue for all major points]

## 3. Quick Facts
**Core Idea:** [Essential facts to remember]

- Fact 1
- Fact 2
- Fact 3

## Key Takeaways
□ First takeaway
□ Second takeaway
□ Third takeaway

RULES:
- Use NUMBERED sections (## 1., ## 2., ## 3.)
- Each section MUST start with **Core Idea:** line
- Use bullet points within sections
- Keep each point brief (under 15 words)
- Use indentation for hierarchy
- Make it scannable at a glance
- Write everything in ${targetLanguage}`,

      "academic": `You are an academic writer. Create a FORMAL, scholarly summary with rich prose and technical precision.

CRITICAL: Your ENTIRE response MUST be in ${targetLanguage}. All sections, terms, and text must be written in ${targetLanguage}.

${styleInstruction}

MANDATORY STRUCTURE (follow exactly):

## Executive Summary
[Formal 3-4 sentence prose paragraph introducing the topic, its significance, and key findings]

## 1. Introduction
**Core Idea:** [1-2 sentence encapsulation of the introduction's purpose]

[Prose paragraph providing context, background, and significance of the topic]

## 2. Main Themes
**Core Idea:** [Overview of the major themes explored]

### 2.1 Theme 1: [Name]

[Formal prose analysis with supporting evidence. Use LaTeX for technical notation: $V_z$, $I_c$, $\\alpha$]

**Key Physical Attributes:** (if applicable)
- **Attribute 1:** Detailed explanation
- **Attribute 2:** Technical details with $LaTeX$ notation

### 2.2 Theme 2: [Name]

[Scholarly examination with examples and implications]

## 3. Comparison (if applicable)
**Core Idea:** [Contrasting key concepts or approaches]

| Feature | Concept A | Concept B |
|---------|-----------|-----------|
| Purpose | Description | Description |
| Behavior | Details with $V_z$ notation | Details |

## 4. Key Concepts & Terminology
**Core Idea:** [Essential academic vocabulary]

| Concept | Definition | Significance |
|---------|------------|--------------|
| Term 1 ($V_z$) | Formal definition | Why it matters |
| Term 2 | Academic explanation | Relevance |

## 5. Conclusions
**Core Idea:** [Final synthesis and implications]

[Formal prose summary of findings, implications, and areas for further study]

## Key Takeaways
- Key finding 1 with LaTeX notation where appropriate
- Key finding 2 with implications
- Key finding 3 with connections to other concepts
- Areas for deeper exploration

RULES:
- Use NUMBERED sections (## 1., ## 2., ## 3., etc.)
- Each section MUST start with **Core Idea:** line
- Use formal, academic language
- Maintain objective tone
- Include scholarly structure
- Reference key concepts formally
- Write everything in ${targetLanguage}`
    };

    const systemPrompt = `${formatPrompts[format] || formatPrompts["concise"]}\n\n${comparisonInstruction}`;

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
