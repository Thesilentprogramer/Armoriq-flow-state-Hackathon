# PRD: Voice Policy Builder

**Event:** Flow State 2026 (ArmorIQ) | **Deadline:** Oct 17, 2026 | **Format:** Online hackathon
**Track fit:** Human-in-the-loop (hold and approve), with a Trust and proof angle
**Status:** Draft v1 | **Owner:** _your name_

---

## 1. Summary

Voice Policy Builder lets a non-technical admin govern an AI agent by speaking. The admin says a rule such as "refunds over $100 need manager approval." The tool turns it into a structured ArmorIQ policy, reads it back in plain English, and applies it only after the admin says "confirm." A sandbox support agent then runs real actions against that policy, and ArmorIQ allows, holds or blocks each one.

**One-line pitch:** Speak a rule. Hear it back. Say "confirm." The agent is now governed.

## 2. Problem

- Agent guardrails are written as JSON or config by engineers.
- The people who know the rules (finance, support leads, compliance) cannot write them.
- As a result, rules stay informal ("be careful with refunds") and are never enforced.
- Typed or spoken rules that are applied without a readback risk being misunderstood, which is dangerous for a security control.

## 3. Goals and non-goals

### Goals
1. Convert a spoken rule into a valid ArmorIQ policy with no manual editing.
2. Make misinterpretation unlikely through a spoken readback and explicit confirmation.
3. Prove the policy works with real ArmorIQ enforcement: at least one action allowed and one blocked (a hold is a stretch goal).
4. Meet every hackathon submission requirement (section 9).

### Non-goals
- A full policy management product (versioning, roles, multi-tenant).
- Supporting every ArmorIQ policy feature. Refund-style rules (amount thresholds, allowlists) are enough.
- Real payments or real customer data. Sandbox only.
- Replacing ArmorIQ with ElevenLabs or any custom enforcement (forbidden by rule 2).

## 4. Users

| User | Need |
|---|---|
| **Admin / manager** (primary) | Set and change agent rules in plain language, without code |
| **Approver** (secondary, stretch) | Approve or reject held actions |
| **Judge** (evaluation audience) | See real enforcement quickly in 90 seconds |

## 5. User story and demo flow

> As an admin, I speak a rule, hear it read back, confirm it, and watch my support agent obey it.

**Demo script (90 seconds):**

| Time | Step |
|---|---|
| 0:00-0:20 | Admin speaks: "Refunds up to $100 are fine. Anything over $100 needs manager approval. Never refund to an account that isn't in the CRM." |
| 0:20-0:40 | Tool shows the parsed policy and speaks the readback. Admin says "confirm." Policy is pushed to ArmorIQ. |
| 0:40-1:20 | Support agent attempts three refunds: **$20** (allowed), **$500** (held, or blocked if holds are not working), **unknown account** (blocked). ArmorIQ dashboard trace shown for each. |
| 1:20-1:30 | Admin says "lower the limit to $50." New policy applies. Re-run the $80 refund to show the change. |

## 6. Functional requirements

### P0 (must ship)
| ID | Requirement |
|---|---|
| F1 | Capture admin speech and transcribe it (ElevenLabs speech-to-text, or browser fallback). |
| F2 | An LLM converts the transcript into a policy object validated against a fixed schema (tool, condition, threshold, decision). Invalid output is rejected. |
| F3 | Display the parsed policy as readable text and JSON. |
| F4 | Speak a plain-English readback (ElevenLabs text-to-speech) that restates every rule, including thresholds. |
| F5 | Apply the policy to ArmorIQ only after an explicit "confirm" (voice or button). Cancel or silence applies nothing. |
| F6 | A sandbox support agent with an MCP server exposing `lookup_customer`, `issue_refund` and `send_email`. |
| F7 | The agent's calls go through ArmorIQ, which enforces the applied policy. Show one real allow and one real block. |
| F8 | A live log of each agent action with its ArmorIQ decision. |

### P1 (should ship)
| ID | Requirement |
|---|---|
| F9 | Hold and approve for the $500 refund, with a manager approving by voice or button. |
| F10 | Spoken policy edits ("lower the limit to $50") that update the existing policy. |
| F11 | Link or screenshot of the matching ArmorIQ dashboard trace beside each log entry. |

### P2 (only if time remains)
- Read-aloud of the full current policy on request.
- Policy diff before confirming an edit.
- Multiple agents or tool types.

## 7. Architecture

```
Admin (mic) ──> STT ──> LLM policy translator ──> Schema validation
                                                      │
                                      Readback (TTS) <┘
                                                      │ "confirm"
                                                      v
                                              ArmorIQ policy
                                                      │
Support agent ──> ArmorIQ enforcement ──> Refund MCP server (sandbox)
       │                  │
       └──────────────────┴──> Live action log + dashboard trace
```

**Components**
- **Web UI:** mic button, transcript, parsed policy, readback, confirm/cancel, live action log.
- **Policy translator:** LLM with a strict JSON schema and a few-shot prompt. Temperature low.
- **Support agent:** any framework or plain Python with an LLM API. Takes a task, chooses tools.
- **Refund MCP server:** 3 tools backed by an in-memory or SQLite sandbox with fake customers and a CRM allowlist.
- **ArmorIQ:** keys and onboarding from platform.armoriq.ai. All agent tool calls pass through it.

