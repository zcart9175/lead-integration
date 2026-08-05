import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, Search, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { NAV_SECTIONS, SECTION_SCREEN, STAGE_SECTIONS, SOURCE_FILTERS } from "@/lib/lead-manager/nav";
import { useAgents, useLeads } from "@/lib/lead-manager/queries";
import type { Agent, Lead } from "@/lib/lead-manager/types";
import { LeadDetailSheet } from "@/components/lead-manager/LeadDetailSheet";
import { ActionsScreen } from "@/components/lead-manager/screens/ActionsScreen";
import { AlertsScreen } from "@/components/lead-manager/screens/AlertsScreen";
import { AllLeadsScreen } from "@/components/lead-manager/screens/AllLeadsScreen";
import { AutomationScreen } from "@/components/lead-manager/screens/AutomationScreen";
import { CaptureScreen } from "@/components/lead-manager/screens/CaptureScreen";
import { EscalationsScreen } from "@/components/lead-manager/screens/EscalationsScreen";
import { IntegrationsScreen } from "@/components/lead-manager/screens/IntegrationsScreen";
import { OverviewScreen } from "@/components/lead-manager/screens/OverviewScreen";
import { PipelineScreen } from "@/components/lead-manager/screens/PipelineScreen";
import { QualificationScreen } from "@/components/lead-manager/screens/QualificationScreen";
import { ReportsScreen } from "@/components/lead-manager/screens/ReportsScreen";
import { SecurityScreen } from "@/components/lead-manager/screens/SecurityScreen";
import { SettingsScreen } from "@/components/lead-manager/screens/SettingsScreen";
import { SourcesScreen } from "@/components/lead-manager/screens/SourcesScreen";
import { SpamScreen } from "@/components/lead-manager/screens/SpamScreen";
import { TeamScreen } from "@/components/lead-manager/screens/TeamScreen";
import {
  Panel,
  SectionHeader,
  exportLeadsCsv,
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-sidebar-border/80 bg-sidebar/80 backdrop-blur-xl lg:block">
        <div className="sticky top-0 z-10 border-b border-sidebar-border/80 bg-sidebar/90 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="gradient-brand ambient-glow flex size-9 items-center justify-center rounded-xl font-display text-sm font-bold text-primary-foreground">
              SV
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold tracking-tight">
                Software Vala
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="status-dot text-success" /> Lead Manager
              </p>
            </div>
          </div>
        </div>
        <nav className="space-y-5 px-3 py-4">
          {NAV_SECTIONS.map((s) => (
            <div key={s.id}>
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                {s.label}
              </p>
              <div className="space-y-0.5">
                {s.items.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => setSection(item.id)}
                      className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-300 ${
                        section === item.id
                          ? "bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-[var(--elev-1)]"
                          : "text-sidebar-foreground hover:translate-x-0.5 hover:bg-sidebar-accent/70"
                      }`}
                    >
                      <span
                        className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-300 ${
                          section === item.id ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <item.icon className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                      <span className="truncate">{item.label}</span>
                    </button>
                    {item.children && section.startsWith(item.id.split("_")[0] ?? "") ? (
                      <div className="ml-6 space-y-0.5 border-l border-sidebar-border pl-2">
                        {item.children.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSection(c.id)}
                            className={`block w-full truncate rounded px-2 py-1 text-left text-xs transition-all duration-200 hover:translate-x-0.5 ${
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

      <main key={section} className="flex-1 space-y-6 overflow-x-hidden p-6">
        <SectionHeader
          title={sourceFilter?.label ?? titleFor(section)}
          description="Live data from the Software Vala lead database — every action is written back through the API."
          icon={Target}
          actions={
            <>
              <LiveClock />
              <div className="group relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search leads…"
                  className="w-64 border-border/70 bg-surface-2/60 pl-8 backdrop-blur-md transition-all duration-300 focus-visible:w-72"
                />
              </div>
              <Button
                variant="secondary"
                className="lift sheen"
                onClick={() => exportLeadsCsv(visible)}
              >
                Export CSV
              </Button>
            </>
          }
        />

        <Screen
          screen={screen}
          section={section}
          {...(sourceFilter ? { sourceFilter } : {})}
          visible={visible}
          leads={leads}
          agents={agents}
          isLoading={isLoading}
          onSelect={setSelected}
        />
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

function Screen({ screen, section, sourceFilter, visible, leads, agents, isLoading, onSelect }: {
  screen: string; section: string; sourceFilter?: { source?: string; subSource?: string; label: string };
  visible: Lead[]; leads: Lead[]; agents: Agent[];
  isLoading: boolean; onSelect: (lead: Lead) => void;
}) {
  if (screen === "overview") return <OverviewScreen onSelect={onSelect} />;
  if (screen === "allLeads") return <AllLeadsScreen onSelect={onSelect} />;
  if (screen === "sources") return <SourcesScreen section={section} onSelect={onSelect} />;
  if (screen === "capture") return <CaptureScreen onSelect={onSelect} />;
  if (screen === "qualification") return <QualificationScreen section={section} onSelect={onSelect} />;
  if (screen === "spam") return <SpamScreen onSelect={onSelect} />;
  if (screen === "pipeline") return <PipelineScreen section={section} onSelect={onSelect} />;
  if (screen === "actions") return <ActionsScreen section={section} onSelect={onSelect} />;
  if (screen === "automation") return <AutomationScreen onSelect={onSelect} />;
  if (screen === "team") return <TeamScreen />;
  if (screen === "alerts") return <AlertsScreen section={section} onSelect={onSelect} />;
  if (screen === "escalations") return <EscalationsScreen />;
  if (screen === "reports") return <ReportsScreen />;
  if (screen === "integrations") return <IntegrationsScreen />;
  if (screen === "security") return <SecurityScreen />;
  if (screen === "settings") return <SettingsScreen />;
  return <Panel title={`${sourceFilter?.label ?? "Leads"} — ${visible.length}`}><div className="text-sm text-muted-foreground">{isLoading ? "Loading…" : `${leads.length} records loaded across ${agents.length} agents.`}</div></Panel>;
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

/** Executive top-bar widget: live local time, date and timezone. */
function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const tz = now ? Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace("_", " ") : "Local";

  return (
    <div className="premium-surface hidden items-center gap-3 rounded-xl px-3.5 py-2 md:flex">
      <span className="relative z-[3] flex items-center gap-2 text-primary">
        <Clock className="size-4" />
        <span className="num text-sm font-semibold tabular-nums text-foreground">
          {now ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--"}
        </span>
      </span>
      <span className="relative z-[3] border-l border-border/70 pl-3 text-[11px] leading-tight text-muted-foreground">
        <span className="block">
          {now ? now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" }) : "Loading"}
        </span>
        <span className="block">{tz}</span>
      </span>
    </div>
  );
}
