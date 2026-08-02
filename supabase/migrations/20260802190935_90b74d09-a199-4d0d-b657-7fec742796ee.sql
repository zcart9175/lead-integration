
CREATE TYPE public.lead_source_type AS ENUM ('website','seo','social','ads','marketplace','referral','manual','api','whatsapp');
CREATE TYPE public.lead_status_type AS ENUM ('new','contacted','interested','follow_up','negotiation','won','lost','spam');
CREATE TYPE public.lead_priority AS ENUM ('critical','high','medium','low');
CREATE TYPE public.lead_temperature AS ENUM ('hot','warm','cold');
CREATE TYPE public.lead_industry AS ENUM ('retail','healthcare','finance','education','real_estate','manufacturing','hospitality','logistics','technology','other');
CREATE TYPE public.agent_status AS ENUM ('online','busy','offline');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.lead_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'Agent',
  team TEXT NOT NULL DEFAULT 'Software Team',
  status public.agent_status NOT NULL DEFAULT 'offline',
  capacity INTEGER NOT NULL DEFAULT 25,
  conversion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_response_minutes INTEGER NOT NULL DEFAULT 30,
  can_export BOOLEAN NOT NULL DEFAULT false,
  can_unmask BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type public.lead_source_type NOT NULL,
  sub_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  company TEXT,
  industry public.lead_industry NOT NULL DEFAULT 'other',
  source public.lead_source_type NOT NULL DEFAULT 'website',
  sub_source TEXT NOT NULL DEFAULT 'Contact Forms',
  campaign TEXT,
  category TEXT NOT NULL DEFAULT 'enterprise_client',
  status public.lead_status_type NOT NULL DEFAULT 'new',
  priority public.lead_priority NOT NULL DEFAULT 'medium',
  temperature public.lead_temperature NOT NULL DEFAULT 'warm',
  country TEXT NOT NULL DEFAULT 'India',
  state TEXT,
  city TEXT,
  requirements TEXT,
  budget_range TEXT,
  deal_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  ai_score INTEGER NOT NULL DEFAULT 50,
  intent_score INTEGER NOT NULL DEFAULT 50,
  conversion_probability NUMERIC(5,2) NOT NULL DEFAULT 50,
  duplicate_score INTEGER NOT NULL DEFAULT 0,
  fraud_score INTEGER NOT NULL DEFAULT 0,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  duplicate_of UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  spam_reason TEXT,
  lost_reason TEXT,
  assigned_agent_id UUID REFERENCES public.lead_agents(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  next_follow_up TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  language TEXT NOT NULL DEFAULT 'English',
  device TEXT NOT NULL DEFAULT 'Mobile',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_source ON public.leads(source);
CREATE INDEX idx_leads_agent ON public.leads(assigned_agent_id);
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'System',
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound',
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  duration_seconds INTEGER,
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.lead_agents(id) ON DELETE SET NULL,
  previous_agent_id UUID REFERENCES public.lead_agents(id) ON DELETE SET NULL,
  reason TEXT,
  auto_assigned BOOLEAN NOT NULL DEFAULT true,
  assignment_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.lead_agents(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  follow_up_type TEXT NOT NULL DEFAULT 'call',
  notes TEXT,
  suggested_message TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  outcome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  escalated_from UUID REFERENCES public.lead_agents(id) ON DELETE SET NULL,
  escalated_to UUID REFERENCES public.lead_agents(id) ON DELETE SET NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  idle_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  score_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  confidence NUMERIC(5,2) NOT NULL DEFAULT 80,
  factors JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_version TEXT NOT NULL DEFAULT 'lm-scoring-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  strategy TEXT NOT NULL DEFAULT 'round_robin',
  target_team TEXT NOT NULL DEFAULT 'All Teams',
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_routing_updated BEFORE UPDATE ON public.lead_routing_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  trigger_event TEXT NOT NULL DEFAULT 'lead_created',
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 90,
  is_active BOOLEAN NOT NULL DEFAULT true,
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_automation_updated BEFORE UPDATE ON public.lead_automation_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  integration_key TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'crm',
  status TEXT NOT NULL DEFAULT 'disconnected',
  endpoint_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  events_today INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_integrations_updated BEFORE UPDATE ON public.lead_integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_key TEXT NOT NULL,
  event TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lead_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  setting_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  value_bool BOOLEAN,
  value_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.lead_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.lead_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'read',
  details TEXT,
  actor TEXT NOT NULL DEFAULT 'System',
  actor_role TEXT NOT NULL DEFAULT 'System',
  ip_address TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_agents, public.lead_sources, public.leads, public.lead_notes, public.lead_communications, public.lead_assignments, public.lead_follow_ups, public.lead_escalations, public.lead_alerts, public.lead_scores, public.lead_routing_rules, public.lead_automation_rules, public.lead_integrations, public.lead_integration_events, public.lead_settings, public.lead_audit_logs TO anon, authenticated;
GRANT ALL ON public.lead_agents, public.lead_sources, public.leads, public.lead_notes, public.lead_communications, public.lead_assignments, public.lead_follow_ups, public.lead_escalations, public.lead_alerts, public.lead_scores, public.lead_routing_rules, public.lead_automation_rules, public.lead_integrations, public.lead_integration_events, public.lead_settings, public.lead_audit_logs TO service_role;

ALTER TABLE public.lead_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open_agents" ON public.lead_agents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_sources" ON public.lead_sources FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_leads" ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_notes" ON public.lead_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_comms" ON public.lead_communications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_assignments" ON public.lead_assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_followups" ON public.lead_follow_ups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_escalations" ON public.lead_escalations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_alerts" ON public.lead_alerts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_scores" ON public.lead_scores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_routing" ON public.lead_routing_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_automation" ON public.lead_automation_rules FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_integrations" ON public.lead_integrations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_integration_events" ON public.lead_integration_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_settings" ON public.lead_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open_audit" ON public.lead_audit_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ SEED DATA ============
INSERT INTO public.lead_agents (name, email, phone, role, team, status, capacity, conversion_rate, avg_response_minutes, can_export, can_unmask) VALUES
('Rahul Sharma','rahul.sharma@softwarevala.in','+91 98200 41122','Team Lead','Premium Team','online',40,32.40,6,true,true),
('Priya Patel','priya.patel@softwarevala.in','+91 98200 41133','Senior Agent','Software Team','online',35,28.60,9,true,true),
('Amit Kumar','amit.kumar@softwarevala.in','+91 98200 41144','Agent','Software Team','busy',30,24.10,14,false,false),
('Sneha Gupta','sneha.gupta@softwarevala.in','+91 98200 41155','Agent','Geo Teams','online',30,26.70,11,false,false),
('Vikram Singh','vikram.singh@softwarevala.in','+91 98200 41166','Senior Agent','Product Teams','busy',35,30.20,8,true,false),
('Anita Desai','anita.desai@softwarevala.in','+91 98200 41177','Manager','Premium Team','online',25,34.60,5,true,true),
('Raj Malhotra','raj.malhotra@softwarevala.in','+91 98200 41188','Agent','Backup Pool','offline',25,21.50,21,false,false),
('Neha Verma','neha.verma@softwarevala.in','+91 98200 41199','Agent','Geo Teams','online',30,25.40,12,false,false);

INSERT INTO public.lead_sources (name, slug, type, sub_sources, campaign, utm_source, utm_medium, is_active) VALUES
('Website Leads','website_leads','website','["Contact Forms","Landing Pages","Chat Widget","Exit Intent Forms"]','Always-on Web','softwarevala.in','organic',true),
('SEO Leads','seo_leads','seo','["Organic Search","Keyword-Based Leads","Location-Based SEO"]','Local SEO 2026','google','organic',true),
('Social Media Leads','social_leads','social','["Facebook Leads","Instagram Leads","LinkedIn Leads","Twitter / X Leads"]','Social Always-on','meta','social',true),
('Ads Leads','ads_leads','ads','["Google Ads","Facebook Ads","Instagram Ads","YouTube Ads"]','Q1 Performance','google_ads','cpc',true),
('Marketplace Leads','marketplace_leads','marketplace','["Justdial","IndiaMart","TradeIndia"]','Marketplace Sync','marketplace','listing',true),
('Referral Leads','referral_leads','referral','["Partner Referral","Client Referral"]','Referral Program','partner','referral',true),
('Manual Entry','manual_entry','manual','["Admin Entry","Sales Entry","CSV Upload","Excel Import"]',NULL,'internal','manual',true),
('API Leads','api_leads','api','["Partner API","Franchise API","External CRM Sync"]','Partner Network','api','webhook',true),
('WhatsApp Leads','whatsapp_leads','whatsapp','["Click-to-WhatsApp","WhatsApp Forms","Chat Leads"]','WhatsApp Business','whatsapp','chat',true);

-- 120 realistic leads
INSERT INTO public.leads (name,email,phone,company,industry,source,sub_source,campaign,category,status,priority,temperature,country,state,city,requirements,budget_range,deal_value,ai_score,intent_score,conversion_probability,duplicate_score,fraud_score,is_duplicate,spam_reason,lost_reason,assigned_agent_id,assigned_at,last_contact_at,next_follow_up,closed_at,language,device,ip_address,created_at)
SELECT
  fn || ' ' || ln,
  lower(replace(fn,' ','')) || '.' || lower(ln) || i || '@' || dom,
  '+91 9' || lpad(((i*7919) % 900000000 + 100000000)::text, 9, '0'),
  comp,
  ind::public.lead_industry,
  src::public.lead_source_type,
  sub,
  camp,
  cat,
  st::public.lead_status_type,
  pri::public.lead_priority,
  temp::public.lead_temperature,
  'India', state, city,
  req, budget,
  CASE WHEN st IN ('won','negotiation','interested') THEN (120000 + (i*8837)%880000)::numeric ELSE (60000 + (i*4409)%540000)::numeric END,
  score, (score + (i%13) - 6), (score - 8 + (i%17))::numeric,
  CASE WHEN i % 17 = 0 THEN 78 ELSE (i%23) END,
  CASE WHEN st = 'spam' THEN 82 + (i%15) ELSE (i%11) END,
  (i % 17 = 0),
  CASE WHEN st = 'spam' THEN (ARRAY['Disposable email domain','Invalid phone pattern','Bot form submission','Repeated identical payload'])[1 + (i % 4)] END,
  CASE WHEN st = 'lost' THEN (ARRAY['Budget Constraints','Competitor Chosen','No Response','Timeline Mismatch','Other'])[1 + (i % 5)] END,
  NULL, NULL,
  now() - ((i % 40) || ' hours')::interval,
  CASE WHEN st IN ('contacted','interested','follow_up','negotiation') THEN now() + ((1 + i % 6) || ' days')::interval END,
  CASE WHEN st IN ('won','lost') THEN now() - ((i % 20) || ' days')::interval END,
  (ARRAY['English','Hindi','Marathi','Gujarati'])[1 + (i % 4)],
  (ARRAY['Mobile','Desktop','Tablet'])[1 + (i % 3)],
  '103.' || (10 + i%200) || '.' || (i%250) || '.' || (1 + i%99),
  now() - ((i * 5) || ' hours')::interval
FROM (
  SELECT i,
    (ARRAY['Rahul','Priya','Amit','Sneha','Vikram','Anita','Raj','Neha','Suresh','Kavita','Manish','Ravi','Pooja','Arjun','Meera','Karan','Divya','Rohit','Sanjay','Tanvi'])[1 + (i % 20)] AS fn,
    (ARRAY['Sharma','Patel','Kumar','Gupta','Singh','Desai','Malhotra','Verma','Reddy','Nair','Joshi','Menon','Iyer','Chopra','Bose','Rao','Shah','Pillai','Mehta','Kulkarni'])[1 + ((i*3) % 20)] AS ln,
    (ARRAY['gmail.com','outlook.com','yahoo.in','rediffmail.com','zohomail.in'])[1 + (i % 5)] AS dom,
    (ARRAY['Nexa Retail Pvt Ltd','Sunrise Healthcare','Vertex Finserv','BrightPath Academy','Skyline Realty','Precision Tools Mfg','Grandeur Hotels','SwiftMove Logistics','ByteForge Technologies','Anand Traders'])[1 + (i % 10)] AS comp,
    (ARRAY['retail','healthcare','finance','education','real_estate','manufacturing','hospitality','logistics','technology','other'])[1 + (i % 10)] AS ind,
    (ARRAY['website','seo','social','ads','marketplace','referral','manual','api','whatsapp'])[1 + (i % 9)] AS src,
    (ARRAY['Contact Forms','Organic Search','Facebook Leads','Google Ads','Justdial','Partner Referral','Sales Entry','Partner API','Click-to-WhatsApp'])[1 + (i % 9)] AS sub,
    (ARRAY['Q1 Performance','Local SEO 2026','Social Always-on','Marketplace Sync','Referral Program','WhatsApp Business'])[1 + (i % 6)] AS camp,
    (ARRAY['enterprise_client','franchise','reseller','product_buyer','support_inquiry','influencer','job'])[1 + (i % 7)] AS cat,
    (ARRAY['new','new','contacted','interested','follow_up','negotiation','won','lost','spam','contacted','interested','won'])[1 + (i % 12)] AS st,
    (ARRAY['critical','high','medium','low'])[1 + (i % 4)] AS pri,
    (ARRAY['hot','warm','cold'])[1 + (i % 3)] AS temp,
    (ARRAY['Maharashtra','Karnataka','Delhi','Gujarat','Tamil Nadu','Telangana','West Bengal','Rajasthan'])[1 + (i % 8)] AS state,
    (ARRAY['Mumbai','Bengaluru','New Delhi','Ahmedabad','Chennai','Hyderabad','Kolkata','Jaipur'])[1 + (i % 8)] AS city,
    (ARRAY['Needs a billing + GST invoicing suite for 12 outlets','Looking for a patient management portal','Wants a loan origination dashboard','Requires an online admissions and fee portal','Needs a property listing CRM with site-visit tracking','Wants shop-floor production tracking','Looking for a booking engine with channel manager','Needs fleet tracking and POD capture','Wants a multi-tenant SaaS build','Requires a custom inventory + POS rollout'])[1 + (i % 10)] AS req,
    (ARRAY['₹1L - ₹3L','₹3L - ₹6L','₹6L - ₹10L','₹10L+','Under ₹1L'])[1 + (i % 5)] AS budget,
    (35 + (i * 37) % 62) AS score
  FROM generate_series(1,120) AS i
) s;

-- assign leads round-robin to agents (skip spam)
WITH ranked AS (
  SELECT l.id, row_number() OVER (ORDER BY l.created_at) AS rn FROM public.leads l WHERE l.status <> 'spam'
), agents AS (
  SELECT id, row_number() OVER (ORDER BY name) AS an, count(*) OVER () AS total FROM public.lead_agents
)
UPDATE public.leads l
SET assigned_agent_id = a.id, assigned_at = l.created_at + interval '4 minutes'
FROM ranked r JOIN agents a ON a.an = 1 + (r.rn % a.total)
WHERE l.id = r.id;

INSERT INTO public.lead_assignments (lead_id, agent_id, reason, auto_assigned, assignment_score, created_at)
SELECT id, assigned_agent_id, 'Round-robin auto assignment', true, ai_score, assigned_at
FROM public.leads WHERE assigned_agent_id IS NOT NULL;

INSERT INTO public.lead_notes (lead_id, content, created_by, is_private, created_at)
SELECT l.id,
  CASE l.status
    WHEN 'new' THEN 'Lead captured from ' || l.sub_source || '. Awaiting first contact.'
    WHEN 'contacted' THEN 'First call completed. Shared company profile and pricing deck.'
    WHEN 'interested' THEN 'Interested in the proposed scope. Asked for a demo next week.'
    WHEN 'follow_up' THEN 'Requested a call back after internal budget approval.'
    WHEN 'negotiation' THEN 'Negotiating on implementation timeline and AMC cost.'
    WHEN 'won' THEN 'Deal closed. Kickoff scheduled with the delivery team.'
    WHEN 'lost' THEN 'Lost - ' || coalesce(l.lost_reason,'no reason recorded') || '.'
    ELSE 'Flagged by fraud filter: ' || coalesce(l.spam_reason,'suspicious submission') || '.'
  END,
  coalesce(a.name,'System'), false, l.created_at + interval '30 minutes'
FROM public.leads l LEFT JOIN public.lead_agents a ON a.id = l.assigned_agent_id;

INSERT INTO public.lead_communications (lead_id, type, direction, subject, content, status, duration_seconds, created_by, created_at)
SELECT l.id, t.type, 'outbound',
  CASE t.type WHEN 'email' THEN 'Software Vala - proposal for ' || coalesce(l.company,l.name) ELSE NULL END,
  CASE t.type
    WHEN 'call' THEN 'Discovery call covering requirements and budget.'
    WHEN 'email' THEN 'Sent detailed proposal with scope, timeline and commercials.'
    ELSE 'Shared brochure and pricing summary on WhatsApp.' END,
  'completed',
  CASE t.type WHEN 'call' THEN 180 + (l.ai_score * 3) ELSE NULL END,
  coalesce(ag.name,'System'), l.created_at + interval '2 hours'
FROM public.leads l
LEFT JOIN public.lead_agents ag ON ag.id = l.assigned_agent_id
CROSS JOIN LATERAL (SELECT unnest(ARRAY['call','email','whatsapp']) AS type) t
WHERE l.status NOT IN ('new','spam');

INSERT INTO public.lead_follow_ups (lead_id, agent_id, scheduled_at, follow_up_type, notes, suggested_message, is_completed, created_at)
SELECT l.id, l.assigned_agent_id, l.next_follow_up,
  (ARRAY['call','whatsapp','email'])[1 + (abs(hashtext(l.id::text)) % 3)],
  'Scheduled follow-up based on the last conversation.',
  (ARRAY['Schedule call at 10 AM tomorrow','Send discount offer email','WhatsApp follow-up with brochure','Reassign to premium team'])[1 + (abs(hashtext(l.id::text)) % 4)],
  false, l.created_at + interval '3 hours'
FROM public.leads l WHERE l.next_follow_up IS NOT NULL;

INSERT INTO public.lead_escalations (lead_id, level, reason, escalated_from, escalated_to, is_resolved, idle_minutes, created_at)
SELECT l.id, 1 + (abs(hashtext(l.id::text)) % 3),
  (ARRAY['No response in 24 hours','High value lead (>5L)','Customer complaint','SLA breach on first response'])[1 + (abs(hashtext(l.id::text)) % 4)],
  l.assigned_agent_id,
  (SELECT id FROM public.lead_agents WHERE role IN ('Manager','Team Lead') ORDER BY name LIMIT 1),
  false, 60 + (abs(hashtext(l.id::text)) % 2400), l.created_at + interval '1 day'
FROM public.leads l WHERE l.status IN ('follow_up','negotiation') AND l.ai_score > 60;

INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity, is_active, created_at)
SELECT l.id, 'new', 'New lead from ' || l.sub_source, 'medium', true, l.created_at
FROM public.leads l WHERE l.status = 'new';
INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity, is_active, created_at)
SELECT l.id, 'high_value', 'High value lead detected (₹' || round(l.deal_value/100000,1) || 'L)', 'high', true, l.created_at + interval '5 minutes'
FROM public.leads l WHERE l.deal_value > 700000;
INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity, is_active, created_at)
SELECT l.id, 'idle', 'Lead idle for ' || (1 + (abs(hashtext(l.id::text)) % 5)) || ' days', 'medium', true, l.created_at + interval '2 days'
FROM public.leads l WHERE l.status = 'follow_up';
INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity, is_active, created_at)
SELECT l.id, 'sla', 'SLA breach - no response in 24 hours', 'high', true, l.created_at + interval '1 day'
FROM public.leads l WHERE l.status = 'contacted' AND l.ai_score < 55;
INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity, is_active, created_at)
SELECT l.id, 'duplicate', 'Potential duplicate found', 'low', true, l.created_at + interval '10 minutes'
FROM public.leads l WHERE l.is_duplicate;

