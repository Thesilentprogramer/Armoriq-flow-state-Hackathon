"""Three refund calls through the ArmorIQ SDK. No local allow/block table."""

from __future__ import annotations

import os

PROOF = [
    {"account_id": "acct_maya", "amount": 20, "label": "$20 known account"},
    {"account_id": "acct_maya", "amount": 500, "label": "$500 known account"},
    {"account_id": "acct_unknown", "amount": 20, "label": "unknown account"},
]


def _decision_from_exception(exc: BaseException) -> str | None:
    name = type(exc).__name__.lower()
    if "hold" in name:
        return "hold"
    if "block" in name or "denied" in name or "forbid" in name:
        return "block"
    return None


def run_cases(cases: list[dict] | None = None) -> dict:
    rows_in = cases or PROOF
    key = os.environ.get("ARMORIQ_API_KEY", "").strip()
    if not key:
        return {
            "ok": False,
            "error": "ARMORIQ_API_KEY is not set. These rows are ArmorIQ decisions, so nothing was invented.",
            "rows": [],
        }
    try:
        from armoriq_sdk import ArmorIQClient
    except ImportError:
        return {
            "ok": False,
            "error": "armoriq_sdk is not installed. Install the ArmorIQ Python SDK, then run the three refunds again.",
            "rows": [],
        }

    agent_id = os.environ.get("ARMORIQ_AGENT_ID", "support-agent")
    client = ArmorIQClient(
        api_key=key,
        user_id=os.environ.get("ARMORIQ_USER_ID", "service-account"),
        agent_id=agent_id,
    )
    mcp_id = os.environ.get("ARMORIQ_MCP_ID", "refund-mcp")
    rows = []
    for case in rows_in:
        params = {
            "account_id": case["account_id"],
            "amount": case["amount"],
            "currency": "USD",
            "reason": "voice policy proof",
        }
        try:
            result = client.invoke_with_policy(
                mcp=mcp_id,
                action="issue_refund",
                params=params,
            )
            rows.append(
                {
                    "label": case.get("label") or f"${case['amount']} {case['account_id']}",
                    "account_id": case["account_id"],
                    "amount": case["amount"],
                    "decision": "allow",
                    "detail": str(result),
                }
            )
        except Exception as exc:  # SDK raises PolicyBlockedException / PolicyHoldException
            decision = _decision_from_exception(exc) or "error"
            rows.append(
                {
                    "label": case.get("label") or f"${case['amount']} {case['account_id']}",
                    "account_id": case["account_id"],
                    "amount": case["amount"],
                    "decision": decision,
                    "detail": f"{type(exc).__name__}: {exc}",
                }
            )
    return {"ok": True, "rows": rows}
