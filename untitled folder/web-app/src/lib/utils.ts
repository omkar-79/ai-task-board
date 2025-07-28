import { Task, TaskColumn, TimeBlock, DaySchedule, UserProfile } from './types';
import { format, isToday, isThisWeek, isPast, addDays, startOfWeek, endOfWeek } from 'date-fns';

// Date and Time Utilities
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const parseTimeString = (timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const timeStringToMinutes = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const minutesToTimeString = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Task Categorization Logic
export const categorizeTask = (task: Task): TaskColumn => {
  const now = new Date();
  
  // Check if task is overdue
  if (task.deadline && isPast(task.deadline)) {
    return 'Overdue';
  }
  
  // Check if task is for today
  if (task.deadline && isToday(task.deadline)) {
    return 'Today';
  }
  
  // Check if task is for this week
  if (task.deadline && isThisWeek(task.deadline)) {
    return 'This Week';
  }
  
  // Check if task is important
  if (task.type === 'important') {
    return 'Important';
  }
  
  // Check if task is daily
  if (task.column === 'Daily') {
    return 'Daily';
  }
  
  // Default to pending
  return 'Pending';
};

// Time Block Calculations
export const calculateTimeBlockDuration = (timeBlock: TimeBlock): number => {
  const startMinutes = timeStringToMinutes(timeBlock.start);
  const endMinutes = timeStringToMinutes(timeBlock.end);
  return endMinutes - startMinutes;
};

export const getFreeTimeForDay = (schedule: DaySchedule): number => {
  const totalMinutes = 24 * 60; // 24 hours in minutes
  const workMinutes = schedule.workHours.reduce((total, block) => 
    total + calculateTimeBlockDuration(block), 0);
  const sleepMinutes = calculateTimeBlockDuration(schedule.sleepHours);
  
  return totalMinutes - workMinutes - sleepMinutes;
};

export const getWeekDays = (): string[] => {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
};

// LocalStorage Utilities
export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

// Task Management Utilities
export const generateTaskId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createTask = (data: Omit<Task, 'id' | 'createdAt' | 'column'>): Task => {
  return {
    ...data,
    id: generateTaskId(),
    createdAt: new Date(),
    column: categorizeTask({ ...data, id: '', createdAt: new Date(), column: 'Pending' })
  };
};

export const updateTask = (task: Task, updates: Partial<Task>): Task => {
  return {
    ...task,
    ...updates,
    column: updates.deadline || updates.type ? 
      categorizeTask({ ...task, ...updates }) : 
      task.column
  };
};

export const moveTask = (task: Task, newColumn: TaskColumn): Task => {
  return {
    ...task,
    column: newColumn
  };
};

// Default Data
export const getDefaultUserProfile = (): UserProfile => {
  const weekDays = getWeekDays();
  const schedule: UserProfile['schedule'] = {};
  
  weekDays.forEach(day => {
    schedule[day] = {
      workHours: [
        { start: '09:00', end: '17:00' }
      ],
      sleepHours: { start: '23:00', end: '07:00' },
      freeTime: [
        { start: '07:00', end: '09:00' },
        { start: '17:00', end: '23:00' }
      ]
    };
  });
  
  return {
    id: 'default',
    schedule
  };
};

export const getSampleTasks = (): Task[] => {
  return [
    {
      id: '1',
      title: 'Complete project proposal',
      description: 'Finish the quarterly project proposal document',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      duration: 120,
      type: 'important',
      column: 'Today',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      title: 'Daily standup',
      description: 'Team daily standup meeting',
      deadline: new Date(),
      duration: 15,
      type: 'regular',
      column: 'Daily',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '3',
      title: 'Review code changes',
      description: 'Review pull requests and provide feedback',
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      duration: 60,
      type: 'regular',
      column: 'This Week',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ];
};

// Validation Utilities
export const validateTimeBlock = (timeBlock: TimeBlock): boolean => {
  const startMinutes = timeStringToMinutes(timeBlock.start);
  const endMinutes = timeStringToMinutes(timeBlock.end);
  return startMinutes < endMinutes;
};

export const validateTask = (task: Partial<Task>): string[] => {
  const errors: string[] = [];
  
  if (!task.title?.trim()) {
    errors.push('Title is required');
  }
  
  if (task.duration && task.duration <= 0) {
    errors.push('Duration must be greater than 0');
  }
  
  if (task.deadline && task.deadline < new Date()) {
    errors.push('Deadline cannot be in the past');
  }
  
  return errors;
}; 