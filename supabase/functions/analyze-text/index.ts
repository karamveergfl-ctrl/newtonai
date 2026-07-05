import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { LATEX_HYGIENE } from "../_shared/latex-hygiene.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchYouTube(urlWithoutKey: string): Promise<Response> {
  const primary = Deno.env.get("YOUTUBE_API_KEY");
  const secondary = Deno.env.get("YOUTUBE_API_KEY_2");
  const tertiary = Deno.env.get("YOUTUBE_API_KEY_3");
  if (!primary && !secondary && !tertiary) throw new Error("YOUTUBE_API_KEY not configured");
  const sep = urlWithoutKey.includes("?") ? "&" : "?";
  const keys = [primary, secondary, tertiary].filter(Boolean) as string[];
  let last: Response | null = null;
  for (let i = 0; i < keys.length; i++) {
    const res = await fetch(`${urlWithoutKey}${sep}key=${keys[i]}`);
    if (res.ok) return res;
    if ((res.status === 403 || res.status === 429) && i < keys.length - 1) {
      const body = await res.clone().text();
      if (/quota|rateLimit|dailyLimit/i.test(body)) {
        console.warn(`[youtube] key #${i + 1} quota hit, falling back`);
        last = res;
        continue;
      }
    }
    return res;
  }
  return last as Response;
}

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

    // Check rate limit (60 requests per hour)
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_function_name: 'analyze-text',
      p_max_requests: 60,
      p_window_minutes: 60
    });

    if (rateLimitError || !allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { imageData, text, stream, language } = await req.json();
    
    // Image validation
    if (imageData) {
      // Check size limit (10MB for base64, which is ~7.5MB actual image)
      const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
      if (imageData.length > MAX_IMAGE_SIZE) {
        return new Response(
          JSON.stringify({ error: 'Image size exceeds 10MB limit. Please use a smaller image.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate base64 image format
      const validImagePattern = /^data:image\/(png|jpeg|jpg|webp|gif|bmp);base64,/i;
      if (!validImagePattern.test(imageData)) {
        return new Response(
          JSON.stringify({ error: 'Invalid image format. Supported formats: PNG, JPEG, WebP, GIF, BMP.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    const hasImage = !!imageData;
    const hasText = !!text?.trim();
    
    console.log("Analyzing content with Gemini 2.5 Flash, streaming:", stream, "hasImage:", hasImage, "hasText:", hasText);

    if (!hasImage && !hasText) {
      throw new Error("No content provided - please provide text or an image");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const langInstruction = language && language !== "en" 
      ? `\nIMPORTANT: Respond in ${language} language.` 
      : "";

    // -----------------------------------------------------------------
    // Pre-flight OCR/vision extraction (images only) with auto-retry.
    // We ask Gemini Pro to transcribe the image into strict JSON, then
    // validate. If confidence is low OR any numeric/unclear issue is
    // found, we retry ONCE with a stricter prompt. The confirmed
    // extraction is then injected into the solve prompt as authoritative
    // ground truth, which dramatically reduces mis-reads.
    // -----------------------------------------------------------------
    let verifiedExtraction: string | null = null;
    if (hasImage) {
      const runExtraction = async (strict: boolean) => {
        const extractionPrompt = `You are an OCR + diagram-reading engine. Look at the image and return ONLY valid JSON (no markdown fences) with this shape:
{
  "problem_text": "the full problem statement transcribed VERBATIM",
  "given_values": [ { "symbol": "F", "value": "10", "unit": "N" } ],
  "figure_description": "geometry/forces/labels if a figure exists, else empty string",
  "unclear_items": [ "list any character/number you could not read confidently" ],
  "confidence": "high" | "medium" | "low"
}
${strict ? `
STRICTER PASS — the previous extraction was flagged as unreliable.
- Zoom mentally into every numeric value and re-read digit by digit.
- For each number, cross-check it against the surrounding units and context.
- If two interpretations are possible, list BOTH in unclear_items with the format "X or Y".
- Do NOT skip any labeled quantity from a diagram.
- confidence must be "high" only if EVERY number and symbol is unambiguous.
` : ""}`;

        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            response_format: { type: "json_object" },
            messages: [{
              role: "user",
              content: [
                { type: "text", text: extractionPrompt },
                { type: "image_url", image_url: { url: imageData } },
              ],
            }],
          }),
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const raw = data.choices?.[0]?.message?.content || "{}";
        try { return JSON.parse(raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim()); }
        catch { return null; }
      };

      const needsRetry = (ex: any): boolean => {
        if (!ex || typeof ex !== "object") return true;
        if (ex.confidence === "low") return true;
        if (Array.isArray(ex.unclear_items) && ex.unclear_items.length > 0) return true;
        const pt = String(ex.problem_text || "").trim();
        if (pt.length < 10) return true;
        // If there's a figure but no givens extracted, likely missed values
        if (ex.figure_description && Array.isArray(ex.given_values) && ex.given_values.length === 0) return true;
        // Detect unbalanced brackets in the transcription
        const opens = (pt.match(/[([{]/g) || []).length;
        const closes = (pt.match(/[)\]}]/g) || []).length;
        if (Math.abs(opens - closes) > 1) return true;
        return false;
      };

      let extraction = await runExtraction(false);
      let retried = false;
      if (needsRetry(extraction)) {
        console.log("[analyze-text] extraction flagged, retrying with stricter prompt", {
          confidence: extraction?.confidence,
          unclear: extraction?.unclear_items?.length,
        });
        const retry = await runExtraction(true);
        if (retry) extraction = retry;
        retried = true;
      }

      if (extraction && extraction.problem_text) {
        const givens = Array.isArray(extraction.given_values) && extraction.given_values.length
          ? extraction.given_values.map((g: any) => `- ${g.symbol || "?"} = ${g.value ?? "?"} ${g.unit || ""}`.trim()).join("\n")
          : "(none extracted)";
        const unclear = Array.isArray(extraction.unclear_items) && extraction.unclear_items.length
          ? `\nAmbiguous items (state assumption made for each): ${extraction.unclear_items.join("; ")}`
          : "";
        verifiedExtraction = `\n\nVERIFIED EXTRACTION FROM IMAGE${retried ? " (post-retry)" : ""} — treat as authoritative ground truth:\nProblem: ${extraction.problem_text}\nGiven values:\n${givens}\nFigure: ${extraction.figure_description || "(no figure)"}${unclear}\n`;
        console.log("[analyze-text] verified extraction ready, confidence:", extraction.confidence);
      }
    }

    const visionPreamble = hasImage ? `

VISION FIRST — the problem is provided as an image. BEFORE solving:
A. Transcribe the exact problem statement verbatim from the image (including all
   numbers, symbols, subscripts, and units). Re-read each numeric value TWICE
   to avoid OCR errors. If a character is unclear, write "unclear" and choose
   the most physically reasonable interpretation, explicitly noting the assumption.
B. If the image contains a figure/diagram, describe its geometry BEFORE solving:
   - list all labeled points, lengths, angles, coordinates
   - list every force with its direction (arrow), magnitude, and point of application
   - list any given constraints (fixed supports, cables, pulleys, contact surfaces)
   Present these as bullet points under a "Given (from figure):" section.
C. Only after A and B, proceed with the step-by-step solution below.
D. Extreme accuracy is required — mis-reading a single number invalidates the whole answer.
` : "";

    const systemPrompt = `Solve this problem step by step.${langInstruction}${visionPreamble}${verifiedExtraction || ""}

INSTRUCTIONS:
1. First line MUST be: "TOPIC: [specific topic, e.g., "BODMAS order of operations", "quadratic equations", "projectile motion"]"
2. Second line MUST be: "SEARCH: [optimal YouTube search query for similar solved problems, e.g., "BODMAS rule solved examples step by step"]"

3. Provide a CLEAN, WELL-FORMATTED solution:

## 📊 Problem
Brief 1-2 line description of the problem.

## 📝 Solution

**Given:** List key values using proper math notation

**Find:** What to calculate

**Step-by-Step Solution:**

Show each step on a SEPARATE line with clear labels:
- Step 1: [Description]
- Step 2: [Description]
- Continue...

**✅ Final Answer:** Use \\boxed{} for the final answer

CRITICAL FORMATTING RULES:
1. ALWAYS use LaTeX for ALL math expressions:
   - Inline math: $expression$
   - Display math: $$expression$$
2. NEVER use plain text operators:
   - Use $\\times$ for multiplication, NOT * or x
   - Use $\\div$ or $\\frac{a}{b}$ for division, NOT /
   - Use $+$ and $-$ within math expressions
3. Each calculation step MUST be on its OWN line
4. Use proper fractions: $\\frac{numerator}{denominator}$
5. NO raw markdown symbols (**, *, _) mixed with math
6. Keep steps simple and verifiable
7. Always simplify fractions and show intermediate results

EXAMPLE for BODMAS/Order of Operations:
TOPIC: BODMAS order of operations
SEARCH: BODMAS rule solved examples step by step tutorial

## 📊 Problem
Evaluate $2 + 5 \\times 2 \\div 6$ using BODMAS rule.

## 📝 Solution

**Given:** Expression $2 + 5 \\times 2 \\div 6$

**Find:** Simplified value using BODMAS

**Step-by-Step Solution:**

Step 1: Apply multiplication first (left to right)
$$5 \\times 2 = 10$$

Step 2: Apply division next
$$10 \\div 6 = \\frac{10}{6} = \\frac{5}{3}$$

Step 3: Apply addition
$$2 + \\frac{5}{3} = \\frac{6}{3} + \\frac{5}{3} = \\frac{11}{3}$$

**✅ Final Answer:** $$\\boxed{\\frac{11}{3} \\approx 3.67}$$
${LATEX_HYGIENE}`;

    // Build message content based on available inputs
    const messageContent: any[] = [{ type: "text", text: systemPrompt }];
    
    if (hasText) {
      messageContent.push({ type: "text", text: `\n\nProblem:\n${text}` });
    }
    
    if (hasImage) {
      messageContent.push({ type: "image_url", image_url: { url: imageData } });
    }

    // Streaming response
    if (stream) {
      console.log("Sending streaming request to Gemini...");
      const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: hasImage ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
          stream: true,
          messages: [
            {
              role: "user",
              content: messageContent
            }
          ],
        }),
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error("Gemini API error:", analysisResponse.status, errorText);
        
        if (analysisResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (analysisResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw new Error(`Gemini API error: ${analysisResponse.status}`);
      }

      // Stream the response directly back to the client
      return new Response(analysisResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Non-streaming response (for video search after streaming completes)
    console.log("Sending image to Gemini 2.5 Pro for analysis...");
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: hasImage ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: messageContent
          }
        ],
      }),
    });

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Gemini API error:", analysisResponse.status, errorText);
      
      if (analysisResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (analysisResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`Gemini API error: ${analysisResponse.status}`);
    }

    const analysisData = await analysisResponse.json();
    const fullResponse = analysisData.choices[0].message.content;
    console.log("Received analysis from Gemini");

    // Extract topic, search query, and solution from response
    const lines = fullResponse.split('\n');
    let topic = "Problem Solution";
    let searchQuery = "";
    let solution = fullResponse;
    
    // Extract TOPIC line
    if (lines[0].startsWith("TOPIC:")) {
      topic = lines[0].replace("TOPIC:", "").trim();
    }
    
    // Extract SEARCH line for better YouTube matching
    const searchLineIndex = lines.findIndex((l: string) => l.startsWith("SEARCH:"));
    if (searchLineIndex !== -1) {
      searchQuery = lines[searchLineIndex].replace("SEARCH:", "").trim();
    }
    
    // Remove TOPIC and SEARCH lines from displayed solution
    solution = lines
      .filter((l: string) => !l.startsWith("TOPIC:") && !l.startsWith("SEARCH:"))
      .join('\n')
      .trim();
    
    // Fallback search query if not provided by AI
    if (!searchQuery) {
      searchQuery = `${topic} solved examples step by step tutorial`;
    }
    
    console.log("Extracted topic:", topic);
    console.log("YouTube search query:", searchQuery);

    console.log("Searching YouTube for exact video solution:", searchQuery);

    const youtubeResponse = await fetchYouTube(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(searchQuery)}&type=video&videoDefinition=high&relevanceLanguage=en&safeSearch=strict&order=relevance`
    );

    if (!youtubeResponse.ok) {
      const errorText = await youtubeResponse.text();
      console.error("YouTube API error:", youtubeResponse.status, errorText);
      throw new Error(`YouTube API error: ${youtubeResponse.status}`);
    }

    const youtubeData = await youtubeResponse.json();
    
    // Filter out YouTube Shorts
    const explanationVideos = (youtubeData.items || [])
      .filter((item: any) => {
        const title = item.snippet.title.toLowerCase();
        const topicWords = topic.toLowerCase().split(' ');
        const matchesTopic = topicWords.some((word: string) => word.length > 3 && title.includes(word));
        // Filter out shorts
        const isShort = title.includes('#shorts') || 
                       title.includes('#short') || 
                       title.includes('| shorts') ||
                       title.includes('(shorts)') ||
                       title.endsWith(' shorts') ||
                       title.includes('youtube shorts');
        return matchesTopic && !isShort;
      })
      .slice(0, 6)
      .map((item: any) => ({
        id: item.id.videoId,
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
      }));

    console.log("Found videos:", explanationVideos.length);

    return new Response(
      JSON.stringify({ 
        topic, 
        animationVideos: [],
        explanationVideos,
        solution,
        description: null,
        isQuestion: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error analyzing:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
