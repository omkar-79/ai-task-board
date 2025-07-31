import { Task, ColumnId } from '../lib/types';
import { createUserDateTime, createUserDate} from '../lib/utils';
import { 
    createDateInTimezone, 
    getCurrentDateTimeInTimezone, 
    isTodayInTimezone, 
    isOverdueInTimezone,
    convertToTimezone
  } from '../lib/time';
import { toZonedTime } from 'date-fns-tz';

export function determineOnceTaskColumn(task: Task, timezone: string = 'America/New_York'): ColumnId {
  // Priority 1: Check scheduled time
  if (task.scheduledTime) {
    // Convert both times to the user's timezone for comparison
    const scheduledTimeInUserTz = toZonedTime(task.scheduledTime, timezone);
    const currentTimeInUserTz = toZonedTime(new Date(), timezone);
    
    // Round up scheduled time by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (scheduledTimeInUserTz.getSeconds() > 0) {
      scheduledTimeInUserTz.setTime(scheduledTimeInUserTz.getTime() + 60000); // Add 1 minute
    }
    
    // Compare the times (both are now in the user's timezone)
    if (scheduledTimeInUserTz < currentTimeInUserTz) {
      return 'Overdue';
    } else if (scheduledTimeInUserTz.toDateString() === currentTimeInUserTz.toDateString()) {
      return 'Today';
    } else {
      // Check if it's this week
      const startOfWeek = new Date(currentTimeInUserTz);
      startOfWeek.setDate(currentTimeInUserTz.getDate() - currentTimeInUserTz.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      if (scheduledTimeInUserTz >= startOfWeek && scheduledTimeInUserTz <= endOfWeek) {
        return 'This Week';
      } else {
        return 'Upcoming task';
      }
    }
  }
  // Priority 2: Check scheduled date only
  if (task.scheduledDate) {
    // Convert both times to the user's timezone for comparison
    const scheduledDateInUserTz = createUserDate(task.scheduledDate, timezone);
    const currentTimeInUserTz = toZonedTime(new Date(), timezone);
    
    // Compare the times (both are now in the user's timezone)
    if (scheduledDateInUserTz < currentTimeInUserTz) {
      return 'Overdue';
    } else if (scheduledDateInUserTz.toDateString() === currentTimeInUserTz.toDateString()) {
      return 'Today';
    } else {
      // Check if it's this week
      const startOfWeek = new Date(currentTimeInUserTz);
      startOfWeek.setDate(currentTimeInUserTz.getDate() - currentTimeInUserTz.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      if (scheduledDateInUserTz >= startOfWeek && scheduledDateInUserTz <= endOfWeek) {
        return 'This Week';
      } else {
        return 'Upcoming task';
      }
    }
  }
  // Priority 3: Check deadline
  if (task.deadline) {
    // Convert both times to the user's timezone for comparison
    const deadlineInUserTz = toZonedTime(task.deadline, timezone);
    const currentTimeInUserTz = toZonedTime(new Date(), timezone);
    
    // Round up deadline by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (deadlineInUserTz.getSeconds() > 0) {
      deadlineInUserTz.setTime(deadlineInUserTz.getTime() + 60000); // Add 1 minute
    }
    
    // Compare the times (both are now in the user's timezone)
    if (deadlineInUserTz < currentTimeInUserTz) {
      return 'Overdue';
    } else if (deadlineInUserTz.toDateString() === currentTimeInUserTz.toDateString()) {
      return 'Today';
    } else {
      // Check if it's this week
      const startOfWeek = new Date(currentTimeInUserTz);
      startOfWeek.setDate(currentTimeInUserTz.getDate() - currentTimeInUserTz.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      if (deadlineInUserTz >= startOfWeek && deadlineInUserTz <= endOfWeek) {
        return 'This Week';
      } else {
        return 'Upcoming task';
      }
    }
  }
  // Default: Overdue
  return 'Overdue';
} 