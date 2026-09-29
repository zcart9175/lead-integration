import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export type QualificationResult = {
  summary: string;
  priority: "critical" | "high" | "medium" | "low";
  priorityReason: string;
  nextAction: string;
  nextActionTiming: string;
  keySignals: string[];
};

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

export async function runQualification(input: {
  leadContext: string;
  notes: string;
  conversation: string;
}): Promise<QualificationResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured for this app.");

  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set(RUN_ID_HEADER, runId);
      const res = await fetch(url, { ...init, headers });
      runId ??= res.headers.get(RUN_ID_HEADER) ?? undefined;
      if (res.status === 402) throw new Error("AI credits are exhausted. Add credits to continue.");
      if (res.status === 429) throw new Error("AI is busy right now. Please try again in a minute.");
      if (res.status === 403) throw new Error("AI access is blocked for this workspace.");
      return res;
    },
  });

  const system = `You are a senior B2B sales qualification analyst for Software Vala, an Indian software company.
Analyse the lead and reply with ONLY a JSON object, no markdown, with keys:
"summary" (3-5 sentence qualification summary: need, budget, authority, timeline, fit),
"priority" (one of: critical, high, medium, low),
"priorityReason" (one sentence),
"nextAction" (one concrete, specific next step for the sales rep),
"nextActionTiming" (short, e.g. "Within 2 hours", "Tomorrow morning"),
"keySignals" (array of at most 5 short buying or risk signals).
Base everything strictly on the provided information; if something is unknown, say so.`;

  const prompt = `LEAD PROFILE:\n${input.leadContext}\n\nNOTES:\n${input.notes || "(none)"}\n\nCONVERSATION HISTORY:\n${input.conversation || "(none)"}`;

  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system,
    prompt,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  let text: string;
  try {
    text = await result.text;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "AI request failed");
  }
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI returned an unreadable response.");
  const raw = JSON.parse(match[0]) as Record<string, unknown>;
  const priority = PRIORITIES.includes(raw.priority as never)
    ? (raw.priority as QualificationResult["priority"])
    : "medium";
  return {
    summary: String(raw.summary ?? ""),
    priority,
    priorityReason: String(raw.priorityReason ?? ""),
    nextAction: String(raw.nextAction ?? ""),
    nextActionTiming: String(raw.nextActionTiming ?? ""),
    keySignals: Array.isArray(raw.keySignals) ? raw.keySignals.slice(0, 5).map(String) : [],
  };
}
