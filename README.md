# Voice Policy Builder

Speak a rule. Hear it back. Say "confirm." The agent is now governed.

An admin speaks a refund rule. The app turns it into a structured policy, reads that policy back in plain English, and pushes it to ArmorIQ only after confirm. A sandbox support agent then tries three refunds through a small MCP server, and ArmorIQ allows, holds, or blocks each one.

The product requirements are in [prd.md](prd.md). The architecture, the ArmorIQ request body, and the P0/P1 split are in [development.md](development.md).

## Routes

| Path | What |
| --- | --- |
| `/` | Terminal-native landing page: install widget, session proof, Anatomy isometric workflow machine, FAQ |
| `/builder` | The Voice Policy Builder UI (mic, readback, confirm, three-refund proof) |

The landing “How it is used” figure is built with the [Anatomy](https://github.com/wheresryan22/anatomy) isometric kit (`kit/iso-kit.mjs`). Rebuild it with `npm run build:machine`.

## 90-second demo

1. Open `/builder` (or start from the landing page → Open builder).
2. Speak: "Refunds up to $100 are fine. Anything over $100 needs manager approval. Never refund to an account that isn't in the CRM."
3. Hear the read-back. Say "confirm" or press Confirm.
4. Run the three refunds. $20 on a known account is allowed. The unknown account is blocked. $500 is held when ArmorIQ holds it, and blocked when it does not.
5. Optionally say "lower the limit to $50" and re-run an $80 refund.

Nothing is sent to ArmorIQ until confirm. Cancel, or saying nothing, applies nothing.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app listens on port 4317. Landing: `http://127.0.0.1:4317/`. Builder: `http://127.0.0.1:4317/builder`.

In another terminal, the refund MCP and the support agent:

```bash
python3 -m venv .venv
.venv/bin/pip install -r sandbox/requirements.txt
.venv/bin/python sandbox/mcp_server.py
```

The Next.js app calls the sandbox at `SANDBOX_URL` (default `http://127.0.0.1:4318`).

Check the sandbox tools and the policy compiler without starting the UI:

```bash
.venv/bin/python sandbox/check_mcp.py
npx tsx lib/policy/check.ts
```

## Environment

| Variable | Used for |
| --- | --- |
| `ELEVENLABS_API_KEY` | Speech-to-text and the spoken read-back. Without it, the browser transcribes and the read-back is on screen. |
| `LLM_API_KEY` | Turns the transcript into the policy object. |
| `LLM_MODEL` | Optional. Defaults to `gpt-4o-mini`. |
| `ARMORIQ_EMAIL` and `ARMORIQ_PASSWORD` | `POST /auth/login`. This token creates and activates the policy. |
| `ARMORIQ_ACCESS_TOKEN` | Skips login when you already have a dashboard access token. |
| `ARMORIQ_ORG_ID` | Sent as `x-organization-id`. |
| `ARMORIQ_API_KEY` | The sandbox agent only. ArmorIQ ignores this key on `POST /policies`. |
| `ARMORIQ_AGENT_ID` | Policy target. Defaults to `support-agent`. |
| `ARMORIQ_API_BASE` | Defaults to `https://api.armoriq.ai`. |
| `SANDBOX_URL` | Defaults to `http://127.0.0.1:4318`. |

Create the ArmorIQ account at [platform.armoriq.ai](https://platform.armoriq.ai). The login token and the SDK API key are different credentials. The page shows an error when either one is missing. It does not invent an allow or a block.

## What is enforced where

The refund MCP looks up customers and issues refunds. It does not apply the rule. ArmorIQ does, after confirm activates the policy. The three proof calls are `$20` on `acct_maya`, `$500` on `acct_maya`, and `$20` on `acct_unknown`.
