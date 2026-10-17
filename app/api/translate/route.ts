import { compilePolicy } from "@/lib/policy/compile";
import { readback } from "@/lib/policy/readback";
import { validatePolicy, type Policy } from "@/lib/policy/schema";
import { getDraft, saveDraft } from "@/lib/policy/state";
import { translateTranscript } from "@/lib/policy/translate";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { transcript?: string; current?: Policy | null };
  const transcript = body.transcript?.trim() ?? "";
  if (!transcript) return Response.json({ error: "Say a rule first." }, { status: 400 });

  const currentCheck = body.current ? validatePolicy(body.current) : null;
  const current = currentCheck?.ok ? currentCheck.policy : null;
  const result = await translateTranscript(transcript, current);
  if (!result.ok) return Response.json({ clarification: result.question });

  const spoken = readback(result.policy);
  const draft = await getDraft();
  await saveDraft({ policy: result.policy, readback: spoken, policyId: draft?.policyId ?? null });
  const armor = compilePolicy(result.policy, process.env.ARMORIQ_AGENT_ID || "support-agent");
  return Response.json({ policy: result.policy, readback: spoken, armor });
}