### Policy schema (draft)
```json
{
  "rules": [
    {
      "tool": "issue_refund",
      "condition": { "field": "amount", "op": "<=", "value": 100 },
      "decision": "allow"
    },
    {
      "tool": "issue_refund",
      "condition": { "field": "amount", "op": ">", "value": 100 },
      "decision": "hold",
      "approver": "manager"
    },
    {
      "tool": "issue_refund",
      "condition": { "field": "account", "op": "not_in", "value": "crm_allowlist" },
      "decision": "block"
    }
  ]
}
```
This is the intermediate format. Mapping it to ArmorIQ's real policy format is the first technical task (section 11).

## 8. Safety and trust requirements

- **No silent application.** Nothing reaches ArmorIQ without confirmation.
- **Readback must be generated from the validated policy object**, not from the LLM's free text, so the spoken words match what is applied.
- **Ambiguity handling:** if the transcript is missing a threshold or tool, ask a clarifying question instead of guessing.
- **Real enforcement only (rule 8).** The agent must not check the policy itself. No hardcoded allow/block results.
- **Sandbox only (rule 7).** Fake customers and fake payments.

## 9. Hackathon compliance checklist

**Must-haves**
- [ ] AI agent (support agent) working end to end
- [ ] At least one MCP server (refund MCP) with real actions
- [ ] ArmorIQ integration: one real allowed action
- [ ] ArmorIQ integration: one real blocked action
- [ ] Agent and MCP server onboarded on platform.armoriq.ai, API keys generated there
- [ ] Core development done within Oct 10-17; any pre-existing code disclosed

**Submission deliverables**
- [ ] GitHub repo with code, README and setup instructions
- [ ] Demo video, 90 seconds or less
- [ ] Short description: what was built, how the agent works, how ArmorIQ is used, other tools used
- [ ] Proof of ArmorIQ blocking an action (screenshot, dashboard trace, or live demo)

**Rules to keep in mind:** ElevenLabs is optional and cannot replace ArmorIQ (rule 2). No attacks on ArmorIQ infrastructure or other participants (rule 9).

## 10. Success criteria

| Level | Definition |
|---|---|
| **Minimum (eligible)** | A spoken rule becomes a real ArmorIQ policy; $20 refund allowed, unknown-account refund blocked, with dashboard proof |
| **Target** | Above, plus the $500 refund held and approved, and a spoken policy edit that changes behavior |
| **Stretch** | Clarifying questions on ambiguous rules, and a policy diff before confirm |

## 11. Risks and open questions

| # | Risk / question | Mitigation |
|---|---|---|
| 1 | **Unknown:** can ArmorIQ policies be created or updated through an API, or only in the dashboard? | Check the docs and the SDK in the first 30 minutes. If dashboard-only, pivot to the Voice Prompt-Injection Gauntlet. |
| 2 | ArmorIQ's real policy format may differ from the draft schema | Build the translator output to match the real format once known; keep the draft as an intermediate layer |
| 3 | Hold and approve was reported as fiddly by other teams, including that self-approval is refused | Treat holds as P1. The allow/block demo satisfies the minimum without it. |
| 4 | Platform "Add AI agent" form reportedly fails | Use the SDK with the API key and target the MCP server in the policy |
| 5 | Speech mis-transcription changes a number | Readback plus confirm; show the numeric values on screen as well |
| 6 | LLM outputs an invalid or unsafe policy | Strict schema validation; reject and re-ask |
| 7 | Time: this is a same-day build | Cut to P0 only; skip multi-agent and edits if blocked |

## 12. Build plan (same day)

| Block | Work |
|---|---|
| Hour 0-0.5 | Read ArmorIQ docs; confirm policy API; generate keys; onboard agent and MCP server |
| Hour 0.5-2 | Refund MCP server and support agent running without ArmorIQ |
| Hour 2-4 | Route agent through ArmorIQ; get one allow and one block working with a hand-written policy |
| Hour 4-6 | Policy translator (LLM + schema) and mapping to ArmorIQ format |
| Hour 6-8 | Voice in and out, confirm flow, web UI and live log |
| Hour 8-10 | Hold/approve (if working) and spoken edit; capture dashboard proof |
| Final 2 hours | README, short description, record 90-second demo, submit with buffer |

If the first 30 minutes show that policies cannot be applied programmatically, stop and switch to the fallback idea rather than continuing.

## 13. Tech stack

- **Voice:** ElevenLabs (speech-to-text and text-to-speech)
- **LLM:** any current model with structured output (confirm free-tier availability)
- **Agent:** Python, plain or any framework
- **MCP server:** Python or Node, with SQLite or in-memory sandbox data
- **Governance:** ArmorIQ SDK and platform
- **UI:** simple web app (React or plain HTML)

## 14. Submission copy (draft)

**Short description:** Voice Policy Builder lets non-technical admins create agent guardrails by speaking. A spoken rule is converted to a structured policy, read back for confirmation, and applied to ArmorIQ. A sandbox support agent then runs refunds through an MCP server, and ArmorIQ allows, holds or blocks each action under the admin's rule. ElevenLabs provides speech in and out; ArmorIQ provides all enforcement.

_Fill in the specifics, the actual framework and the models used, and disclose any pre-existing code before submitting._
