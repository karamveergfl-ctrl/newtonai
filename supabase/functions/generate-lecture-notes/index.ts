import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { transcription } = await req.json();

    if (!transcription) {
      throw new Error("No transcription provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log("Generating lecture notes from transcription...");

    const systemPrompt = `You are an expert academic note-taker and study guide creator. Your task is to transform lecture transcriptions into comprehensive, well-organized study notes.

Create study notes that include:

1. **Title**: Generate a descriptive title for the lecture topic

2. **Key Concepts**: List the main concepts covered with clear definitions

3. **Detailed Notes**: Organize the content into logical sections with:
   - Clear headings and subheadings
   - Bullet points for key information
   - Important terms highlighted in **bold**
   - Formulas or equations in LaTeX format when applicable

4. **Summary**: A concise summary of the main takeaways

5. **Study Questions**: 3-5 questions to test understanding

Format the notes using proper markdown with clear hierarchy. Make the notes scannable and easy to review.`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please create comprehensive study notes from this lecture transcription:\n\n${transcription}` },
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
