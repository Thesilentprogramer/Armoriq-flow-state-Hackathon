import { compilePolicy, type ArmorBody } from "./compile";
import type { Policy } from "./schema";

function baseUrl(): string {
  return process.env.ARMORIQ_API_BASE || "https://api.armoriq.ai";
}

function authHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
  if (process.env.ARMORIQ_ORG_ID) headers["x-organization-id"] = process.env.ARMORIQ_ORG_ID;
  return headers;
}

async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}));
  const message = (body as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (message) return JSON.stringify(message);
  return `ArmorIQ returned ${res.status}`;
}

export async function accessToken(): Promise<string> {
  const existing = process.env.ARMORIQ_ACCESS_TOKEN?.trim();
  if (existing) return existing;
  const email = process.env.ARMORIQ_EMAIL;
  const password = process.env.ARMORIQ_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "Set ARMORIQ_ACCESS_TOKEN, or ARMORIQ_EMAIL and ARMORIQ_PASSWORD. The SDK API key cannot create a policy.",
    );
  }
  const res = await fetch(`${baseUrl()}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { data?: { accessToken?: string }; accessToken?: string };
  const token = body.data?.accessToken || body.accessToken;
  if (!token) throw new Error("ArmorIQ login did not return an access token.");
  return token;
}

export async function pushPolicy(
  policy: Policy,
  existingId?: string | null,
): Promise<{ policyId: string; status: string; armorBody: ArmorBody }> {
  const token = await accessToken();
  const armorBody = compilePolicy(policy, process.env.ARMORIQ_AGENT_ID || "support-agent");
  const url = existingId ? `${baseUrl()}/policies/${existingId}` : `${baseUrl()}/policies`;
  const saved = await fetch(url, {
    method: existingId ? "PUT" : "POST",
    headers: authHeaders(token),
    body: JSON.stringify(armorBody),
  });
  const created = (await saved.json().catch(() => ({}))) as {
    data?: { policyId?: string; status?: string };
    policyId?: string;
    message?: unknown;
  };
  if (!saved.ok) {
    const message = created.message;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message || created));
  }
  const policyId = created.data?.policyId || created.policyId || existingId;
  if (!policyId) throw new Error("ArmorIQ did not return a policy id.");

  const activated = await fetch(`${baseUrl()}/policies/${policyId}/activate`, {
    method: "POST",
    headers: authHeaders(token),
  });
  const activeBody = (await activated.json().catch(() => ({}))) as {
    data?: { status?: string };
    status?: string;
    message?: unknown;
  };
  if (!activated.ok) {
    const message = activeBody.message;
    throw new Error(
      typeof message === "string"
        ? `Saved, but not activated: ${message}`
        : "The policy was saved but not activated.",
    );
  }
  return {
    policyId,
    status: activeBody.data?.status || activeBody.status || "active",
    armorBody,
  };
}
