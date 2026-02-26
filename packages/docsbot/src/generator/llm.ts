import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/**
 * Ask Claude to generate or update a section of documentation.
 * Returns the raw markdown string.
 */
export async function generateMarkdown(prompt: string): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
    system: `You are a technical documentation writer. Generate clear, accurate, and concise markdown documentation.
Use proper markdown formatting. Include code examples where helpful. Be factual — only document what is in the source.
Output ONLY the markdown content with no preamble or commentary.`,
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from LLM");
  return block.text;
}

/**
 * Ask Claude to review documentation for accuracy and completeness.
 * Returns a list of issues found, or empty array if docs look good.
 */
export async function reviewDocs(
  sourceCode: string,
  docs: string
): Promise<string[]> {
  const prompt = `Review the following API documentation against the source code for CORRECTNESS.
Focus on: wrong parameter types/names, wrong return types, wrong import syntax (named vs default), and factually incorrect statements.
Do NOT flag missing internal implementation details (e.g. internal state variables, private hooks, UI rendering details) — only flag what is documented INCORRECTLY.
Return ONLY a JSON array of strings (issues). Return [] if everything documented is correct.

SOURCE CODE:
\`\`\`typescript
${sourceCode}
\`\`\`

DOCUMENTATION:
${docs}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    system: `You are a documentation accuracy checker. You MUST respond with ONLY a raw JSON array.
No explanations, no markdown fences, no prose before or after.
Example of a valid response: ["Issue 1", "Issue 2"]
Example of a valid empty response: []`,
  });

  const block = message.content[0];
  if (block.type !== "text") return [];

  const text = block.text.trim();
  // Try parsing directly first
  // Then strip markdown fences, then extract first JSON array found in the text
  const candidates = [
    text,
    text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
    (text.match(/\[[\s\S]*\]/)?.[0] ?? ""),
  ];

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // try next candidate
    }
  }

  return [`LLM review returned non-JSON: ${text.slice(0, 200)}`];
}

/**
 * Generate a caption + description for a UI screenshot.
 */
export async function captionScreenshot(
  scenarioDescription: string,
  screenshotBase64: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: screenshotBase64,
            },
          },
          {
            type: "text",
            text: `This screenshot shows: "${scenarioDescription}". Write a short 1-2 sentence caption for user-facing documentation describing what the user sees and can do here.`,
          },
        ],
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") return scenarioDescription;
  return block.text.trim();
}
