import { getDraft, saveDraft } from "@/lib/policy/state";

export async function POST() {
  const draft = await getDraft();
  await saveDraft({ policy: { rules: [] }, readback: "", policyId: draft?.policyId ?? null });
  return Response.json({ ok: true });
}
