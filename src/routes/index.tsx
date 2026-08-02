import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Search, Target, TrendingUp, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { NAV_SECTIONS, SECTION_SCREEN, STAGE_SECTIONS, SOURCE_FILTERS } from "@/lib/lead-manager/nav";
import { useAgents, useLeads } from "@/lib/lead-manager/queries";
import type { Lead, LeadStatus } from "@/lib/lead-manager/types";
import { PIPELINE_STAGES } from "@/lib/lead-manager/types";
import { LeadDetailSheet } from "@/components/lead-manager/LeadDetailSheet";
import {
  EmptyState,
  LoadingRows,
  Panel,
  PriorityBadge,
  ScoreBar,
  SectionHeader,
  StatCard,
  StatusBadge,
  exportLeadsCsv,
  inr,
  num,
  relTime,
} from "@/components/lead-manager/shared";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lead Manager — Software Vala" },
      {
        name: "description",
        content:
          "Software Vala Lead Manager: capture, route, qualify and convert leads across website, SEO, ads, social and marketplace sources.",
      },
      { property: "og:title", content: "Lead Manager — Software Vala" },
      {
        property: "og:description",
        content:
          "Real-time lead pipeline, AI scoring, routing rules, agent performance and conversion analytics.",
      },
    ],
  }),
  component: LeadManagerPage,
});

function LeadManagerPage() {
  const [section, setSection] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);

  const screen = SECTION_SCREEN[section] ?? "overview";
  const stage = STAGE_SECTIONS[section];
  const sourceFilter = SOURCE_FILTERS[section];

  const { data: leads = [], isLoading } = useLeads({ search });
  const { data: agents = [] } = useAgents();

  const visible = useMemo(() => {
    let rows = leads;
    if (stage) rows = rows.filter((l) => l.status === stage);
    if (sourceFilter?.source) rows = rows.filter((l) => l.source === sourceFilter.source);
    if (sourceFilter?.subSource)
      rows = rows.filter((l) => l.sub_source === sourceFilter.subSource);
    if (screen === "spam") rows = rows.filter((l) => l.status === "spam");
    return rows;
  }, [leads, stage, sourceFilter, screen]);

  const stats = useMemo(() => {
    const won = leads.filter((l) => l.status === "won");
    return {
      total: leads.length,
      hot: leads.filter((l) => l.temperature === "hot").length,
      won: won.length,
      value: won.reduce((s, l) => s + (l.deal_value ?? 0), 0),
      conversion: leads.length ? Math.round((won.length / leads.length) * 100) : 0,
    };
  }, [leads]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar lg:block">
        <div className="border-b border-sidebar-border px-5 py-4">
          <p className="font-display text-lg font-semibold">Software Vala</p>
          <p className="text-xs text-muted-foreground">Lead Manager</p>
        </div>
        <nav className="space-y-5 px-3 py-4">
          {NAV_SECTIONS.map((s) => (
            <div key={s.id}>
              <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <div className="space-y-0.5">
                {s.items.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => setSection(item.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                        section === item.id
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                    {item.children && section.startsWith(item.id.split("_")[0] ?? "") ? (
                      <div className="ml-6 space-y-0.5 border-l border-sidebar-border pl-2">
                        {item.children.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSection(c.id)}
                            className={`block w-full truncate rounded px-2 py-1 text-left text-xs ${
                              section === c.id
                                ? "text-sidebar-primary-foreground bg-sidebar-accent"
                                : "text-muted-foreground hover:text-sidebar-foreground"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 space-y-6 overflow-x-hidden p-6">
        <SectionHeader
          title={sourceFilter?.label ?? titleFor(section)}
          description="Live data from the Software Vala lead database — every action is written back through the API."
          icon={Target}
          actions={
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads…"
                  className="w-64 pl-8"
                />
              </div>
              <Button variant="secondary" onClick={() => exportLeadsCsv(visible)}>
                Export CSV
              </Button>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total leads" value={num(stats.total)} icon={Target} />
          <StatCard label="Hot leads" value={num(stats.hot)} icon={TrendingUp} tone="destructive" />
          <StatCard label="Won" value={num(stats.won)} icon={UserCheck} tone="success" />
          <StatCard label="Won value" value={inr(stats.value)} icon={Activity} tone="success" />
          <StatCard label="Conversion" value={`${stats.conversion}%`} icon={TrendingUp} tone="info" />
        </div>

        <div className="grid gap-4 lg:grid-cols-7">
          {PIPELINE_STAGES.map((s) => {
            const count = leads.filter((l) => l.status === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setSection(`stage_${s.id === "follow_up" ? "followup" : s.id}`)}
                className="stat-tile p-3 text-left transition-colors hover:bg-primary/15"
              >
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-semibold">{count}</p>
              </button>
            );
          })}
        </div>

        <Panel
          title={`${visible.length} leads`}
          description="Click a row to open the full lead workspace: activity, assignment, follow-ups and conversion."
        >
          {isLoading ? (
            <LoadingRows rows={8} />
          ) : visible.length === 0 ? (
            <EmptyState title="No leads match this view" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lead</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>AI score</TableHead>
                    <TableHead className="text-right">Deal value</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(lead)}
                    >
                      <TableCell>
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.company ?? lead.email} • {lead.city}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{lead.sub_source}</TableCell>
                      <TableCell>
                        <StatusBadge status={lead.status as LeadStatus} />
                      </TableCell>
                      <TableCell>
                        <PriorityBadge priority={lead.priority} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {agents.find((a) => a.id === lead.assigned_agent_id)?.name ?? "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <ScoreBar score={lead.ai_score} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {inr(lead.deal_value)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {relTime(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
      </main>

      <LeadDetailSheet
        lead={selected}
        open={!!selected}
        onOpenChange={(o) => !o && setSelected(null)}
      />
      <Toaster position="top-right" />
    </div>
  );
}

function titleFor(section: string) {
  for (const s of NAV_SECTIONS) {
    for (const item of s.items) {
      if (item.id === section) return item.label;
      const child = item.children?.find((c) => c.id === section);
      if (child) return child.label;
    }
  }
  return "Lead Dashboard";
}
