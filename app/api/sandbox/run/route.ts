const PROOF = [
  { account_id: "acct_maya", amount: 20, label: "$20 known account" },
  { account_id: "acct_maya", amount: 500, label: "$500 known account" },
  { account_id: "acct_unknown", amount: 20, label: "unknown account" },
];

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { extraAmount?: number };
  const cases = [...PROOF];
  if (typeof body.extraAmount === "number" && body.extraAmount > 0) {
    cases.push({
      account_id: "acct_maya",
      amount: body.extraAmount,
      label: `$${body.extraAmount} known account`,
    });
  }
  const url = process.env.SANDBOX_URL || "http://127.0.0.1:4318";
  try {
    const res = await fetch(`${url}/run`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cases }),
    });
    const payload = await res.json();
    return Response.json(payload, { status: res.ok ? 200 : 502 });
  } catch {
    return Response.json(
      { ok: false, error: "The refund sandbox is not running. Start it with python3 sandbox/mcp_server.py.", rows: [] },
      { status: 502 },
    );
  }
}
