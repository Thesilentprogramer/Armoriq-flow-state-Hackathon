"use client";

import Link from "next/link";
import { useState } from "react";
import { AnatomyWorkflow } from "./anatomy-workflow";
import { Faq } from "./faq";
import { InstallWidget } from "./install-widget";
import { TerminalProof } from "./terminal-proof";
import { TractionFigs } from "./traction-figs";

const FEATURES = [
  { label: "Speech in", desc: "Mic capture with ElevenLabs STT, or the browser when no key is set." },
  { label: "Schema IR", desc: "One low-temperature LLM call constrained to tools, fields, ops, and decisions." },
  { label: "Spoken readback", desc: "A template restates every rule and threshold before anything is applied." },
  { label: "Confirm only", desc: "ArmorIQ sees the policy only after explicit confirm — cancel or silence applies nothing." },
  { label: "ArmorIQ enforce", desc: "Compiled memberRules[*] activate on the support agent; enforcement is not local." },
  { label: "Refund MCP", desc: "lookup_customer, issue_refund, send_email — data plane only, no rule logic." },
  { label: "Allow + block proof", desc: "Three live calls: $20 allow, $500 block/hold, unknown account block." },
  { label: "Human-safe edits", desc: "Spoken revisions replace the IR; confirm again to push. Silence never writes." },
];

const GLYPHS = ["ArmorIQ", "MCP", "ElevenLabs", "Next.js", "Claude", "Flow State"];

export function LandingPage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="landing">
      <header className="border-b border-[var(--lp-rule)]">
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link href="/" className="text-[14px] font-bold no-underline hover:no-underline">
            Voice Policy Builder
          </Link>
          <nav className="hidden items-center gap-5 text-[13px] text-[var(--lp-muted)] md:flex">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <a href="#proof">Proof</a>
            <a href="#faq">FAQ</a>
            <a
              href="https://github.com/Thesilentprogramer/Armoriq-flow-state-Hackathon"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
          <Link href="/builder" className="lp-btn shrink-0">
            Open builder →
          </Link>
        </div>
      </header>

      <section className="lp-prose py-20 md:py-28">
        <h1 className="max-w-[18ch] text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.08] font-bold tracking-tight">
          Speak a rule. Hear it back. Say confirm.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.6] text-[var(--lp-muted)]">
          Finance and support leads know the refund rules. They do not write JSON. Voice Policy Builder turns one
          spoken sentence into a live ArmorIQ policy, then proves it with a sandbox agent.
        </p>
        <InstallWidget />
      </section>

      <TerminalProof />

      <AnatomyWorkflow />

      <section id="features" className="lp-section">
        <div className="lp-prose">
          <h2 className="text-[15px] font-bold">What is Voice Policy Builder?</h2>
          <p className="mt-3 text-[14px] leading-[1.6] text-[var(--lp-muted)]">
            A human-in-the-loop control plane: speak a rule, hear the structured policy, confirm once, and let ArmorIQ
            govern the agent.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="text-[14px] leading-[1.6]">
                <span className="text-[var(--lp-muted)]">[*]</span>{" "}
                <strong className="font-bold">{f.label}.</strong>{" "}
                <span className="text-[var(--lp-muted)]">{f.desc}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link href="/builder" className="lp-btn">
              Open builder →
            </Link>
          </div>
        </div>
      </section>

      <TractionFigs />

      <section className="lp-section">
        <div className="lp-prose">
          <h2 className="text-[15px] font-bold">Nothing applies until you say so</h2>
          <p className="mt-6 max-w-[54ch] text-[14px] leading-[1.6]">
            [*] Policies reach ArmorIQ only after confirm. Cancel or silence sends nothing. Enforcement lives on{" "}
            <a href="https://platform.armoriq.ai" className="underline underline-offset-2" target="_blank" rel="noreferrer">
              ArmorIQ
            </a>
            , not in the refund MCP.
          </p>
        </div>
      </section>

      <Faq />

      <section className="lp-section">
        <div className="lp-prose">
          <h2 className="text-[15px] font-bold">Built for ArmorIQ Flow State</h2>
          <p className="mt-3 max-w-[54ch] text-[14px] leading-[1.6] text-[var(--lp-muted)]">
            The same stack judges expect: real policy create/activate, MCP tools, and a live allow/block log — not a
            mock decision table.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[12px] tracking-wide text-[var(--lp-muted)]">
            {GLYPHS.map((g) => (
              <span key={g} className="border border-[var(--lp-rule)] px-2 py-1 text-[var(--lp-ink)]">
                {g}
              </span>
            ))}
          </div>
          <div className="mt-8">
            <a
              href="https://github.com/Thesilentprogramer/Armoriq-flow-state-Hackathon/blob/main/development.md"
              className="lp-btn lp-btn-ghost"
              target="_blank"
              rel="noreferrer"
            >
              Read development.md →
            </a>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-prose">
          <h2 className="text-[15px] font-bold">Stay on the waitlist</h2>
          <p className="mt-2 text-[14px] text-[var(--lp-muted)]">
            Demo notes and builder updates. Local stub — nothing leaves this browser.
          </p>
          <form
            className="mt-6 flex w-full border border-[var(--lp-rule)]"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              setSubscribed(true);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-[14px] outline-none"
            />
            <button type="submit" className="shrink-0 bg-[var(--lp-black)] px-4 text-[13px] font-medium text-white">
              Subscribe
            </button>
          </form>
          {subscribed ? (
            <p className="mt-2 text-[12px] text-[var(--lp-muted)]">[*] Saved locally. No server call was made.</p>
          ) : null}
        </div>
      </section>

      <footer className="border-t border-[var(--lp-rule)]">
        <div className="mx-auto grid w-full max-w-[1100px] grid-cols-2 border-b border-[var(--lp-rule)] text-[13px] sm:grid-cols-5">
          {[
            {
              href: "https://github.com/Thesilentprogramer/Armoriq-flow-state-Hackathon",
              label: "GitHub [demo]",
            },
            {
              href: "https://github.com/Thesilentprogramer/Armoriq-flow-state-Hackathon/blob/main/prd.md",
              label: "Docs",
            },
            {
              href: "https://github.com/Thesilentprogramer/Armoriq-flow-state-Hackathon/blob/main/development.md",
              label: "Changelog",
            },
            { href: "#faq", label: "Community" },
            { href: "https://platform.armoriq.ai", label: "ArmorIQ" },
          ].map((cell, i) => (
            <a
              key={cell.label}
              href={cell.href}
              className={`px-4 py-4 text-[var(--lp-muted)] no-underline hover:text-[var(--lp-ink)] ${
                i < 4 ? "border-r border-[var(--lp-rule)]" : ""
              }`}
              target={cell.href.startsWith("http") ? "_blank" : undefined}
              rel={cell.href.startsWith("http") ? "noreferrer" : undefined}
            >
              {cell.label}
            </a>
          ))}
        </div>
        <div className="lp-prose flex flex-wrap items-center gap-x-4 gap-y-2 py-4 text-[12px] text-[var(--lp-muted)]">
          <span>© 2026 Voice Policy Builder</span>
          <span>Brand</span>
          <span>Privacy</span>
          <span>Terms</span>
          <label className="ml-auto flex items-center gap-2">
            <span>Lang</span>
            <select className="border border-[var(--lp-rule)] bg-white px-1 py-0.5 text-[12px]" defaultValue="en">
              <option value="en">EN</option>
            </select>
          </label>
        </div>
      </footer>
    </div>
  );
}
