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
    // Validate JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log("Missing authorization header");
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
      console.log("Invalid or expired token:", authError?.message);
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

    console.log("Authenticated user:", user.id);

    const { transcription, template, templateStructure, language, notesStyle = "academic" } = await req.json();

    if (!transcription) {
      throw new Error("No transcription provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Generating notes from transcription...");
    console.log("Template:", template);
    console.log("Language:", language);
    console.log("Notes Style:", notesStyle);

    // Get language name for the prompt
    const languageNames: Record<string, string> = {
      "en-US": "English",
      "es-ES": "Spanish",
      "fr-FR": "French",
      "de-DE": "German",
      "it-IT": "Italian",
      "pt-BR": "Portuguese",
      "zh-CN": "Chinese",
      "ja-JP": "Japanese",
      "ko-KR": "Korean",
      "ar-SA": "Arabic",
      "hi-IN": "Hindi",
      "ru-RU": "Russian",
    };
    const targetLanguage = languageNames[language] || "English";

    // Style modifiers based on user preference
    const styleModifiers: Record<string, string> = {
      "academic": `
WRITING STYLE: ACADEMIC & COMPREHENSIVE
- Start with an "Executive Summary" section (2-3 prose sentences introducing the topic)
- Each major section MUST start with "**Core Idea:**" followed by a 1-2 sentence summary
- Write in PROSE PARAGRAPHS with detailed explanations, not just bullet lists
- Use NUMBERED sections (1., 2., 3.) for major topics
- Include COMPARISON TABLES when contrasting concepts (use markdown tables)
- Use LaTeX notation for ALL technical variables: $V_z$, $I_F$, $R_b$, $\\alpha$
- Add "Key Technical Findings" or "Key Takeaways" section at the end
- Include "Key Physical Attributes:" or "Key Parameters:" sub-sections where relevant
- Academic, formal tone with thorough explanations
`,
      "quick-notes": `
WRITING STYLE: QUICK NOTES (Scannable)
- Use BULLET POINTS as the primary format
- Keep explanations BRIEF (1-2 sentences max per point)
- Focus on KEY FACTS and essential information only
- Use **bold** for important terms and concepts
- NO lengthy paragraphs - everything should be scannable
- Easy to review quickly before exams
- Skip detailed background - just the essentials
- Use short, punchy statements
`,
      "slides": `
WRITING STYLE: SLIDES (Minimal & Presentation-Ready)
- VERY sparse content - think "presentation slides"
- Maximum 3-5 bullet points per section
- ONE key idea per section/slide
- Large, impactful statements only
- NO paragraphs, NO detailed explanations
- Just headlines and key takeaways
- Perfect for quick revision or presentations
- Use bold for emphasis on critical terms
`
    };

    const styleInstruction = styleModifiers[notesStyle] || styleModifiers["academic"];

    // Template-specific prompts - COMPREHENSIVE and DETAILED (not summaries!)
    const templatePrompts: Record<string, string> = {
      "lecture": `Create COMPREHENSIVE lecture notes following this structure:

## 📚 Overview
Introduce the main topic and explain its importance and context (3-5 sentences minimum).

## 🔑 Key Concepts
For EACH major concept mentioned:
### Concept: [Name]
- **Definition**: Clear, complete explanation of what this is
- **Context**: Why this matters and how it connects to the broader topic
- **Details**: In-depth elaboration with supporting information
- **Example**: A practical illustration or real-world application

(Include ALL concepts from the source material, not just 2-3)

## 📝 Detailed Notes
Provide thorough coverage of the content including:
- Complete explanations of all topics discussed
- Supporting details and background information
- Logical connections between different ideas
- Any formulas, processes, or methodologies mentioned

## 📖 Key Terms & Definitions
Create a comprehensive glossary:
| Term | Definition |
|------|------------|
(List ALL important terminology with clear, complete definitions)

## 💡 Examples & Applications
- Practical examples that reinforce understanding
- Real-world applications of the concepts
- How these ideas can be applied

## ✅ Key Takeaways
- List 5-10 essential points for revision
- Include the most important insights
- Highlight what students should remember

## 📌 Study Tips
- Specific suggestions for mastering this material
- Recommended ways to review and practice
- Connections to related topics for further study`,

      "study-guide": `Create a COMPREHENSIVE study guide following this structure:

## 📋 Learning Objectives
List 5-8 specific things students will understand after studying this material.

## 📚 Chapter Breakdown
Break the content into logical chapters/sections:

### Chapter 1: [Topic Name]
**Overview**: Detailed introduction to this section
**Key Points**:
- Point 1 with full explanation
- Point 2 with full explanation
- (continue for all points)
**Important Details**: Additional context and elaboration
**Review Questions**: 2-3 questions to test understanding

### Chapter 2: [Topic Name]
(Continue same structure for all chapters)

## 📖 Complete Glossary
| Term | Definition | Example |
|------|------------|---------|
(Comprehensive list of all terminology)

## 🔗 Concept Connections
Explain how different concepts relate to each other with a visual or textual map.

## ✍️ Practice Questions
Include 5-10 questions covering the material:
1. Question about concept X
2. Question about concept Y
(Include answers or hints)

## 📝 Action Items
- Specific study tasks to complete
- Exercises to reinforce learning
- Topics to research further`,

      "research": `Create a COMPREHENSIVE research summary following this structure:

## 📄 Abstract
A detailed summary of the entire content (150-200 words) covering the main topics, findings, and significance.

## 🎯 Research Topics Covered
For each topic:
### Topic 1: [Name]
- **Scope**: What aspects are covered
- **Key Findings**: Detailed findings and insights
- **Methodology**: How information was gathered or conclusions reached
- **Significance**: Why this matters

### Topic 2: [Name]
(Continue for all topics)

## 📊 Detailed Analysis
- In-depth examination of the content
- Critical evaluation of arguments or claims
- Strengths and limitations identified
- Comparisons with related work if applicable

## 💡 Key Insights & Findings
1. Finding 1 with detailed explanation
2. Finding 2 with detailed explanation
(List all significant insights)

## 🔍 Methodology Notes
- How information was presented or gathered
- Any frameworks or approaches used
- Data sources or references mentioned

## 📈 Implications & Applications
- Practical applications of the findings
- Impact on the field or related areas
- Future directions suggested

## 📚 References & Further Reading
- Topics to explore further
- Related concepts to investigate
- Suggested resources if mentioned`,

      "project": `Create a COMPREHENSIVE project work plan following this structure:

## 📋 Executive Summary
Detailed overview of the project scope and objectives (5-7 sentences).

## 🎯 Problem Analysis
### Problem Statement
- Clear, detailed description of the problem or challenge
- Context and background information
- Why this problem needs to be addressed

### Root Causes
- Underlying factors contributing to the problem
- Analysis of each cause

### Impact Assessment
- Effects of the problem if left unaddressed
- Stakeholders affected

## 💡 Proposed Solution
### Solution Overview
Comprehensive description of the proposed approach.

### Implementation Steps
1. **Step 1**: [Description]
   - Detailed actions required
   - Resources needed
   - Expected outcomes
2. **Step 2**: [Description]
   (Continue for all steps)

### Technical Requirements
- Tools, technologies, or resources needed
- Prerequisites and dependencies

## 📅 Timeline & Milestones
| Phase | Description | Duration |
|-------|-------------|----------|
(Suggested timeline based on the content)

## ✅ Success Metrics
- How to measure if the solution works
- Key performance indicators
- Evaluation criteria

## ⚠️ Risks & Mitigation
| Risk | Impact | Mitigation Strategy |
|------|--------|---------------------|
(Potential challenges and how to address them)

## 📝 Next Steps
- Immediate actions to take
- Resources to gather
- People to involve`,
    };

    const selectedTemplatePrompt = templatePrompts[template] || templatePrompts["lecture"];
    const structureInfo = templateStructure?.length > 0 
      ? `Consider incorporating these key sections: ${templateStructure.join(", ")}` 
      : "";

    const systemPrompt = `You are an expert lecture note-taker and educational content creator. Your task is to create COMPREHENSIVE, DETAILED lecture notes that EXPAND upon the source material.

${styleInstruction}

CRITICAL RULES:
1. EXPAND the content - add context, explanations, definitions, and elaboration
2. Be THOROUGH - if the input mentions something briefly, explain it more fully
3. Include DEFINITIONS for all key terms mentioned
4. Add EXAMPLES to clarify concepts where appropriate
5. Structure information clearly with proper headings, subheadings, and bullet points
6. Output MUST be in ${targetLanguage}
7. Use proper markdown formatting with headers (##, ###), bullet points, bold (**text**), and tables
8. Make the notes suitable for studying and revision
9. Add logical CONNECTIONS between ideas
10. Correct any spelling, grammar, and language errors
11. For technical content, use LaTeX notation: $V_z$, $I_c$, $\\alpha$, $\\beta$

${structureInfo}

${selectedTemplatePrompt}`;

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

    // Extract title from the notes (first heading)
    const titleMatch = notes.match(/^#\s*(.+)$/m) || notes.match(/\*\*(.+?)\*\*/);
    const title = titleMatch ? titleMatch[1].trim() : "Lecture Notes";

    console.log("Notes generated successfully");

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
