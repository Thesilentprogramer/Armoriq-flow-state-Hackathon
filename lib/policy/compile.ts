import type { Policy } from "./schema";

export const POLICY_NAME = "voice-support-refunds";

export type ArmorBody = {
  name: string;
  description: string;
  targetType: "agent";
  targetId: string;
  defaultEnforcementAction: "block";
  priority: number;
  status: "draft";
  memberRules: {
    "*": {
      allowedTools: string[];
      toolEnforcement: Record<string, "allow" | "hold" | "block">;
      toolConstraints?: { issue_refund: { paramLimits: string[] } };
    };
  };
};

export function compilePolicy(policy: Policy, targetId = "support-agent"): ArmorBody {
  const tools = new Set<string>(["lookup_customer", "send_email"]);
  const toolEnforcement: Record<string, "allow" | "hold" | "block"> = {
    lookup_customer: "allow",
    send_email: "allow",
  };
  const limits: string[] = [];
  const refundDecisions = new Set<"allow" | "hold" | "block">();
  let baseAllow = false;

  for (const rule of policy.rules) {
    tools.add(rule.tool);
    if (rule.tool !== "issue_refund") {
      toolEnforcement[rule.tool] = rule.decision;
      continue;
    }
    refundDecisions.add(rule.decision);
    const { condition } = rule;
    if (condition.field === "amount") {
      limits.push(`amount ${condition.op} ${condition.value}`);
      if (condition.op === "<=" && rule.decision === "allow") baseAllow = true;
    } else if (condition.field === "account" && condition.op === "not_in") {
      limits.push("account in crm_allowlist");
    }
  }

  if (refundDecisions.size === 1) {
    toolEnforcement.issue_refund = [...refundDecisions][0];
  } else if (baseAllow) {
    toolEnforcement.issue_refund = "allow";
  } else if (refundDecisions.has("block")) {
    toolEnforcement.issue_refund = "block";
  }

  const member: ArmorBody["memberRules"]["*"] = {
    allowedTools: [...tools],
    toolEnforcement,
  };
  if (limits.length > 0) {
    member.toolConstraints = { issue_refund: { paramLimits: limits } };
  }

  return {
    name: POLICY_NAME,
    description: "Spoken by the admin and confirmed in Voice Policy Builder.",
    targetType: "agent",
    targetId,
    defaultEnforcementAction: "block",
    priority: 100,
    status: "draft",
    memberRules: { "*": member },
  };
}
