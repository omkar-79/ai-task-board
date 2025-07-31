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
    let scheduledDateTime = toZonedTime(task.scheduledTime, timezone);
    
    // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (scheduledDateTime.getSeconds() > 0) {
      scheduledDateTime = new Date(scheduledDateTime.getTime() + 60000); // Add 1 minute
    }
    
    const currentDateTime = getCurrentDateTimeInTimezone(timezone);
    if (scheduledDateTime < currentDateTime) {
      return 'Overdue';
    } else if (scheduledDateTime.toDateString() === currentDateTime.toDateString()) {
      return 'Today';
    } else {
      // Check if it's this week
      const startOfWeek = new Date(currentDateTime);
      startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      if (scheduledDateTime >= startOfWeek && scheduledDateTime <= endOfWeek) {
        return 'This Week';
      } else {
        return 'Upcoming task';
      }
    }
  }
  // Priority 2: Check scheduled date only
  if (task.scheduledDate) {
    const scheduledDate = createUserDate(task.scheduledDate, timezone);
    const currentDateTime = getCurrentDateTimeInTimezone(timezone);
    if (scheduledDate < currentDateTime) {
      return 'Overdue';
    } else if (scheduledDate.toDateString() === currentDateTime.toDateString()) {
      return 'Today';
    } else {
      // Check if it's this week
      const startOfWeek = new Date(currentDateTime);
      startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      if (scheduledDate >= startOfWeek && scheduledDate <= endOfWeek) {
        return 'This Week';
      } else {
        return 'Upcoming task';
      }
    }
  }
  // Priority 3: Check deadline
  if (task.deadline) {
    let deadline = toZonedTime(new Date(task.deadline), timezone);
    
    // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (deadline.getSeconds() > 0) {
      deadline = new Date(deadline.getTime() + 60000); // Add 1 minute
    }
    
    const currentDateTime = getCurrentDateTimeInTimezone(timezone);
    if (deadline < currentDateTime) {
      return 'Overdue';
    } else if (deadline.toDateString() === currentDateTime.toDateString()) {
      return 'Today';
    } else {
      // Check if it's this week
      const startOfWeek = new Date(currentDateTime);
      startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      if (deadline >= startOfWeek && deadline <= endOfWeek) {
        return 'This Week';
      } else {
        return 'Upcoming task';
      }
    }
  }
  // Default: Overdue
  return 'Overdue';
} 