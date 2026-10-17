import { pushPolicy } from "@/lib/policy/armor";
import { readback } from "@/lib/policy/readback";
import { validatePolicy } from "@/lib/policy/schema";
import { getDraft, saveDraft } from "@/lib/policy/state";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { policy?: unknown };
  const parsed = validatePolicy(body.policy);
  if (!parsed.ok) return Response.json({ error: parsed.question }, { status: 400 });

  const draft = await getDraft();
  try {
    const result = await pushPolicy(parsed.policy, draft?.policyId);
    await saveDraft({
      policy: parsed.policy,
      readback: readback(parsed.policy),
      policyId: result.policyId,
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "ArmorIQ did not accept the policy.";
    return Response.json({ error: message }, { status: 502 });
  }
}
