import { Task, ColumnId } from '../lib/types';
import { toZonedTime } from 'date-fns-tz';
import { 
    createDateInTimezone, 
    getCurrentDateTimeInTimezone, 
    isTodayInTimezone, 
    isOverdueInTimezone,
    convertToTimezone
  } from '../lib/time';

export function determineEverydayTaskColumn(task: Task, timezone: string = 'America/New_York'): ColumnId {
  if (!task.recurrenceTimeUTC) return 'Overdue';
  // Get current time in user's timezone
  const now = toZonedTime(new Date(), timezone);
  // Convert the stored UTC recurrence_time to user's timezone
  const recurrenceTime = toZonedTime(new Date(task.recurrenceTimeUTC), timezone);
  // Create a Date for today at the recurrence time in user's timezone
  const todayRecurrence = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
    recurrenceTime.getHours(), recurrenceTime.getMinutes(), 0
  );
  if (now < todayRecurrence) {
    return 'Today';
  } else {
    return 'Overdue';
  }
} 