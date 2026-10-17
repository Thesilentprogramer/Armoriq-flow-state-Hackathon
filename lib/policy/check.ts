import assert from "node:assert/strict";
import { compilePolicy } from "./compile";
import { readback } from "./readback";
import { validatePolicy } from "./schema";

const fixture = {
  rules: [
    { tool: "issue_refund", condition: { field: "amount", op: "<=", value: 100 }, decision: "allow" },
    {
      tool: "issue_refund",
      condition: { field: "amount", op: ">", value: 100 },
      decision: "hold",
      approver: "manager",
    },
    {
      tool: "issue_refund",
      condition: { field: "account", op: "not_in", value: "crm_allowlist" },
      decision: "block",
    },
  ],
};

const parsed = validatePolicy(fixture);
assert.equal(parsed.ok, true);
if (!parsed.ok) throw new Error("fixture");

const body = compilePolicy(parsed.policy, "support-agent");
assert.ok(body.memberRules["*"]);
assert.ok(body.memberRules["*"].allowedTools.includes("issue_refund"));
assert.deepEqual(body.memberRules["*"].toolConstraints?.issue_refund.paramLimits, [
  "amount <= 100",
  "amount > 100",
  "account in crm_allowlist",
]);

const spoken = readback(parsed.policy);
assert.match(spoken, /\$100/);
assert.match(spoken, /confirm/i);

const missing = validatePolicy({
  rules: [
    {
      tool: "issue_refund",
      condition: { field: "account", op: "not_in", value: "crm_allowlist" },
      decision: "block",
    },
  ],
});
assert.equal(missing.ok, false);

const invented = validatePolicy({
  rules: [{ tool: "wire_money", condition: { field: "amount", op: "<=", value: 1 }, decision: "allow" }],
});
assert.equal(invented.ok, false);

console.log("policy checks ok");
