"""Sandbox refund tools. They do not enforce policy. ArmorIQ does."""

from __future__ import annotations

import uuid

CUSTOMERS = {
    "acct_maya": {
        "account_id": "acct_maya",
        "name": "Maya Chen",
        "email": "maya@example.com",
        "known": True,
    }
}


def lookup_customer(account_id: str | None = None, email: str | None = None) -> dict:
    if email:
        for row in CUSTOMERS.values():
            if row["email"] == email:
                return dict(row)
        return {"account_id": None, "name": None, "email": email, "known": False}
    row = CUSTOMERS.get(account_id or "")
    if row:
        return dict(row)
    return {"account_id": account_id, "name": None, "email": None, "known": False}


def issue_refund(account_id: str, amount: float, currency: str = "USD", reason: str = "") -> dict:
    # Any account that reaches this function is refunded. A block has to come from ArmorIQ.
    return {
        "refund_id": "rf_" + uuid.uuid4().hex[:8],
        "status": "issued",
        "account_id": account_id,
        "amount": amount,
        "currency": currency,
        "reason": reason,
    }


def send_email(account_id: str, subject: str, body: str) -> dict:
    return {
        "message_id": "msg_" + uuid.uuid4().hex[:8],
        "account_id": account_id,
        "subject": subject,
        "body": body,
    }


TOOLS = {
    "lookup_customer": lookup_customer,
    "issue_refund": issue_refund,
    "send_email": send_email,
}
