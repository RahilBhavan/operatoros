-- WS-1.1 follow-through: extend reminder_log.reminder_type CHECK to accept
-- the sms-* prefixed variants the cron fan-out writes for SMS sends. The
-- unique (deadline_id, reminder_type) constraint already covers idempotency
-- across email/SMS for the same window.

ALTER TABLE public.reminder_log
  DROP CONSTRAINT IF EXISTS reminder_log_reminder_type_check;

ALTER TABLE public.reminder_log
  ADD CONSTRAINT reminder_log_reminder_type_check
  CHECK (
    reminder_type IN (
      '90_day', '60_day', '30_day', '7_day', '1_day',
      'sms-90_day', 'sms-60_day', 'sms-30_day', 'sms-7_day', 'sms-1_day'
    )
  );
