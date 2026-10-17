export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY?.trim();
  if (!key) {
    return Response.json(
      { error: "ELEVENLABS_API_KEY is not set. Use the browser microphone or type the rule." },
      { status: 400 },
    );
  }
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) return Response.json({ error: "No audio was recorded." }, { status: 400 });

  const outbound = new FormData();
  outbound.set("file", file, file.name || "speech.webm");
  outbound.set("model_id", "scribe_v1");
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": key },
    body: outbound,
  });
  const body = (await res.json().catch(() => ({}))) as { text?: string; detail?: { message?: string } };
  if (!res.ok) {
    return Response.json({ error: body.detail?.message || "Speech-to-text failed." }, { status: 502 });
  }
  return Response.json({ transcript: body.text || "" });
}
