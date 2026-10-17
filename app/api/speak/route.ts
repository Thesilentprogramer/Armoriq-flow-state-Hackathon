export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) return Response.json({ error: "ELEVENLABS_API_KEY is not set." }, { status: 400 });
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) return Response.json({ error: "Nothing to speak." }, { status: 400 });

  const voice = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: "eleven_flash_v2_5" }),
  });
  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: detail.slice(0, 300) || "Read-back audio failed." }, { status: 502 });
  }
  const audio = await res.arrayBuffer();
  return new Response(audio, { headers: { "content-type": "audio/mpeg" } });
}
