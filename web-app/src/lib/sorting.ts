import { Task, ColumnId } from './types';
import { createUserDateTime, createUserDate } from './utils';

/**
 * Get the relevant time for Today column sorting
 * Priority: scheduled time > deadline time
 */
const getRelevantTime = (task: Task, timezone: string = 'America/New_York'): Date | null => {
  // Priority 1: Check scheduled date and time
  if (task.scheduledDate && task.scheduledTime) {
    return createUserDateTime(task.scheduledDate, task.scheduledTime, timezone);
  }
  
  // Priority 2: Check deadline
  if (task.deadline) {
    return new Date(task.deadline);
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
    return new Date(task.deadline);
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
      return a.deadline.getTime() - b.deadline.getTime();
    }
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;

    // If neither has deadline, don't sort
    return 0;
  });
}; 