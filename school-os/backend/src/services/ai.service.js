import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const hasValidKey = () =>
  process.env.ANTHROPIC_API_KEY &&
  !process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-xxx");

export async function callAI(prompt, maxTokens = 1000) {
  if (!hasValidKey()) return null;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    return response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  } catch {
    return null;
  }
}