INSERT INTO public.lead_scores (lead_id, score_type, score, confidence, factors)
SELECT id, 'ai_quality', ai_score, 70 + (ai_score % 25),
  jsonb_build_object('budget', budget_range, 'intent', intent_score, 'source', source, 'engagement', conversion_probability)
FROM public.leads;

INSERT INTO public.lead_routing_rules (name, rule_key, description, strategy, target_team, is_active, execution_count) VALUES
('Auto Lead Assignment','auto_assignment','Automatically assign new leads to available agents','round_robin','All Teams',true,1284),
('Rule-Based Distribution','rule_distribution','Distribute leads based on predefined rules','priority_score','Software Team',true,842),
('Country / State / City Routing','geo_routing','Route leads based on geographic location','geo','Geo Teams',true,613),
('Product-Based Routing','product_routing','Route leads to product specialists','product','Product Teams',true,447),
('Load Balancing (Team Wise)','load_balancing','Balance lead load across team members','load_balance','All Teams',true,1102),
('Failover Assignment','failover','Backup assignment when primary agent unavailable','failover','Backup Pool',true,96);

INSERT INTO public.lead_automation_rules (name, rule_key, description, trigger_event, accuracy, is_active, execution_count, last_executed_at) VALUES
('Auto Follow-Up Suggestions','auto_followup','AI suggests optimal follow-up actions','lead_idle',92,true,3184,now() - interval '12 minutes'),
('Best Time to Call','best_time','Predicts best contact times','daily_scan',87,true,2210,now() - interval '1 hour'),
('Response Prediction','response_prediction','Predicts lead response probability','lead_created',89,true,4102,now() - interval '6 minutes'),
('Drop-Off Alert','dropoff_alert','Alerts when leads are going cold','lead_idle',94,true,876,now() - interval '35 minutes'),
('Conversion Probability','conversion_probability','Calculates conversion likelihood','lead_updated',91,true,5320,now() - interval '3 minutes');

