CREATE OR REPLACE FUNCTION public.generate_lead_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity)
    VALUES (NEW.id, 'new_lead', 'New lead captured: ' || NEW.name, CASE WHEN NEW.priority IN ('critical', 'high') THEN 'high' ELSE 'medium' END);
  END IF;

  IF NEW.deal_value >= 500000 AND (TG_OP = 'INSERT' OR OLD.deal_value IS DISTINCT FROM NEW.deal_value) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lead_alerts
      WHERE lead_id = NEW.id AND alert_type = 'high_value' AND is_active
    ) THEN
      INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity)
      VALUES (NEW.id, 'high_value', 'High-value opportunity: ' || NEW.name, 'high');
    END IF;
  END IF;

  IF (NEW.is_duplicate OR NEW.duplicate_score >= 70) AND
     (TG_OP = 'INSERT' OR OLD.is_duplicate IS DISTINCT FROM NEW.is_duplicate OR OLD.duplicate_score IS DISTINCT FROM NEW.duplicate_score) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lead_alerts
      WHERE lead_id = NEW.id AND alert_type = 'duplicate' AND is_active
    ) THEN
      INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity)
      VALUES (NEW.id, 'duplicate', 'Possible duplicate detected: ' || NEW.name, 'medium');
    END IF;
  END IF;

  IF NEW.fraud_score >= 70 AND (TG_OP = 'INSERT' OR OLD.fraud_score IS DISTINCT FROM NEW.fraud_score) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.lead_alerts
      WHERE lead_id = NEW.id AND alert_type = 'fraud' AND is_active
    ) THEN
      INSERT INTO public.lead_alerts (lead_id, alert_type, message, severity)
      VALUES (NEW.id, 'fraud', 'Fraud-risk lead detected: ' || NEW.name, 'high');
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('won', 'lost', 'spam') THEN
    UPDATE public.lead_alerts
    SET is_active = false, acknowledged_at = COALESCE(acknowledged_at, now())
    WHERE lead_id = NEW.id AND is_active AND alert_type IN ('new_lead', 'idle', 'sla_breach');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_lead_alerts ON public.leads;
CREATE TRIGGER trg_generate_lead_alerts
AFTER INSERT OR UPDATE OF status, priority, deal_value, is_duplicate, duplicate_score, fraud_score
ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.generate_lead_alerts();