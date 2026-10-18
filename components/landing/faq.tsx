"use client";

import { useState } from "react";

const ITEMS = [
  {
    q: "Who is Voice Policy Builder for?",
    a: "Admins who know the rules — finance, support leads, compliance — but do not write JSON. Engineers and hackathon judges use it to see real ArmorIQ enforcement in under 90 seconds.",
  },
  {
    q: "What counts as confirm?",
    a: 'While a draft is waiting: "confirm", "yes confirm", "apply", "yes apply", or the Confirm button. A bare "yes" is not enough. Cancel, stop, silence, or the Cancel button applies nothing.',
  },
  {
    q: "Does the refund MCP enforce the policy?",
    a: "No. The MCP looks up customers and issues refunds. ArmorIQ returns allow, hold, or block after the policy is activated. If the MCP enforced the rule, you could not tell ArmorIQ from a local if.",
  },
  {
    q: "What if ElevenLabs is missing?",
    a: "The browser Speech Recognition API transcribes when available. The readback stays on screen. Spoken TTS still prefers ElevenLabs when a key is set.",
  },
  {
    q: "Hold vs block for the $500 refund?",
    a: "P0 needs one real allow and one real block. Hold for amounts over the threshold is P1. If hold does not fire, the $500 row is a real block and the log says so — a faked hold is not allowed.",
  },
  {
    q: "Which secrets do I need?",
    a: "ArmorIQ email/password or access token plus org id to create and activate policies. The SDK API key is for the sandbox agent only — ArmorIQ ignores it on POST /policies. LLM key for translation; ElevenLabs optional.",
  },
  {
    q: "How do I run it locally?",
    a: "npm install && npm run dev on port 4317. Start the Python sandbox MCP on 4318. Open /builder for the mic UI, or use this landing page to walk the workflow first.",
  },
  {
    q: "Can I edit a live policy by voice?",
    a: 'P1: say "lower the limit to $50." The translator receives the current IR and returns a full replacement. Confirm again to push the update, then re-run an $80 refund.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="lp-section">
      <div className="lp-prose">
        <h2 className="text-[15px] font-bold">FAQ</h2>
        <ul className="mt-8 border-t border-[var(--lp-rule)]">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="border-b border-[var(--lp-rule)]">
                <button
                  type="button"
                  className="flex w-full items-start gap-3 py-4 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="mt-0.5 w-4 shrink-0 text-[14px] text-[var(--lp-muted)]">{isOpen ? "−" : "+"}</span>
                  <span className="text-[14px] font-bold leading-[1.5]">{item.q}</span>
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-4 pl-7 text-[14px] leading-[1.6] text-[var(--lp-muted)]">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
