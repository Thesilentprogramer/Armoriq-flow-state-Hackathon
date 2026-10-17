import type { Policy, Rule } from "./schema";

function clause(rule: Rule): string {
  const { condition, decision, approver } = rule;
  if (rule.tool === "issue_refund" && condition.field === "amount" && condition.op === "<=" && decision === "allow") {
    return `allow refunds up to $${condition.value}`;
  }
  if (rule.tool === "issue_refund" && condition.field === "amount" && condition.op === ">" && decision === "hold") {
    const who = approver || "manager";
    return `hold refunds over $${condition.value} for ${who} approval`;
  }
  if (rule.tool === "issue_refund" && condition.field === "amount" && condition.op === ">" && decision === "block") {
    return `block refunds over $${condition.value}`;
  }
  if (rule.tool === "issue_refund" && condition.field === "account" && condition.op === "not_in" && decision === "block") {
    return "block refunds to accounts that aren't in the CRM";
  }
  return `${decision} ${rule.tool} when ${condition.field} ${condition.op} ${condition.value}`;
}

export function readback(policy: Policy): string {
  const parts = policy.rules.map(clause);
  if (parts.length === 0) return "I don't have a rule to apply yet.";
  if (parts.length === 1) return `I'll ${parts[0]}. Say confirm to apply.`;
  const last = parts[parts.length - 1];
  return `I'll ${parts.slice(0, -1).join(", ")}, and ${last}. Say confirm to apply.`;
}
