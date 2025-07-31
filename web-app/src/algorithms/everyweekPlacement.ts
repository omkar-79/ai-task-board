import { Task, ColumnId } from '../lib/types';
import { toZonedTime } from 'date-fns-tz';
import { 
    createDateInTimezone, 
    getCurrentDateTimeInTimezone, 
    isTodayInTimezone, 
    isOverdueInTimezone,
    convertToTimezone
  } from '../lib/time';

export function determineEveryweekTaskColumn(task: Task, timezone: string = 'America/New_York'): ColumnId {
  if (!task.recurrenceTimeUTC || !task.recurrenceDay) return 'Overdue';
  
  // Get current time in user's timezone
  const now = getCurrentDateTimeInTimezone(timezone);
  
  // Get the recurrence time in user's timezone
  const recurrenceTime = toZonedTime(new Date(task.recurrenceTimeUTC), timezone);
  
  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const currentDayOfWeek = now.getDay();
  
  // Get target day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNamesLower = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Handle both lowercase and titlecase day names
  let targetDayOfWeek = dayNames.indexOf(task.recurrenceDay);
  if (targetDayOfWeek === -1) {
    targetDayOfWeek = dayNamesLower.indexOf(task.recurrenceDay?.toLowerCase() || '');
  }
  
  if (targetDayOfWeek === -1) return 'Overdue';
  
  // Calculate days until the target day
  let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7; // Next week
  }
  
  // Create the next occurrence date
  const nextOccurrence = new Date(now);
  nextOccurrence.setDate(now.getDate() + daysUntilTarget);
  nextOccurrence.setHours(recurrenceTime.getHours(), recurrenceTime.getMinutes(), 0, 0);
  
  // If the target day is today, check if the time has passed
  if (daysUntilTarget === 0) {
    // Same day - check if time has passed
    if (now > nextOccurrence) {
      return 'Overdue';
    } else {
      return 'Today';
    }
  }
  
  // If the target day is later this week
  if (daysUntilTarget > 0 && daysUntilTarget <= 6) {
    return 'This Week';
  }
  
  // If the target day is next week or later
  return 'Upcoming task';
} 