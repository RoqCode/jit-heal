type ResponsesApiResponse = {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

const getErrorText = (error: unknown) => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ""}`;
  }

  return String(error);
};

const getContextText = (context: unknown) => {
  try {
    return JSON.stringify(context, null, 2);
  } catch {
    return String(context);
  }
};

const validateCodeText = (code: string) => {
  const trimmed = code.trim();

  if (!trimmed) {
    throw new Error("LLM returned an empty fix");
  }

  if (trimmed.includes("```")) {
    throw new Error("LLM fix must not include Markdown fences");
  }

  if (/^\s*(here|sure|okay|explanation|fix|solution)\b/im.test(trimmed)) {
    throw new Error("LLM fix must contain code only");
  }

  if (/^\s*(#|[-*]\s)/m.test(trimmed)) {
    throw new Error("LLM fix must not include Markdown prose");
  }

  if (/\b(export|import|type|interface)\b/.test(trimmed)) {
    throw new Error("LLM fix must be executable JavaScript without module or type syntax");
  }

  if (!/\bfunction\s+heal\s*\(\s*headerValue\s*,\s*config\s*\)/.test(trimmed)) {
    throw new Error("LLM fix must define function heal(headerValue, config)");
  }

  return trimmed;
};

export const LLMHeal = async (error: unknown, context: unknown) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      instructions:
        "You generate just-in-time fixes for runtime errors. Return only raw executable JavaScript code. Define exactly one function named heal with this signature: function heal(headerValue, config). Do not use export, import, TypeScript types, Markdown fences, prose, explanations, headings, or surrounding text. The function must return one of config.available. If the context is insufficient, still return the safest minimal function heal(headerValue, config) implementation you can infer.",
      input: `Error:\n${getErrorText(error)}\n\nContext:\n${getContextText(context)}`,
      reasoning: { effort: "low" },
      store: false,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `LLM request failed: ${response.status} ${await response.text()}`,
    );
  }

  const completion = (await response.json()) as ResponsesApiResponse;

  const code =
    completion.output
      ?.flatMap((item) => item.content ?? [])
      .filter((content) => content.type === "output_text")
      .map((content) => content.text ?? "")
      .join("") ?? "";

  return validateCodeText(code);
};