INSERT INTO public.lead_integrations (name, integration_key, description, category, status, endpoint_url, is_enabled, events_today, last_sync_at) VALUES
('CRM Sync','crm_sync','Sync leads with your CRM system','crm','connected','/api/public/leads/crm-sync',true,412,now() - interval '2 minutes'),
('WhatsApp API','whatsapp_api','Send WhatsApp messages to leads','whatsapp','connected','/api/public/leads/whatsapp',true,268,now() - interval '5 minutes'),
('Email API','email_api','Automated email campaigns','email','connected','/api/public/leads/email',true,193,now() - interval '10 minutes'),
('Call API','call_api','Click-to-call functionality','call','disconnected','/api/public/leads/call',false,0,NULL),
('Website Form API','form_api','Capture leads from website forms','form','connected','/api/public/leads/intake',true,537,now() - interval '1 minute');

INSERT INTO public.lead_integration_events (integration_key, event, detail, status, created_at) VALUES
('form_api','Lead captured','Contact form submission from softwarevala.in/contact','success', now() - interval '1 minute'),
('whatsapp_api','Message sent','Brochure sent to +91 98••• •1122','success', now() - interval '5 minutes'),
('email_api','Campaign triggered','Proposal follow-up sequence, 45 leads','success', now() - interval '10 minutes'),
('crm_sync','Lead exported','Bulk (45 leads) pushed to CRM','success', now() - interval '15 minutes'),
('call_api','Call failed','Provider credentials missing','error', now() - interval '32 minutes'),
('crm_sync','Lead captured','Partner API handoff synced','success', now() - interval '1 hour');

