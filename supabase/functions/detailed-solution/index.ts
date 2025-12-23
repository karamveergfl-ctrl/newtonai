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
    const { imageData, currentSolution, problemText, isSimilarProblem } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating detailed solution...", { isSimilarProblem });

    let systemPrompt: string;

    if (isSimilarProblem && problemText) {
      // Solving a practice problem from scratch
      systemPrompt = `Solve this practice problem step by step:

${problemText}

Provide a COMPREHENSIVE solution with NUMBERED STEPS. Each step must have a clear header.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

## Answer

State the final answer briefly here.

## Explanation

Brief overview of the approach and key concepts involved.

### Step 1: Understanding the Problem

Describe what's given and what we need to find.

- Given values with LaTeX: $v_0 = 20 \\, \\text{m/s}$
- What we need to find

### Step 2: Identify Key Concepts

- List the relevant formulas with LaTeX
- $$F = ma$$
- Explain why they apply

### Step 3: Set Up Equations

Show the equations we'll use:

$$\\sum F_x = 0: P + N_x + f_{sx} = 0$$

$$\\sum F_y = 0: N_y + f_{sy} - W = 0$$

### Step 4: Substitute Values

$$v = 20 \\cos 30°$$

$$v = 20 \\times 0.866$$

$$v = 17.32 \\, \\text{m/s}$$

### Step 5: Solve for Unknown

Continue with calculations...

$$N = \\frac{500}{1.0825} \\approx 461.89 \\, \\text{N}$$

### Step 6: Calculate Final Answer

$$P_{min} = 230.945 - 57.736 = 173.209 \\, \\text{N}$$

### Step 7: Final Answer

$$\\boxed{173.21 \\, \\text{N} \\leq P \\leq 481.13 \\, \\text{N}}$$

CRITICAL RULES:
- Each step MUST start with "### Step N:" format
- Use $...$ for inline math
- Use $$...$$ for display equations (each on its own line)
- Number steps sequentially (Step 1, Step 2, Step 3...)
- Make each step focused on ONE calculation or concept
- Show EVERY algebraic step`;
    } else {
      // Expanding an existing quick solution
      systemPrompt = `You are given a quick solution to a physics/math problem. Expand it into a DETAILED step-by-step solution.

Current quick solution:
${currentSolution}

Provide a COMPREHENSIVE solution with NUMBERED STEPS. Each step must have a clear header.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

## Answer

State the final answer briefly (from the quick solution).

## Explanation

Overview of the problem-solving approach and key physics/math concepts used.

### Step 1: Ideas for Solving the Problem

1. Draw a free body diagram of the system
2. Define coordinate system
3. Identify all forces: weight, applied force, normal force, friction
4. Resolve forces into components
5. Apply equilibrium conditions: $\\sum F_x = 0$ and $\\sum F_y = 0$

### Step 2: Case Analysis (if applicable)

The friction force $f_s$ acts down the incline. The surface makes an angle of $60°$ with the horizontal.

Resolve the normal force $N$ into components:
- Horizontal: $N_x = -N \\sin(30°)$ (acting to the left)
- Vertical: $N_y = N \\cos(30°)$ (acting upwards)

### Step 3: Force Equilibrium Equations

$$\\sum F_x = 0: P + N_x + f_{sx} = 0 \\implies P - N \\sin(30°) - f_s \\cos(60°) = 0$$

$$\\sum F_y = 0: N_y + f_{sy} - W = 0 \\implies N \\cos(30°) - f_s \\sin(60°) - 500 = 0$$

Since the block is about to move up, $f_s = f_{s,max} = \\mu_s N = 0.25N$

### Step 4: Substituting Friction and Solving for N

Substituting $f_s = 0.25N$:

$$P - N \\sin(30°) - 0.25N \\cos(60°) = 0$$

$$N \\cos(30°) - 0.25N \\sin(60°) - 500 = 0$$

From the second equation:

$$N(\\cos(30°) - 0.25 \\sin(60°)) = 500$$

$$N(0.866 - 0.25 \\times 0.866) = 500$$

$$N(0.6495) = 500$$

$$N = \\frac{500}{0.6495} \\approx 769.81 \\, \\text{N}$$

### Step 5: Solving for P_max

Substitute $N$ into the first equation:

$$P_{max} - 769.81 \\times 0.5 - 0.25 \\times 769.81 \\times 0.5 = 0$$

$$P_{max} - 384.905 - 96.226 = 0$$

$$P_{max} = 384.905 + 96.226 = 481.131 \\, \\text{N}$$

### Step 6: Final Answer

$$\\boxed{173.21 \\, \\text{N} \\leq P \\leq 481.13 \\, \\text{N}}$$

CRITICAL RULES:
- Each step MUST start with "### Step N:" format
- Use $...$ for inline math  
- Use $$...$$ for display equations (each on its own line)
- Number steps sequentially (Step 1, Step 2, Step 3...)
- Make each step focused on ONE calculation or concept
- Show EVERY algebraic step with clear substitutions
- Be extremely thorough and educational`;
    }

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
