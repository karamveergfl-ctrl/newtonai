import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, currentSolution } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating detailed solution...");

    const systemPrompt = `You are given a quick solution to a physics/math problem. Expand it into a DETAILED step-by-step solution.

Current quick solution:
${currentSolution}

Now provide a COMPREHENSIVE solution with:

## 📊 Complete Figure Analysis
- Describe every element in the diagram
- Explain what each symbol, arrow, angle represents
- Identify the coordinate system and reference points

## 📚 Theory & Concepts
- What physics/math principles apply here?
- Write out the key formulas with explanations
- Why do these formulas work for this problem?

## 📝 Detailed Step-by-Step Solution

**Given:** List ALL values with proper LaTeX notation
$$v_0 = 20 \\, \\text{m/s}$$

**Find:** What exactly needs to be calculated

### Step 1: Set Up the Problem
- Explain the approach
- Draw free body diagram description if needed
- Identify known and unknown quantities

### Step 2: Apply Relevant Equations
$$\\text{Show each formula}$$
Explain why this formula is appropriate

### Step 3: Substitute Values
$$v = 20 \\cos 30° = 20 \\times 0.866 = 17.32 \\, \\text{m/s}$$
Show EVERY calculation step

### Step 4: Solve & Simplify
Show all algebraic steps
$$\\text{Final calculation here}$$

[Continue with more steps as needed]

---

## ✅ Final Answer
$$\\boxed{x = 35.3 \\, \\text{m}}$$

## 💡 Key Takeaways
- What concept was tested?
- Common mistakes to avoid
- When to use this approach

FORMATTING RULES:
- Use $...$ for inline math
- Use $$...$$ for display equations
- Use \\boxed{} for final answers
- Be extremely thorough and educational`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          {
            role: "user",
            content: imageData ? [
              { type: "text", text: systemPrompt },
              { type: "image_url", image_url: { url: imageData } }
            ] : systemPrompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", response.status, errorText);
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: unknown) {
    console.error("Error in detailed-solution:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
