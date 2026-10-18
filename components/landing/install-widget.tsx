"use client";

import { useState } from "react";

const TABS = [
  {
    id: "npm",
    label: "npm",
    command: "npm install && npm run dev",
  },
  {
    id: "git",
    label: "git",
    command: "git clone <repo> && cd voice-policy-builder && npm install && npm run dev",
  },
  {
    id: "curl",
    label: "curl",
    command:
      "curl -fsSL https://raw.githubusercontent.com/Thesilentprogramer/Armoriq-flow-state-Hackathon/main/README.md | head -n 40",
  },
] as const;

export function InstallWidget() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("npm");
  const [copied, setCopied] = useState(false);
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(active.command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-10 overflow-hidden rounded-[3px] border border-[var(--lp-rule)]">
      <div className="flex border-b border-[var(--lp-rule)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-[13px] ${
              tab === t.id
                ? "bg-[var(--lp-black)] text-white"
                : "bg-white text-[var(--lp-muted)] hover:text-[var(--lp-ink)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 bg-[#fafafa] px-4 py-3">
        <code className="min-w-0 flex-1 overflow-x-auto text-[13px] text-[var(--lp-ink)] whitespace-nowrap">
          $ {active.command}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 border border-[var(--lp-rule)] bg-white px-2 py-1 text-[12px] text-[var(--lp-ink)]"
          aria-label="Copy install command"
        >
          {copied ? "copied" : "copy"}
        </button>
      </div>
    </div>
  );
}
