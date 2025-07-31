import { format, isToday, isThisWeek, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Task, ColumnId, TimeBlock, DaySchedule, UserProfile, TaskPriority } from './types';
import { sortTasksByPriority } from './sorting';
import { 
  createDateInTimezone, 
  getCurrentDateTimeInTimezone, 
  isTodayInTimezone, 
  isOverdueInTimezone,
  convertToTimezone
} from './time';
import { determineOnceTaskColumn } from '../algorithms/oncePlacement';
import { determineEverydayTaskColumn } from '../algorithms/everydayPlacement';
import { determineEveryweekTaskColumn } from '../algorithms/everyweekPlacement';

// Timezone-aware utilities
export const EST_TIMEZONE_OFFSET = -5; // EST is UTC-5

/**
 * Create a date and time in user's timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format
 * @param timezone - User's timezone
 * @returns Date object in user's timezone
 */
export const createUserDateTime = (dateString: string, timeString: string, timezone: string): Date => {
  return createDateInTimezone(dateString, timeString, timezone);
};

/**
 * Create a date in user's timezone (date only, no time)
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timezone - User's timezone
 * @returns Date object in user's timezone
 */
export const createUserDate = (dateString: string, timezone: string): Date => {
  return createDateInTimezone(dateString, undefined, timezone);
};

// Legacy functions for backward compatibility
export const createESTDateTime = (dateString: string, timeString: string): Date => {
  return createUserDateTime(dateString, timeString, 'America/New_York');
};

export const createESTDate = (dateString: string): Date => {
  return createUserDate(dateString, 'America/New_York');
};

/**
 * Format a date for display in EST timezone
 * @param date - Date object
 * @returns Formatted date string in EST
 */
export const formatESTDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Format a time for display in EST timezone
 * @param date - Date object
 * @returns Formatted time string in EST (HH:MM)
 */
export const formatESTTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

/**
 * Get current date and time in EST timezone
 * @returns Date object representing current EST time
 */
export const getCurrentESTDateTime = (): Date => {
  const now = new Date();
  const estOffset = EST_TIMEZONE_OFFSET * 60 * 1000; // Convert to milliseconds
  return new Date(now.getTime() + estOffset);
};

// Date and Time Utilities
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'yyyy-MM-dd HH:mm');
};

export const parseTime = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const timeToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Task Categorization Logic
export function determineTaskColumn(task: Task, timezone: string = 'America/New_York'): ColumnId {
  if (task.recurrence === 'everyday') {
    return determineEverydayTaskColumn(task, timezone);
  }
  if (task.recurrence === 'everyweek') {
    return determineEveryweekTaskColumn(task, timezone);
  }
  // Default to once/one-time logic
  return determineOnceTaskColumn(task, timezone);
}

// Schedule and Free Time Calculations
export const calculateFreeTime = (daySchedule: DaySchedule): TimeBlock[] => {
  const freeTimeBlocks: TimeBlock[] = [];
  const dayStartMinutes = 0; // 00:00
  const dayEndMinutes = 24 * 60; // 24:00

  // Get all busy periods (work + sleep)
  const busyPeriods: { start: number; end: number }[] = [];

  // Add work hours
  daySchedule.workHours.forEach(work => {
    busyPeriods.push({
      start: timeToMinutes(work.start),
      end: timeToMinutes(work.end)
    });
  });

  // Add sleep hours
  busyPeriods.push({
    start: timeToMinutes(daySchedule.sleepHours.start),
    end: timeToMinutes(daySchedule.sleepHours.end)
  });

  // Sort busy periods by start time
  busyPeriods.sort((a, b) => a.start - b.start);

  // Merge overlapping periods
  const mergedBusyPeriods: { start: number; end: number }[] = [];
  for (const period of busyPeriods) {
    if (mergedBusyPeriods.length === 0 || mergedBusyPeriods[mergedBusyPeriods.length - 1].end < period.start) {
      mergedBusyPeriods.push(period);
    } else {
      mergedBusyPeriods[mergedBusyPeriods.length - 1].end = Math.max(
        mergedBusyPeriods[mergedBusyPeriods.length - 1].end,
        period.end
      );
    }
  }

  // Calculate free time between busy periods
  let currentTime = dayStartMinutes;
  for (const busyPeriod of mergedBusyPeriods) {
    if (currentTime < busyPeriod.start) {
      freeTimeBlocks.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(busyPeriod.start)
      });
    }
    currentTime = Math.max(currentTime, busyPeriod.end);
  }

  // Add free time after last busy period
  if (currentTime < dayEndMinutes) {
    freeTimeBlocks.push({
      start: minutesToTime(currentTime),
      end: minutesToTime(dayEndMinutes)
    });
  }

  return freeTimeBlocks.filter(block => timeToMinutes(block.end) - timeToMinutes(block.start) >= 15); // At least 15 minutes
};

export const getCurrentFreeTime = (profile: UserProfile): { available: boolean; duration: number; timeBlock?: TimeBlock } => {
  const now = new Date();
  const dayOfWeek = format(now, 'EEEE').toLowerCase() as keyof UserProfile['schedule'];
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = profile.schedule[dayOfWeek];
  const freeTimeBlocks = calculateFreeTime(todaySchedule);

  for (const block of freeTimeBlocks) {
    const blockStart = timeToMinutes(block.start);
    const blockEnd = timeToMinutes(block.end);

    if (currentTimeMinutes >= blockStart && currentTimeMinutes < blockEnd) {
      return {
        available: true,
        duration: blockEnd - currentTimeMinutes,
        timeBlock: block
      };
    }
  }

  return { available: false, duration: 0 };
};

// Task Filtering and Sorting
export const filterTasksByColumn = (tasks: Task[], columnId: ColumnId): Task[] => {
  return tasks.filter(task => task.column === columnId && task.status !== 'completed');
};

// Import sorting functions from dedicated module
export { sortTasksByPriority } from './sorting';

export const getTasksForSuggestion = (tasks: Task[], availableMinutes: number): Task[] => {
  const pendingTasks = tasks.filter(task => 
    (task.column === 'Overdue' || task.column === 'Upcoming task') && 
    (task.duration || 0) <= availableMinutes &&
    task.status !== 'completed'
  );

  return sortTasksByPriority(pendingTasks);
};

// Validation Utilities
export const validateTimeBlock = (timeBlock: TimeBlock): boolean => {
  const startMinutes = timeToMinutes(timeBlock.start);
  const endMinutes = timeToMinutes(timeBlock.end);
  return startMinutes < endMinutes;
};

export const validateDaySchedule = (schedule: DaySchedule): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate sleep hours
  if (!validateTimeBlock(schedule.sleepHours)) {
    errors.push('Sleep hours: end time must be after start time');
  }

  // Validate work hours
  schedule.workHours.forEach((workBlock, index) => {
    if (!validateTimeBlock(workBlock)) {
      errors.push(`Work block ${index + 1}: end time must be after start time`);
    }
  });

  return { valid: errors.length === 0, errors };
};

// Local Storage Utilities
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

// ID Generation
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Color Utilities for UI
export const getColumnColor = (columnId: ColumnId): string => {
  const colors = {
    'Today': '#4299E1',      // Blue
    'This Week': '#38B2AC',  // Teal
    'Upcoming task': '#718096',  // Gray
    'Overdue': '#E53E3E',    // Red
  
  };
  return colors[columnId];
};

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  const colors = {
    'high': '#E53E3E',    // Red
    'medium': '#F6AD55',  // Orange
    'low': '#4299E1'      // Blue
  };
  return colors[priority];
}; 