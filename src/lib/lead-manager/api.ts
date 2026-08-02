import { supabase } from "@/integrations/supabase/client";
import type { LeadInsert, LeadStatus, LeadUpdate } from "./types";

/** Records an immutable audit entry for every privileged Lead Manager action. */
export async function writeAudit(entry: {
  lead_id?: string | null;
  action: string;
  action_type?: string;
  details?: string;
  actor?: string;
  actor_role?: string;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("lead_audit_logs").insert({
    lead_id: entry.lead_id ?? null,
    action: entry.action,
    action_type: entry.action_type ?? "read",
    details: entry.details ?? null,
    actor: entry.actor ?? "Lead Manager Console",
    actor_role: entry.actor_role ?? "Admin",
    metadata: (entry.metadata ?? {}) as never,
  });
  if (error) console.error("[audit]", error.message);
}

function unwrap<T>(res: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (res.error) throw new Error(res.error.message);
  return res.data as NonNullable<T>;
}

export const leadApi = {
  async listLeads(filters: {
    status?: string;
    source?: string;
    search?: string;
    limit?: number;
  } = {}) {
    let query = supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(filters.limit ?? 200);

    if (filters.status && filters.status !== "all")
      query = query.eq("status", filters.status as LeadStatus);
    if (filters.source && filters.source !== "all")
      query = query.eq("source", filters.source as never);
    if (filters.search)
      query = query.or(
        `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%,city.ilike.%${filters.search}%`,
      );

    return unwrap(await query);
  },

  async getLead(id: string) {
    return unwrap(await supabase.from("leads").select("*").eq("id", id).single());
  },

  async listAgents() {
    return unwrap(await supabase.from("lead_agents").select("*").order("name"));
  },

  async listSources() {
    return unwrap(await supabase.from("lead_sources").select("*").order("name"));
  },

  async listAlerts() {
    return unwrap(
      await supabase
        .from("lead_alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(150),
    );
  },

  async listFollowUps() {
    return unwrap(
      await supabase
        .from("lead_follow_ups")
        .select("*")
        .order("scheduled_at", { ascending: true })
        .limit(150),
    );
  },

  async listEscalations() {
    return unwrap(
      await supabase
        .from("lead_escalations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150),
    );
  },

  async listRoutingRules() {
    return unwrap(await supabase.from("lead_routing_rules").select("*").order("created_at"));
  },

  async listAutomationRules() {
    return unwrap(await supabase.from("lead_automation_rules").select("*").order("created_at"));
  },

  async listIntegrations() {
    return unwrap(await supabase.from("lead_integrations").select("*").order("created_at"));
  },

  async listIntegrationEvents() {
    return unwrap(
      await supabase
        .from("lead_integration_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30),
    );
  },

  async listSettings() {
    return unwrap(await supabase.from("lead_settings").select("*").order("setting_key"));
  },

  async listAuditLogs() {
    return unwrap(
      await supabase
        .from("lead_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(80),
    );
  },

  async listNotes(leadId: string) {
    return unwrap(
      await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    );
  },

  async listCommunications(leadId: string) {
    return unwrap(
      await supabase
        .from("lead_communications")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    );
  },

  async createLead(payload: LeadInsert) {
    const lead = unwrap(await supabase.from("leads").insert(payload).select().single());
    await writeAudit({
      lead_id: lead.id,
      action: "Lead Created",
      action_type: "create",
      details: `Created ${lead.name} from ${lead.sub_source}`,
    });
    return lead;
  },

  async updateLead(id: string, updates: LeadUpdate, auditAction = "Lead Edited") {
    const lead = unwrap(
      await supabase.from("leads").update(updates).eq("id", id).select().single(),
    );
    await writeAudit({
      lead_id: id,
      action: auditAction,
      action_type: "update",
      details: `Updated fields: ${Object.keys(updates).join(", ")}`,
    });
    return lead;
  },

  async deleteLead(id: string, name: string) {
    if (
      unwrap(await supabase.from("leads").delete().eq("id", id).select("id")).length === 0
    ) {
      throw new Error("Lead could not be deleted");
    }
    await writeAudit({
      action: "Lead Deleted",
      action_type: "delete",
      details: `Deleted lead ${name}`,
    });
  },

  async assignLead(leadId: string, agentId: string, reason = "Manual assignment") {
    const previous = await leadApi.getLead(leadId);
    const lead = unwrap(
      await supabase
        .from("leads")
        .update({ assigned_agent_id: agentId, assigned_at: new Date().toISOString() })
        .eq("id", leadId)
        .select()
        .single(),
    );
    await supabase.from("lead_assignments").insert({
      lead_id: leadId,
      agent_id: agentId,
      previous_agent_id: previous.assigned_agent_id,
      reason,
      auto_assigned: false,
      assignment_score: lead.ai_score,
    });
    await writeAudit({
      lead_id: leadId,
      action: previous.assigned_agent_id ? "Lead Reassigned" : "Lead Assigned",
      action_type: "update",
      details: reason,
    });
    return lead;
  },

  async changeStatus(leadId: string, status: LeadStatus, reason?: string) {
    const updates: LeadUpdate = { status };
    if (status === "won" || status === "lost") updates.closed_at = new Date().toISOString();
    if (status === "lost" && reason) updates.lost_reason = reason;
    if (status === "spam" && reason) updates.spam_reason = reason;
    return leadApi.updateLead(leadId, updates, `Status → ${status}`);
  },

  async logCommunication(payload: {
    lead_id: string;
    type: "call" | "email" | "whatsapp" | "sms" | "meeting" | "note";
    content: string;
    subject?: string;
    direction?: string;
    created_by?: string;
  }) {
    const row = unwrap(
      await supabase
        .from("lead_communications")
        .insert({
          lead_id: payload.lead_id,
          type: payload.type,
          content: payload.content,
          subject: payload.subject ?? null,
          direction: payload.direction ?? "outbound",
          created_by: payload.created_by ?? "Lead Manager Console",
        })
        .select()
        .single(),
    );
    await supabase
      .from("leads")
      .update({ last_contact_at: new Date().toISOString() })
      .eq("id", payload.lead_id);
    await writeAudit({
      lead_id: payload.lead_id,
      action: `${payload.type} logged`,
      action_type: "update",
      details: payload.content,
    });
    return row;
  },

  async addNote(leadId: string, content: string, createdBy = "Lead Manager Console") {
    return unwrap(
      await supabase
        .from("lead_notes")
        .insert({ lead_id: leadId, content, created_by: createdBy })
        .select()
        .single(),
    );
  },

  async scheduleFollowUp(payload: {
    lead_id: string;
    agent_id: string | null;
    scheduled_at: string;
    follow_up_type: string;
    notes?: string;
  }) {
    const row = unwrap(
      await supabase.from("lead_follow_ups").insert(payload).select().single(),
    );
    await supabase
      .from("leads")
      .update({ next_follow_up: payload.scheduled_at, status: "follow_up" })
      .eq("id", payload.lead_id);
    await writeAudit({
      lead_id: payload.lead_id,
      action: "Follow-Up Scheduled",
      action_type: "update",
      details: `${payload.follow_up_type} at ${payload.scheduled_at}`,
    });
    return row;
  },

  async completeFollowUp(id: string, outcome: string) {
    return unwrap(
      await supabase
        .from("lead_follow_ups")
        .update({ is_completed: true, completed_at: new Date().toISOString(), outcome })
        .eq("id", id)
        .select()
        .single(),
    );
  },

  async resolveEscalation(id: string, notes: string) {
    return unwrap(
      await supabase
        .from("lead_escalations")
        .update({ is_resolved: true, resolved_at: new Date().toISOString(), resolution_notes: notes })
        .eq("id", id)
        .select()
        .single(),
    );
  },

  async acknowledgeAlert(id: string) {
    return unwrap(
      await supabase
        .from("lead_alerts")
        .update({ is_active: false, acknowledged_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single(),
    );
  },

  async rescoreLead(leadId: string) {
    const lead = await leadApi.getLead(leadId);
    const budgetWeight =
      lead.budget_range?.includes("10L") ? 25 : lead.budget_range?.includes("6L") ? 18 : 10;
    const sourceWeight = ["referral", "website", "whatsapp"].includes(lead.source) ? 18 : 10;
    const engagementWeight = Math.min(
      25,
      Math.round((lead.intent_score ?? 50) / 4) + (lead.last_contact_at ? 6 : 0),
    );
    const freshness = Math.max(
      0,
      20 -
        Math.floor(
          (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24),
        ),
    );
    const score = Math.max(5, Math.min(99, budgetWeight + sourceWeight + engagementWeight + freshness));
    const probability = Math.max(2, Math.min(97, score - 6));

    await supabase.from("lead_scores").insert({
      lead_id: leadId,
      score_type: "ai_quality",
      score,
      confidence: 82,
      factors: {
        budget: budgetWeight,
        source: sourceWeight,
        engagement: engagementWeight,
        freshness,
      } as never,
    });
    return leadApi.updateLead(
      leadId,
      { ai_score: score, conversion_probability: probability },
      "AI Re-Scored",
    );
  },

  async toggleSetting(key: string, value: boolean) {
    return unwrap(
      await supabase
        .from("lead_settings")
        .update({ value_bool: value })
        .eq("setting_key", key)
        .select()
        .single(),
    );
  },

  async toggleRoutingRule(key: string, value: boolean) {
    return unwrap(
      await supabase
        .from("lead_routing_rules")
        .update({ is_active: value })
        .eq("rule_key", key)
        .select()
        .single(),
    );
  },

  async toggleAutomationRule(key: string, value: boolean) {
    return unwrap(
      await supabase
        .from("lead_automation_rules")
        .update({ is_active: value })
        .eq("rule_key", key)
        .select()
        .single(),
    );
  },

  async toggleIntegration(key: string, value: boolean) {
    return unwrap(
      await supabase
        .from("lead_integrations")
        .update({
          is_enabled: value,
          status: value ? "connected" : "disconnected",
          last_sync_at: value ? new Date().toISOString() : null,
        })
        .eq("integration_key", key)
        .select()
        .single(),
    );
  },

  async toggleSource(id: string, value: boolean) {
    return unwrap(
      await supabase.from("lead_sources").update({ is_active: value }).eq("id", id).select().single(),
    );
  },

  async setAgentStatus(id: string, status: "online" | "busy" | "offline") {
    return unwrap(
      await supabase.from("lead_agents").update({ status }).eq("id", id).select().single(),
    );
  },
};
