-- Migration to consolidate scheduled_date and scheduled_time into a single scheduled_time column
-- This will handle both "once" tasks (full datetime) and recurring tasks (just time)

-- First, add the new scheduled_time column
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;

-- Update existing "once" tasks to combine scheduled_date and scheduled_time
UPDATE public.tasks 
SET scheduled_time_new = scheduled_date + (scheduled_time::time - '00:00:00'::time)
WHERE recurrence = 'once' 
  AND scheduled_date IS NOT NULL 
  AND scheduled_time IS NOT NULL;

-- For "once" tasks that only have scheduled_date, use that
UPDATE public.tasks 
SET scheduled_time_new = scheduled_date
WHERE recurrence = 'once' 
  AND scheduled_date IS NOT NULL 
  AND scheduled_time IS NULL;

-- For daily recurring tasks, keep the time part (use a fixed date like 2000-01-01)
UPDATE public.tasks 
SET scheduled_time_new = '2000-01-01'::date + (scheduled_time::time - '00:00:00'::time)
WHERE recurrence = 'everyday' 
  AND scheduled_time IS NOT NULL;

-- For weekly recurring tasks, keep the time part (use a fixed date like 2000-01-01)
UPDATE public.tasks 
SET scheduled_time_new = '2000-01-01'::date + (scheduled_time::time - '00:00:00'::time)
WHERE recurrence = 'everyweek' 
  AND scheduled_time IS NOT NULL;

-- Drop the old columns
ALTER TABLE public.tasks DROP COLUMN IF EXISTS scheduled_date;
ALTER TABLE public.tasks DROP COLUMN IF EXISTS scheduled_time;

-- Rename the new column to scheduled_time
ALTER TABLE public.tasks RENAME COLUMN scheduled_time_new TO scheduled_time;

-- Add a comment to clarify the usage
COMMENT ON COLUMN public.tasks.scheduled_time IS 'For "once" tasks: full datetime. For recurring tasks: time only (stored with fixed date 2000-01-01).'; 