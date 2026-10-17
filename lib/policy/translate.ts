import { validatePolicy, type Policy } from "./schema";

const MODEL = () => process.env.LLM_MODEL || "gpt-4o-mini";

const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "voice_policy",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["clarification", "rules"],
      properties: {
        clarification: { type: ["string", "null"] },
        rules: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["tool", "condition", "decision", "approver"],
            properties: {
              tool: { type: "string" },
              decision: { type: "string" },
              approver: { type: ["string", "null"] },
              condition: {
                type: "object",
                additionalProperties: false,
                required: ["field", "op", "value"],
                properties: {
                  field: { type: "string" },
                  op: { type: "string" },
                  value: { anyOf: [{ type: "string" }, { type: "number" }] },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export async function translateTranscript(
  transcript: string,
  current: Policy | null,
): Promise<{ ok: true; policy: Policy } | { ok: false; question: string }> {
  const key = process.env.LLM_API_KEY?.trim();
  if (!key) {
    return { ok: false, question: "LLM_API_KEY is not set, so this sentence was not turned into a policy." };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL(),
      temperature: 0,
      messages: [
        {
          role: "system",
          content: [
            "Convert an admin's spoken refund rule into a policy object.",
            "Tools: issue_refund, lookup_customer, send_email.",
            "Decisions: allow, hold, block.",
            "Amount conditions use field amount and op <= or >. Account conditions use field account, op not_in, value crm_allowlist.",
            "If the sentence has no tool or no dollar threshold, set rules to [] and put one short question in clarification.",
            "Do not invent a threshold. If a current policy is provided, return the full updated policy, keeping rules the admin did not change.",
            "Use approver manager for a hold, otherwise null.",
          ].join(" "),
        },
        {
          role: "user",
          content: current
            ? `Current policy:\n${JSON.stringify(current)}\n\nNew instruction:\n${transcript}`
            : transcript,
        },
      ],
      response_format: RESPONSE_FORMAT,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };
  if (!res.ok) {
    return { ok: false, question: body.error?.message || "The translator did not answer." };
  }
  const content = body.choices?.[0]?.message?.content;
  if (!content) return { ok: false, question: "The translator returned an empty policy." };

  let parsed: { clarification?: string | null; rules?: unknown };
  try {
    parsed = JSON.parse(content) as { clarification?: string | null; rules?: unknown };
  } catch {
    return { ok: false, question: "The translator returned text that is not a policy." };
  }
  if (parsed.clarification && (!Array.isArray(parsed.rules) || parsed.rules.length === 0)) {
    return { ok: false, question: parsed.clarification };
  }
  const rawRules = Array.isArray(parsed.rules) ? parsed.rules : [];
  const rules = rawRules.map((rule) => {
    if (!rule || typeof rule !== "object") return rule;
    const copy = { ...(rule as Record<string, unknown>) };
    if (copy.approver === null) delete copy.approver;
    return copy;
  });
  const validated = validatePolicy({ rules });
  if (!validated.ok) return validated;
  return { ok: true, policy: validated.policy };
}
