-- Debug query to check task recurrence data
-- Run this in your Supabase SQL editor

SELECT 
    id,
    title,
    recurrence,
    recurrence_day,
    recurrence_time,
    created_at,
    user_id
FROM public.tasks 
WHERE recurrence IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- If you want to see all columns for a specific task:
-- SELECT * FROM public.tasks WHERE title = 'everyweek' ORDER BY created_at DESC LIMIT 1;

-- To check the schema structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'tasks' 
-- AND column_name IN ('recurrence', 'recurrence_day', 'recurrence_time');

-- ADDITIONAL QUERIES TO FIND THE MISSING WEEKLY TASK:

-- 1. Search for the specific weekly task by title
SELECT * FROM public.tasks 
WHERE title = 'everyweek' 
ORDER BY created_at DESC;

-- 2. Search for ALL weekly tasks
SELECT * FROM public.tasks 
WHERE recurrence = 'everyweek' 
ORDER BY created_at DESC;

-- 3. Search by the specific task ID from logs
SELECT * FROM public.tasks 
WHERE id = '399e192c-0131-4d89-85bc-3045c08867bb';

-- 4. Check all tasks created in the last hour
SELECT 
    id,
    title,
    recurrence,
    recurrence_day,
    recurrence_time,
    created_at
FROM public.tasks 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 5. Check all tasks regardless of recurrence
SELECT 
    id,
    title,
    recurrence,
    recurrence_day,
    recurrence_time,
    created_at
FROM public.tasks 
ORDER BY created_at DESC
LIMIT 20;

-- 6. Check the LATEST task we just created (ID: 260cbefe-573e-4881-b39b-bf52d09f32fa)
SELECT * FROM public.tasks 
WHERE id = '260cbefe-573e-4881-b39b-bf52d09f32fa'; 