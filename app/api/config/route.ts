export function GET() {
  return Response.json({
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY?.trim()),
    llm: Boolean(process.env.LLM_API_KEY?.trim()),
  });
}
