import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Policy } from "./schema";

export type Draft = {
  policy: Policy;
  readback: string;
  policyId: string | null;
};

const file = path.join(process.cwd(), "data", "policy-state.json");

async function read(): Promise<Draft | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as Draft;
  } catch {
    return null;
  }
}

export async function getDraft(): Promise<Draft | null> {
  return read();
}

export async function saveDraft(draft: Draft): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(draft, null, 2));
}

export async function clearPending(policyId: string | null): Promise<void> {
  const current = await read();
  if (!current) return;
  await saveDraft({ ...current, policy: { rules: [] }, readback: "", policyId });
}
