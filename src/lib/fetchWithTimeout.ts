/**
 * Fetch wrapper with timeout, abort controller cleanup, and retry logic.
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = 15000, ...fetchInit } = init || {};

  const controller = new AbortController();
  const existingSignal = fetchInit.signal;

  // If caller already provided an AbortSignal, chain it
  if (existingSignal) {
    existingSignal.addEventListener("abort", () => controller.abort(existingSignal.reason));
  }

  const timeoutId = setTimeout(() => controller.abort("Request timed out"), timeoutMs);

  try {
    const response = await fetch(input, { ...fetchInit, signal: controller.signal });
    return response;
  } catch (err: any) {
    if (err?.name === "AbortError" || err === "Request timed out") {
      throw new Error("Request timed out after " + (timeoutMs / 1000) + "s. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retry a function with exponential backoff.
 * @param fn - async function to retry
 * @param retries - number of retries (default 3)
 * @param baseDelay - base delay in ms (default 1000)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, baseDelay * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError;
}