INSERT INTO public.lead_settings (category, setting_key, label, value_bool, value_text) VALUES
('status','auto_move_contacted','Auto-move to Contacted after first call',true,NULL),
('status','require_note_lost','Require note for Lost status',true,NULL),
('status','lock_won','Lock Won leads from editing',true,NULL),
('assignment','round_robin','Round Robin assignment',true,NULL),
('assignment','geo_based','Geo-based routing',true,NULL),
('assignment','skill_matching','Skill-based matching',false,NULL),
('notifications','new_lead','New lead notifications',true,NULL),
('notifications','sla_breach','SLA breach alerts',true,NULL),
('notifications','idle_lead','Idle lead alerts',true,NULL),
('notifications','daily_summary','Daily summary email',false,NULL),
('working','enforce_hours','Enforce working hours',true,'09:30 - 19:00 IST'),
('working','weekend_handling','Weekend handling',false,'Saturday half day'),
('working','holiday_calendar','Holiday calendar',true,'India - National + Maharashtra'),
('expiry','auto_archive','Auto-archive after 90 days',true,'90'),
('expiry','expired_cleanup','Expired lead cleanup',true,'Quarterly');

INSERT INTO public.lead_audit_logs (lead_id, action, action_type, details, actor, actor_role, ip_address, created_at)
SELECT l.id,
  (ARRAY['Lead Viewed','Lead Edited','Contact Unmasked','Export Attempted','Lead Deleted','Bulk Export'])[1 + (abs(hashtext(l.id::text)) % 6)],
  (ARRAY['read','update','read','export','delete','export'])[1 + (abs(hashtext(l.id::text)) % 6)],
  'Action performed on lead ' || l.name,
  coalesce(a.name,'System'), coalesce(a.role,'System'),
  '192.168.1.' || (abs(hashtext(l.id::text)) % 254),
  l.created_at + interval '90 minutes'
FROM public.leads l LEFT JOIN public.lead_agents a ON a.id = l.assigned_agent_id;
