import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import type { Lead, LeadPriority, LeadStatus, LeadTemperature } from "@/lib/lead-manager/types";
import { STATUS_LABEL } from "@/lib/lead-manager/types";

export const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: value >= 100000 ? "compact" : "standard",
  }).format(value ?? 0);

export const num = (value: number) => new Intl.NumberFormat("en-IN").format(value ?? 0);

export const relTime = (iso?: string | null) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (Math.abs(mins) < 60) return mins >= 0 ? `${mins}m ago` : `in ${-mins}m`;
  const hrs = Math.round(mins / 60);
  if (Math.abs(hrs) < 24) return hrs >= 0 ? `${hrs}h ago` : `in ${-hrs}h`;
  const days = Math.round(hrs / 24);
  return days >= 0 ? `${days}d ago` : `in ${-days}d`;
};

export const dateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const maskPhone = (phone: string, unmasked: boolean) =>
  unmasked ? phone : phone.replace(/(\+?\d{2,3})(\d+)(\d{3})/, (_m, a, b, c) => `${a}${"•".repeat(b.length)}${c}`);

export const maskEmail = (email: string, unmasked: boolean) => {
  if (unmasked) return email;
  const [user = "", domain = ""] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(3, user.length - 2))}@${domain}`;
};

export function SectionHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="stat-tile flex size-11 items-center justify-center text-primary">
            <Icon className="size-5" />
          </span>
        ) : null}
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "destructive" | "info";
}) {
  const toneClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
    info: "text-info",
  }[tone];
  return (
    <Card className="gap-0 border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? <Icon className={cn("size-4", toneClass)} /> : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 border-border bg-surface p-0", className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </Card>
  );
}

const statusTone: Record<LeadStatus, string> = {
  new: "bg-info/15 text-info border-info/30",
  contacted: "bg-primary/15 text-primary border-primary/30",
  interested: "bg-chart-5/15 text-chart-5 border-chart-5/30",
  follow_up: "bg-warning/15 text-warning border-warning/30",
  negotiation: "bg-chart-2/15 text-chart-2 border-chart-2/30",
  won: "bg-success/15 text-success border-success/30",
  lost: "bg-destructive/15 text-destructive border-destructive/30",
  spam: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusTone[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

const priorityTone: Record<LeadPriority, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-info/15 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

export function PriorityBadge({ priority }: { priority: LeadPriority }) {
  return (
    <Badge variant="outline" className={cn("capitalize", priorityTone[priority])}>
      {priority}
    </Badge>
  );
}

const tempTone: Record<LeadTemperature, string> = {
  hot: "bg-destructive/15 text-destructive border-destructive/30",
  warm: "bg-warning/15 text-warning border-warning/30",
  cold: "bg-info/15 text-info border-info/30",
};

export function TemperatureBadge({ temperature }: { temperature: LeadTemperature }) {
  return (
    <Badge variant="outline" className={cn("capitalize", tempTone[temperature])}>
      {temperature}
    </Badge>
  );
}

export function ScoreBar({ score, label }: { score: number; label?: string }) {
  const tone = score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="min-w-24">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label ?? "Score"}</span>
        <span className="font-mono font-medium">{score}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-md bg-muted/60" />
      ))}
    </div>
  );
}

export function exportLeadsCsv(leads: Lead[], filename = "leads") {
  const cols = [
    "name",
    "email",
    "phone",
    "company",
    "city",
    "state",
    "country",
    "source",
    "sub_source",
    "campaign",
    "category",
    "industry",
    "status",
    "priority",
    "temperature",
    "ai_score",
    "intent_score",
    "conversion_probability",
    "deal_value",
    "budget_range",
    "requirements",
    "created_at",
    "last_contact_at",
    "next_follow_up",
  ] as const;
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    cols.join(","),
    ...leads.map((l) => cols.map((c) => escape(l[c])).join(",")),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
