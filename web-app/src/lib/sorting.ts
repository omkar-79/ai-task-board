import { Task, ColumnId } from './types';
import { createUserDateTime, createUserDate } from './utils';
import { toZonedTime } from 'date-fns-tz';
import { convertToTimezone } from './time';

/**
 * Get the relevant time for Today column sorting
 * Priority: scheduled time > deadline time
 */
const getRelevantTime = (task: Task, timezone: string = 'America/New_York'): Date | null => {
  // Priority 1: Check scheduled time
  if (task.scheduledTime) {
    let scheduledDate = toZonedTime(task.scheduledTime, timezone);
    
    // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (scheduledDate.getSeconds() > 0) {
      scheduledDate = new Date(scheduledDate.getTime() + 60000); // Add 1 minute
    }
    
    return scheduledDate;
  }
  
  // Priority 2: Check deadline
  if (task.deadline) {
    let deadlineDate = toZonedTime(new Date(task.deadline), timezone);
    
    // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (deadlineDate.getSeconds() > 0) {
      deadlineDate = new Date(deadlineDate.getTime() + 60000); // Add 1 minute
    }
    
    return deadlineDate;
  }
  
  return null;
};

/**
 * Get the relevant date for other columns sorting
 * Priority: scheduled date > deadline date
 */
const getRelevantDate = (task: Task, timezone: string = 'America/New_York'): Date | null => {
  // Priority 1: Check scheduled date
  if (task.scheduledDate) {
    return createUserDate(task.scheduledDate, timezone);
  }
  
  // Priority 2: Check deadline
  if (task.deadline) {
    let deadlineDate = toZonedTime(new Date(task.deadline), timezone);
    
    // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (deadlineDate.getSeconds() > 0) {
      deadlineDate = new Date(deadlineDate.getTime() + 60000); // Add 1 minute
    }
    
    return deadlineDate;
  }
  
  return null;
};

/**
 * Sort tasks for Today column
 * Sort by scheduled time if exists, otherwise by deadline time
 */
export const sortTasksForToday = (tasks: Task[], timezone: string = 'America/New_York'): Task[] => {
  return [...tasks].sort((a, b) => {
    const aTime = getRelevantTime(a, timezone);
    const bTime = getRelevantTime(b, timezone);
    
    // If both have times, sort by time (earliest first)
    if (aTime && bTime) {
      return aTime.getTime() - bTime.getTime();
    }
    
    // If only one has a time, put the one with time first
    if (aTime && !bTime) return -1;
    if (!aTime && bTime) return 1;
    
    // If neither has a time, don't sort (keep as is)
    return 0;
  });
};

/**
 * Sort tasks for This Week, Upcoming, and Overdue columns
 * Sort by date (earliest day at the top)
 */
export const sortTasksByDate = (tasks: Task[], timezone: string = 'America/New_York'): Task[] => {
  return [...tasks].sort((a, b) => {
    const aDate = getRelevantDate(a, timezone);
    const bDate = getRelevantDate(b, timezone);
    
    // If both have dates, sort by date (earliest first)
    if (aDate && bDate) {
      return aDate.getTime() - bDate.getTime();
    }
    
    // If only one has a date, put the one with date first
    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    
    // If neither has a date, don't sort (keep as is)
    return 0;
  });
};

/**
 * Main sorting function that routes to appropriate sorting algorithm based on column
 */
export const sortTasksForColumn = (tasks: Task[], columnId: ColumnId, timezone: string = 'America/New_York'): Task[] => {
  switch (columnId) {
    case 'Today':
      return sortTasksForToday(tasks, timezone);
    case 'This Week':
    case 'Upcoming task':
    case 'Overdue':
      return sortTasksByDate(tasks, timezone);
    default:
      // No sorting for unknown columns
      return tasks;
  }
};

/**
 * Legacy sorting function for backward compatibility
 * Sorts by deadline only (no priority consideration)
 */
export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // Sort by deadline (earliest first)
    if (a.deadline && b.deadline) {
      let aDeadline = toZonedTime(new Date(a.deadline), 'America/New_York');
      let bDeadline = toZonedTime(new Date(b.deadline), 'America/New_York');
      
      // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
      if (aDeadline.getSeconds() > 0) {
        aDeadline = new Date(aDeadline.getTime() + 60000); // Add 1 minute
      }
      if (bDeadline.getSeconds() > 0) {
        bDeadline = new Date(bDeadline.getTime() + 60000); // Add 1 minute
      }
      
      return aDeadline.getTime() - bDeadline.getTime();
    }
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;

    // If neither has deadline, don't sort
    return 0;
  });
}; 