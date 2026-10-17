"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { isCancel, isConfirm, type Policy } from "@/lib/policy/schema";

type Phase = "idle" | "working" | "awaiting" | "applying" | "active" | "error";
type Armor = { memberRules: { "*": unknown } };
type Row = { label: string; account_id: string; amount: number; decision: string; detail: string };

const DEMO =
  "Refunds up to $100 are fine. Anything over $100 needs manager approval. Never refund to an account that isn't in the CRM.";

function decisionVariant(decision: string): "default" | "secondary" | "destructive" | "outline" {
  if (decision === "allow") return "default";
  if (decision === "hold") return "secondary";
  if (decision === "block") return "destructive";
  return "outline";
}

export function PolicyBuilder() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [armor, setArmor] = useState<Armor | null>(null);
  const [spoken, setSpoken] = useState("");
  const [notice, setNotice] = useState("No rule yet. Speak one, or type it.");
  const [status, setStatus] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [elevenlabs, setElevenlabs] = useState(false);
  const [listening, setListening] = useState(false);
  const [extraAmount, setExtraAmount] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((body: { elevenlabs?: boolean }) => setElevenlabs(Boolean(body.elevenlabs)))
      .catch(() => setElevenlabs(false));
  }, []);

  async function speak(text: string) {
    if (!elevenlabs) return;
    const res = await fetch("/api/speak", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    await new Audio(url).play().catch(() => undefined);
  }

  async function translate(text: string) {
    setPhase("working");
    setNotice("Turning that into a policy.");
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript: text, current: policy }),
    });
    const body = await res.json();
    if (!res.ok || body.error) {
      setPhase(policy ? "awaiting" : "error");
      setNotice(body.error || "The translator failed.");
      return;
    }
    if (body.clarification) {
      setPhase(policy ? "awaiting" : "idle");
      setNotice(body.clarification);
      await speak(body.clarification);
      return;
    }
    setPolicy(body.policy);
    setArmor(body.armor);
    setSpoken(body.readback);
    setStatus(null);
    setPhase("awaiting");
    setNotice("Read this back. Nothing is applied until you confirm.");
    await speak(body.readback);
  }

  async function onSubmit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (phase === "awaiting" && policy && isConfirm(trimmed)) {
      await onApply();
      return;
    }
    if (phase === "awaiting" && isCancel(trimmed)) {
      await onCancel();
      return;
    }
    await translate(trimmed);
  }

  async function onApply() {
    if (!policy) return;
    setPhase("applying");
    setNotice("Sending the policy to ArmorIQ.");
    const res = await fetch("/api/policy/apply", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ policy }),
    });
    const body = await res.json();
    if (!res.ok) {
      setPhase("awaiting");
      setNotice(body.error || "ArmorIQ did not activate the policy.");
      return;
    }
    setStatus(body.status ?? "unknown");
    setArmor(body.armorBody ?? armor);
    if (String(body.status).toLowerCase() === "active") {
      setPhase("active");
      setNotice("The policy is active. Run the three refunds.");
    } else {
      setPhase("error");
      setNotice(`ArmorIQ saved the policy with status "${body.status}". It is not active, so the refund run stays off.`);
    }
  }

  async function onCancel() {
    await fetch("/api/policy/cancel", { method: "POST" });
    setPolicy(null);
    setArmor(null);
    setSpoken("");
    setStatus(null);
    setPhase("idle");
    setNotice("Cancelled. Nothing was sent to ArmorIQ.");
  }

  async function onRun() {
    setNotice("Asking ArmorIQ for a decision on each refund.");
    const extra = Number(extraAmount);
    const res = await fetch("/api/sandbox/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Number.isFinite(extra) && extra > 0 ? { extraAmount: extra } : {}),
    });
    const body = await res.json();
    setRows(body.rows || []);
    if (!body.ok) {
      setNotice(body.error || "The sandbox did not return decisions.");
      return;
    }
    const sameMoney = (body.rows || []).filter((row: Row) => row.account_id === "acct_maya");
    if (sameMoney.length >= 2 && sameMoney[0].decision === sameMoney[1].decision && sameMoney[0].decision !== "error") {
      setNotice("ArmorIQ returned the same decision for $20 and $500. The allow and block rows are the proof. A hold was not invented.");
      return;
    }
    setNotice("These rows are what ArmorIQ returned.");
  }

  function onMic() {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    if (!elevenlabs) {
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (!Ctor) {
        setNotice("This browser has no speech recognition. Type the rule instead.");
        return;
      }
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setListening(false);
        void onSubmit(text);
      };
      rec.onerror = () => {
        setListening(false);
        setNotice("The microphone did not produce a transcript. Type the rule.");
      };
      rec.onend = () => setListening(false);
      setListening(true);
      rec.start();
      return;
    }
    void recordElevenLabs();
  }

  async function recordElevenLabs() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!stream) {
      setNotice("Microphone permission was denied. Type the rule.");
      return;
    }
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      setListening(false);
      const audio = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      const form = new FormData();
      form.set("audio", audio, "speech.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const body = await res.json();
      if (!res.ok) {
        setNotice(body.error || "Transcription failed.");
        return;
      }
      setTranscript(body.transcript);
      await onSubmit(body.transcript);
    };
    setListening(true);
    recorder.start();
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 8000);
  }

  const busy = phase === "working" || phase === "applying";
  const canRun = phase === "active";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">ArmorIQ Flow State</p>
        <h1 className="text-3xl font-semibold tracking-tight">Voice Policy Builder</h1>
        <p className="max-w-2xl text-muted-foreground">
          Speak a rule. Hear it back. Say confirm. The support agent is then governed by ArmorIQ, not by this page.
        </p>
      </header>

      <p className="rounded-lg border bg-card px-4 py-3 text-sm" role="status">
        {notice}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rule</CardTitle>
            <CardDescription>
              {elevenlabs
                ? "The mic uses ElevenLabs. You can also type."
                : "No ElevenLabs key. The mic uses this browser, and the read-back stays on screen."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder={DEMO}
              disabled={busy}
              rows={5}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={onMic} disabled={busy || listening}>
                {listening ? "Listening\u2026" : "Mic"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => onSubmit(transcript)} disabled={busy || !transcript.trim()}>
                Translate
              </Button>
              <Button type="button" variant="outline" onClick={() => setTranscript(DEMO)} disabled={busy}>
                Use the demo sentence
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Read-back</CardTitle>
            <CardDescription>
              {status ? `ArmorIQ status: ${status}` : "Generated from the validated policy, then spoken."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="min-h-16 text-base">{spoken || "The read-back appears after a rule is translated."}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={onApply} disabled={busy || phase !== "awaiting" || !policy}>
                Confirm
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={busy || !policy}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy that confirm will push</CardTitle>
          <CardDescription>Readable rules, then the ArmorIQ JSON.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ul className="flex flex-col gap-2 text-sm">
            {policy ? (
              policy.rules.map((rule, index) => (
                <li key={index} className="rounded-md border px-3 py-2">
                  <span className="font-medium">{rule.decision}</span> {rule.tool} when {rule.condition.field}{" "}
                  {rule.condition.op} {String(rule.condition.value)}
                  {rule.approver ? ` (${rule.approver})` : ""}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">No policy yet.</li>
            )}
          </ul>
          <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{armor ? JSON.stringify(armor, null, 2) : "{}"}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Refund proof</CardTitle>
          <CardDescription>$20 and $500 on acct_maya, then $20 on acct_unknown. Decisions come from ArmorIQ.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={onRun} disabled={!canRun}>
              Run the three refunds
            </Button>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Extra amount
              <input
                className="h-8 w-24 rounded-md border bg-background px-2"
                inputMode="decimal"
                placeholder="80"
                value={extraAmount}
                onChange={(event) => setExtraAmount(event.target.value)}
              />
            </label>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Decisions appear here after a policy is active and you run the proof.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {rows.map((row) => (
                <li key={`${row.label}-${row.amount}`} className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm md:flex-row md:items-center md:justify-between">
                  <span>
                    {row.label} \u00b7 {row.account_id} \u00b7 ${row.amount}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant={decisionVariant(row.decision)}>{row.decision}</Badge>
                    <span className="text-muted-foreground">{row.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

type SpeechRec = {
  lang: string;
  onresult: (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
};
