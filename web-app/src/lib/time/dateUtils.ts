/**
 * Date utility functions for the task management app
 */

import { convertToTimezone, getTimezoneOffset, getUserTimezone } from './timezone';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Create a date in user's timezone from date and time strings
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format
 * @param timezone - The user's timezone
 * @returns The date in UTC for storage
 */
export const createUserDateTime = (dateString: string, timeString: string, timezone: string): Date => {
  // Create an ISO string in the format that represents the user's intended time
  const isoString = `${dateString}T${timeString}:00`;
  
  // Use fromZonedTime to properly create a Date that represents this time in the user's timezone
  // This will return a UTC Date that, when converted to the user's timezone, shows the correct time
  return fromZonedTime(isoString, timezone);
};

/**
 * Create a date in user's timezone from date string only
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timezone - The user's timezone
 * @returns The date in the user's timezone
 */
export const createUserDate = (dateString: string, timezone: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  return date;
};

/**
 * Format a date for display
 * @param date - The date to format
 * @param format - The format type
 * @returns The formatted date string
 */
export const formatDate = (date: Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  const options: Intl.DateTimeFormatOptions = {};
  
  switch (format) {
    case 'short':
      options.month = 'short';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'long':
      options.weekday = 'long';
      options.month = 'long';
      options.day = 'numeric';
      options.year = 'numeric';
      break;
    case 'time':
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
      break;
  }
  
  return date.toLocaleDateString('en-US', options);
};

/**
 * Get the start of a week (Monday) in a specific timezone
 * @param date - The reference date
 * @param timezone - The timezone
 * @returns The start of the week
 */
export const getStartOfWeek = (date: Date, timezone: string): Date => {
  const currentDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Convert to Monday-based week
  
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - daysFromMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  
  return startOfWeek;
};

/**
 * Get the end of a week (Sunday) in a specific timezone
 * @param date - The reference date
 * @param timezone - The timezone
 * @returns The end of the week
 */
export const getEndOfWeek = (date: Date, timezone: string): Date => {
  const startOfWeek = getStartOfWeek(date, timezone);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23, 59, 59, 999);
  
  return endOfWeek;
};

/**
 * Check if a date is within a specific week
 * @param date - The date to check
 * @param weekStart - The start of the week
 * @param weekEnd - The end of the week
 * @returns True if the date is within the week
 */
export const isDateInWeek = (date: Date, weekStart: Date, weekEnd: Date): boolean => {
  return date >= weekStart && date <= weekEnd;
};

/**
 * Get the number of days between two dates
 * @param date1 - The first date
 * @param date2 - The second date
 * @returns The number of days between the dates
 */
export const getDaysBetween = (date1: Date, date2: Date): number => {
  const timeDiff = date2.getTime() - date1.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * Add days to a date
 * @param date - The base date
 * @param days - The number of days to add
 * @returns The new date
 */
export const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
};

/**
 * Subtract days from a date
 * @param date - The base date
 * @param days - The number of days to subtract
 * @returns The new date
 */
export const subtractDays = (date: Date, days: number): Date => {
  return addDays(date, -days);
}; 