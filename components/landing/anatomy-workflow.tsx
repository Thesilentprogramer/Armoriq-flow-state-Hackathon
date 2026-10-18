"use client";

import { useEffect, useRef, useState } from "react";
import { VOICE_MACHINE_SVG } from "./voice-machine-svg";

const STAGES = [
  {
    id: "mic",
    title: "Mic horn",
    readout:
      'Admin speaks: "Refunds up to $100 are fine. Anything over $100 needs manager approval. Never refund to an account that isn\'t in the CRM."',
  },
  {
    id: "tumblers",
    title: "Tumbler bank",
    readout: "Three rule pins drop: amount<=100→allow · amount>100→hold/block · account not_in CRM→block.",
  },
  {
    id: "speaker",
    title: "Readback speaker",
    readout:
      "I'll allow refunds up to $100, hold refunds over $100 for manager approval, and block refunds to accounts that aren't in the CRM. Say confirm to apply.",
  },
  {
    id: "key",
    title: "Confirm key",
    readout: "Key turns only on explicit confirm. Cancel or silence leaves the vault empty — nothing reaches ArmorIQ.",
  },
  {
    id: "gate",
    title: "ArmorIQ gate",
    readout: "Compiler writes memberRules[*], activates the policy. Enforcement plane is ArmorIQ, not the MCP.",
  },
  {
    id: "chutes",
    title: "Refund chutes",
    readout: "$20 acct_maya → ALLOW · $500 acct_maya → BLOCK · $20 acct_unknown → BLOCK.",
  },
] as const;

type Tip = { stage: number; x: number; y: number; below: boolean };

export function AnatomyWorkflow() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    const root = host?.querySelector("svg");
    if (!host || !root) return;

    const parts = [...root.querySelectorAll<SVGElement>("[data-stage]")];
    const cleanups: Array<() => void> = [];

    function place(el: SVGElement, stage: number) {
      const hostRect = host!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2 - hostRect.left;
      const topGap = r.top - hostRect.top;
      const below = topGap < 96;
      setTip({
        stage,
        x,
        y: below ? r.bottom - hostRect.top + 8 : Math.max(8, topGap - 8),
        below,
      });
      parts.forEach((node) => node.classList.toggle("is-active", node === el));
      root!.classList.remove("is-all");
    }

    function clear() {
      setTip(null);
      parts.forEach((node) => node.classList.remove("is-active"));
      root!.classList.add("is-all");
    }

    root.classList.add("is-all");

    parts.forEach((el) => {
      const stage = STAGES[Number(el.getAttribute("data-stage"))];
      const onEnter = () => {
        const n = Number(el.getAttribute("data-stage"));
        if (Number.isFinite(n)) place(el, n);
      };
      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("focus", onEnter);
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      if (stage) el.setAttribute("aria-label", stage.title);
      cleanups.push(() => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("focus", onEnter);
      });
    });

    root.addEventListener("pointerleave", clear);
    cleanups.push(() => root.removeEventListener("pointerleave", clear));

    return () => cleanups.forEach((fn) => fn());
  }, []);

  const active = tip ? STAGES[tip.stage] : null;

  return (
    <section id="how-it-works" className="lp-section">
      <div className="lp-prose">
        <h2 className="text-[15px] font-bold">How it is used</h2>
        <p className="mt-3 text-[14px] leading-[1.6] text-[var(--lp-muted)]">
          Built with the{" "}
          <a
            href="https://github.com/wheresryan22/anatomy"
            className="underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Anatomy
          </a>{" "}
          isometric kit: a machine whose working <em className="not-italic text-[var(--lp-ink)]">is</em> the workflow.
          Hover a part to read what it does.
        </p>

        <div className="mt-8 border border-[var(--lp-rule)]">
          <div ref={hostRef} className="relative bg-[#f2f2ef]">
            <div dangerouslySetInnerHTML={{ __html: VOICE_MACHINE_SVG }} />
            {active && tip ? (
              <div
                className={`pointer-events-none absolute z-10 w-[min(280px,calc(100%-1.5rem))] -translate-x-1/2 border border-[#111111] bg-white px-3 py-2 ${
                  tip.below ? "" : "-translate-y-full"
                }`}
                style={{ left: tip.x, top: tip.y }}
                role="tooltip"
              >
                <p className="text-[12px] font-bold text-[#111111]">
                  [{tip.stage + 1}/{STAGES.length}] {active.title}
                </p>
                <p className="mt-1 text-[12px] leading-[1.5] text-[#525252]">{active.readout}</p>
              </div>
            ) : (
              <p className="pointer-events-none absolute right-3 bottom-3 text-[11px] text-[#737373]">
                Hover a part
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 text-[12px] text-[var(--lp-muted)]">
          Fig 0. <strong className="text-[var(--lp-ink)]">Voice Policy machine</strong> — solids from{" "}
          <code className="text-[var(--lp-ink)]">kit/iso-kit.mjs</code>.
        </p>
      </div>
    </section>
  );
}
