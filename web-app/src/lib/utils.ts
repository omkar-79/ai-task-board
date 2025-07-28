import { format, isToday, isThisWeek, isPast, addDays, parseISO } from 'date-fns';
import { Task, ColumnId, TimeBlock, DaySchedule, UserProfile, TaskType } from './types';

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
export const determineTaskColumn = (task: Omit<Task, 'column' | 'order'>, currentDate: Date = new Date()): ColumnId => {
  // Check if task is overdue
  if (task.deadline && isPast(task.deadline) && !isToday(task.deadline)) {
    return 'Overdue';
  }

  // Check if task is important
  if (task.type === 'important') {
    return 'Important';
  }

  // Check if task is for today
  if (task.deadline && isToday(task.deadline)) {
    return 'Today';
  }

  // Check if task is for this week
  if (task.deadline && isThisWeek(task.deadline)) {
    return 'This Week';
  }

  // Default to pending
  return 'Pending';
};

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
  return tasks.filter(task => task.column === columnId);
};

export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => {
    // Important tasks first
    if (a.type === 'important' && b.type !== 'important') return -1;
    if (a.type !== 'important' && b.type === 'important') return 1;

    // Then by deadline (earliest first)
    if (a.deadline && b.deadline) {
      return a.deadline.getTime() - b.deadline.getTime();
    }
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;

    // Then by duration (shorter first)
    return a.duration - b.duration;
  });
};

export const getTasksForSuggestion = (tasks: Task[], availableMinutes: number): Task[] => {
  const pendingTasks = tasks.filter(task => 
    (task.column === 'Pending' || task.column === 'Important') && 
    task.duration <= availableMinutes
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
    'Important': '#E53E3E',  // Red
    'Daily': '#805AD5',      // Purple
    'Pending': '#718096',    // Gray
    'Overdue': '#DD6B20'     // Orange
  };
  return colors[columnId];
};

export const getTaskTypeColor = (type: TaskType): string => {
  return type === 'important' ? '#E53E3E' : '#4299E1';
}; 