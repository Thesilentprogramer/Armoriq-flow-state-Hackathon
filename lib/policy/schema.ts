export const TOOLS = ["issue_refund", "lookup_customer", "send_email"] as const;
export const DECISIONS = ["allow", "hold", "block"] as const;

export type Decision = (typeof DECISIONS)[number];
export type Condition = {
  field: "amount" | "account";
  op: "<=" | ">" | "not_in";
  value: number | string;
};
export type Rule = {
  tool: (typeof TOOLS)[number];
  condition: Condition;
  decision: Decision;
  approver?: string;
};
export type Policy = { rules: Rule[] };

const CONFIRM = new Set(["confirm", "yes confirm", "apply", "yes apply"]);
const CANCEL = new Set(["cancel", "no", "stop"]);

export function normalizeUtterance(text: string): string {
  return text.trim().toLowerCase().replace(/[.!?,]+$/g, "").replace(/\s+/g, " ");
}

export function isConfirm(text: string): boolean {
  return CONFIRM.has(normalizeUtterance(text));
}

export function isCancel(text: string): boolean {
  return CANCEL.has(normalizeUtterance(text));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, allowed: string[]): string | null {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) return key;
  }
  return null;
}

export function validatePolicy(input: unknown): { ok: true; policy: Policy } | { ok: false; question: string } {
  if (!isRecord(input)) return { ok: false, question: "Which tool should this rule govern?" };
  const extra = exact(input, ["rules"]);
  if (extra) return { ok: false, question: `I can't apply a policy that includes "${extra}". Say the rule again with a tool, a limit, and allow, hold, or block.` };
  if (!Array.isArray(input.rules) || input.rules.length === 0) {
    return { ok: false, question: "Which tool should this rule govern, and what is the limit?" };
  }

  const rules: Rule[] = [];
  for (const raw of input.rules) {
    if (!isRecord(raw)) return { ok: false, question: "I couldn't read one of the rules. Say it again as a tool, a condition, and a decision." };
    const ruleExtra = exact(raw, ["tool", "condition", "decision", "approver"]);
    if (ruleExtra) return { ok: false, question: `I won't apply a rule that includes "${ruleExtra}".` };
    if (typeof raw.tool !== "string" || !TOOLS.includes(raw.tool as (typeof TOOLS)[number])) {
      return { ok: false, question: "Which tool should this rule govern? I can govern issue_refund, lookup_customer, or send_email." };
    }
    if (typeof raw.decision !== "string" || !DECISIONS.includes(raw.decision as Decision)) {
      return { ok: false, question: "Should that be allow, hold, or block?" };
    }
    if (!isRecord(raw.condition)) return { ok: false, question: "What is the condition? I need a field, an operator, and a value." };
    const condExtra = exact(raw.condition, ["field", "op", "value"]);
    if (condExtra) return { ok: false, question: `I won't apply a condition that includes "${condExtra}".` };
    const field = raw.condition.field;
    const op = raw.condition.op;
    const value = raw.condition.value;
    if (field === "amount" && (op === "<=" || op === ">") && (typeof value === "number" || (typeof value === "string" && value !== "" && !Number.isNaN(Number(value))))) {
      rules.push({
        tool: raw.tool as Rule["tool"],
        condition: { field: "amount", op, value: typeof value === "number" ? value : Number(value) },
        decision: raw.decision as Decision,
        ...(typeof raw.approver === "string" && raw.approver ? { approver: raw.approver } : {}),
      });
      continue;
    }
    if (field === "account" && op === "not_in" && typeof value === "string" && value.length > 0) {
      rules.push({
        tool: raw.tool as Rule["tool"],
        condition: { field: "account", op: "not_in", value },
        decision: raw.decision as Decision,
        ...(typeof raw.approver === "string" && raw.approver ? { approver: raw.approver } : {}),
      });
      continue;
    }
    return { ok: false, question: "I can apply an amount limit (<= or >) or an account that is not in the CRM allowlist. Which one did you mean?" };
  }

  const refunds = rules.filter((rule) => rule.tool === "issue_refund");
  if (refunds.length > 0 && !refunds.some((rule) => rule.condition.field === "amount")) {
    return { ok: false, question: "What dollar amount should the refund limit be?" };
  }
  return { ok: true, policy: { rules } };
}
