import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { qualifyLeadWithAI } from "@/lib/lead-manager/ai-qualify.functions";
import type { QualificationResult } from "@/lib/lead-manager/ai-qualify.server";
import { leadApi } from "@/lib/lead-manager/api";
import type { Lead, LeadCommunication, LeadNote, LeadPriority } from "@/lib/lead-manager/types";
import { PriorityBadge, dateTime } from "./shared";

export function AIQualifyPanel({
  lead,
  notes,
  comms,
  run,
}: {
  lead: Lead;
  notes: LeadNote[];
  comms: LeadCommunication[];
  run: <T>(fn: () => Promise<T>, success: string) => Promise<T | undefined>;
}) {
  const qualify = useServerFn(qualifyLeadWithAI);
  const [notesText, setNotesText] = useState("");
  const [convText, setConvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QualificationResult | null>(null);

  useEffect(() => {
    setNotesText(notes.map((n) => `[${dateTime(n.created_at)}] ${n.content}`).join("\n"));
    setConvText(
      comms
        .map((c) => `[${dateTime(c.created_at)}] ${c.type} (${c.direction}): ${c.content}`)
        .join("\n"),
    );
    setResult(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id, notes.length, comms.length]);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const leadContext = [
        `Name: ${lead.name}`,
        `Company: ${lead.company ?? "unknown"}`,
        `Industry/Category: ${lead.industry} / ${lead.category}`,
        `Location: ${[lead.city, lead.state, lead.country].filter(Boolean).join(", ")}`,
        `Source: ${lead.source} / ${lead.sub_source}`,
        `Budget: ${lead.budget_range ?? "unknown"}`,
        `Deal value (INR): ${lead.deal_value}`,
        `Current stage: ${lead.status}`,
        `Current priority: ${lead.priority}`,
        `Requirements: ${lead.requirements ?? "unknown"}`,
      ].join("\n");
      setResult(await qualify({ data: { leadContext, notes: notesText, conversation: convText } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const apply = () =>
    result &&
    run(async () => {
      await leadApi.updateLead(lead.id, { priority: result.priority as LeadPriority });
      await leadApi.addNote(
        lead.id,
        `AI qualification — ${result.summary}\nPriority: ${result.priority} (${result.priorityReason})\nNext action: ${result.nextAction} — ${result.nextActionTiming}`,
      );
    }, "AI qualification applied");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea rows={5} value={notesText} onChange={(e) => setNotesText(e.target.value)} placeholder="Paste or type notes about this lead…" />
      </div>
      <div className="space-y-1.5">
        <Label>Conversation history</Label>
        <Textarea rows={7} value={convText} onChange={(e) => setConvText(e.target.value)} placeholder="Paste calls, WhatsApp or email exchanges…" />
      </div>
      <Button size="sm" onClick={generate} disabled={loading || (!notesText.trim() && !convText.trim())}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {loading ? "Analysing…" : "Generate AI qualification"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {result ? (
        <div className="space-y-3 rounded-md border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Recommended priority</span>
            <PriorityBadge priority={result.priority} />
          </div>
          <p className="text-xs text-muted-foreground">{result.priorityReason}</p>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Summary</p>
            <p className="mt-1 text-sm">{result.summary}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Next action · {result.nextActionTiming}</p>
            <p className="mt-1 text-sm font-medium">{result.nextAction}</p>
          </div>
          {result.keySignals.length ? (
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
              {result.keySignals.map((s) => <li key={s}>{s}</li>)}
            </ul>
          ) : null}
          <Button size="sm" variant="secondary" onClick={apply}>
            <Check className="size-4" /> Apply priority & save as note
          </Button>
        </div>
      ) : null}
    </div>
  );
}
