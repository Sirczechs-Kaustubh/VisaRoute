/**
 * OpenRouter AI client — thin wrapper around the OpenAI-compatible API.
 *
 * Uses google/gemini-2.0-flash-001 by default for cost-effectiveness:
 *   ~$0.10 / 1M input tokens, ~$0.40 / 1M output tokens.
 *
 * Set OPENROUTER_API_KEY in .env to enable AI features.
 * When the key is missing, AI features gracefully fall back to template-based generation.
 */

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OpenRouterResponse {
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

/**
 * Returns true if the OpenRouter API key is configured.
 */
export function isAIEnabled(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Call the OpenRouter chat completions API.
 * Throws if the API key is missing or the request fails.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: OpenRouterOptions = {},
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://visaroute.com",
      "X-Title": "VisaRoute",
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (!data.choices?.[0]?.message?.content) {
    throw new Error("OpenRouter returned empty response");
  }

  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}

/**
 * Convenience: generate structured text with a system prompt and user prompt.
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: OpenRouterOptions = {},
): Promise<string> {
  const result = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    options,
  );
  return result.content;
}

/**
 * Vision-enabled chat completion — sends an image alongside a text prompt.
 * Uses the OpenAI multimodal message format supported by OpenRouter.
 * Compatible with gemini-2.0-flash-001, claude-3-haiku, gpt-4o-mini, etc.
 */
export async function chatCompletionWithVision(
  systemPrompt: string,
  userText: string,
  imageBase64: string,
  mimeType: string,
  options: OpenRouterOptions = {},
): Promise<{ content: string; tokensUsed: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://visaroute.com",
      "X-Title": "VisaRoute",
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: "text", text: userText },
          ],
        },
      ],
      temperature: options.temperature ?? 0.1,
      max_tokens: options.maxTokens ?? 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter vision API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (!data.choices?.[0]?.message?.content) {
    throw new Error("OpenRouter returned empty vision response");
  }

  return {
    content: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens ?? 0,
  };
}
