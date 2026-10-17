"""Fails if the refund tools stop doing what the demo needs."""

from tools import issue_refund, lookup_customer, send_email

maya = lookup_customer(account_id="acct_maya")
assert maya["known"] is True and maya["name"] == "Maya Chen"

unknown = lookup_customer(account_id="acct_unknown")
assert unknown["known"] is False

refund = issue_refund(account_id="acct_unknown", amount=20, currency="USD", reason="demo")
assert refund["status"] == "issued" and refund["amount"] == 20

mail = send_email(account_id="acct_maya", subject="Refund update", body="We issued it.")
assert mail["message_id"].startswith("msg_")

print("mcp checks ok")
