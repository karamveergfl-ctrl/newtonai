/**
 * Parse an SSE (Server-Sent Events) stream and call onChunk for each content delta.
 * Returns the fully accumulated content string.
 */
export async function parseSSEStream(
  response: Response,
  onChunk: (accumulated: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          accumulated += content;
          onChunk(accumulated);
        }
      } catch {
        // Incomplete JSON — push back and wait for more data
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  return accumulated;
}
