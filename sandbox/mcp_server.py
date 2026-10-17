"""Refund MCP plus the proof runner. Policy is not enforced here."""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from agent import run_cases
from tools import TOOLS, issue_refund, lookup_customer, send_email

PORT = 4318

TOOL_SPECS = [
    {
        "name": "lookup_customer",
        "description": "Look up a customer in the sandbox CRM.",
        "inputSchema": {
            "type": "object",
            "properties": {"account_id": {"type": "string"}, "email": {"type": "string"}},
        },
    },
    {
        "name": "issue_refund",
        "description": "Issue a refund. This tool does not apply the policy.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "account_id": {"type": "string"},
                "amount": {"type": "number"},
                "currency": {"type": "string"},
                "reason": {"type": "string"},
            },
            "required": ["account_id", "amount"],
        },
    },
    {
        "name": "send_email",
        "description": "Send an email to a customer.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "account_id": {"type": "string"},
                "subject": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["account_id", "subject", "body"],
        },
    },
]


def call_tool(name: str, arguments: dict) -> dict:
    fn = TOOLS.get(name)
    if not fn:
        raise ValueError(f"Unknown tool: {name}")
    return fn(**arguments)


def handle_rpc(message: dict) -> dict:
    method = message.get("method")
    msg_id = message.get("id")
    if method == "initialize":
        result = {"protocolVersion": "2024-11-05", "capabilities": {"tools": {}}, "serverInfo": {"name": "refund-mcp", "version": "0.1.0"}}
    elif method == "tools/list":
        result = {"tools": TOOL_SPECS}
    elif method == "tools/call":
        params = message.get("params") or {}
        try:
            payload = call_tool(params.get("name"), params.get("arguments") or {})
            result = {"content": [{"type": "text", "text": json.dumps(payload)}], "isError": False}
        except Exception as exc:
            result = {"content": [{"type": "text", "text": str(exc)}], "isError": True}
    elif method == "ping":
        result = {}
    else:
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32601, "message": f"Unknown method: {method}"}}
    return {"jsonrpc": "2.0", "id": msg_id, "result": result}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send(200, {"ok": True, "tools": list(TOOLS)})
            return
        self._send(404, {"error": "not found"})

    def do_POST(self) -> None:
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            message = json.loads(raw.decode() or "{}")
        except json.JSONDecodeError:
            self._send(400, {"error": "invalid json"})
            return
        if self.path == "/mcp":
            self._send(200, handle_rpc(message))
            return
        if self.path == "/run":
            cases = message.get("cases")
            self._send(200, run_cases(cases))
            return
        if self.path == "/tools/call":
            try:
                self._send(200, {"ok": True, "result": call_tool(message.get("name"), message.get("arguments") or {})})
            except Exception as exc:
                self._send(400, {"ok": False, "error": str(exc)})
            return
        self._send(404, {"error": "not found"})

    def log_message(self, fmt: str, *args) -> None:
        return


if __name__ == "__main__":
    # Imported so a cold read of this file still shows the tool surface.
    assert lookup_customer and issue_refund and send_email
    print(f"refund mcp on http://127.0.0.1:{PORT}")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
