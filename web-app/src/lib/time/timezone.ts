/**
 * Timezone utilities for the task management app
 */

import { fromZonedTime } from 'date-fns-tz';

// Common timezone options
export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  { value: 'Pacific/Auckland', label: 'New Zealand Standard Time (NZST)' },
];

/**
 * Get the user's current timezone
 * @returns The user's timezone identifier (e.g., 'America/New_York')
 */
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('Could not detect user timezone, falling back to EST:', error);
    return 'America/New_York';
  }
};

/**
 * Get the timezone offset in minutes for a given timezone
 * @param timezone - The timezone identifier
 * @returns The offset in minutes from UTC
 */
export const getTimezoneOffset = (timezone: string): number => {
  try {
    const date = new Date();
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return (targetDate.getTime() - utc) / 60000;
  } catch (error) {
    console.warn(`Could not get offset for timezone ${timezone}, falling back to EST:`, error);
    return -300; // EST offset
  }
};

/**
 * Convert a date to a specific timezone
 * @param date - The date to convert
 * @param timezone - The target timezone
 * @returns The date in the target timezone
 */
export const convertToTimezone = (date: Date, timezone: string): Date => {
  try {
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const targetOffset = getTimezoneOffset(timezone);
    return new Date(utc + (targetOffset * 60000));
  } catch (error) {
    console.warn(`Could not convert date to timezone ${timezone}:`, error);
    return date;
  }
};

/**
 * Create a date in a specific timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @param timeString - Time string in HH:MM format (optional)
 * @param timezone - The timezone to create the date in
 * @returns The date in the specified timezone
 */
export const createDateInTimezone = (dateString: string, timeString?: string, timezone: string = 'America/New_York'): Date => {
  if (timeString) {
    // Create an ISO string and use fromZonedTime for proper timezone handling
    const isoString = `${dateString}T${timeString}:00`;
    return fromZonedTime(isoString, timezone);
  } else {
    // For date-only, create at start of day in the specified timezone
    const isoString = `${dateString}T00:00:00`;
    return fromZonedTime(isoString, timezone);
  }
};

/**
 * Get current date and time in a specific timezone
 * @param timezone - The timezone to get current time in
 * @returns The current date/time in the specified timezone
 */
export const getCurrentDateTimeInTimezone = (timezone: string): Date => {
  try {
    // Get current time in the specified timezone
    const now = new Date();
    const timeString = now.toLocaleString('en-US', { timeZone: timezone });
    
    // Parse the time string to get the current time in that timezone
    const parts = timeString.split(', ');
    if (parts.length >= 2) {
      const datePart = parts[0];
      const timePart = parts[1];
      
      // Parse the date part (MM/DD/YYYY)
      const dateParts = datePart.split('/');
      const month = parseInt(dateParts[0]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      // Parse the time part (HH:MM:SS AM/PM)
      const timeParts = timePart.split(' ');
      const timeComponents = timeParts[0].split(':');
      let hours = parseInt(timeComponents[0]);
      const minutes = parseInt(timeComponents[1]);
      const seconds = parseInt(timeComponents[2] || '0');
      const period = timeParts[1];
      
      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return new Date(year, month, day, hours, minutes, seconds);
    }
    
    // Fallback to current time
    return new Date();
  } catch (error) {
    console.warn(`Could not get current time in timezone ${timezone}:`, error);
    return new Date();
  }
};

/**
 * Format a date in a specific timezone
 * @param date - The date to format
 * @param timezone - The timezone to format in
 * @param format - The format type
 * @returns The formatted date string
 */
export const formatDateInTimezone = (
  date: Date, 
  timezone: string, 
  format: 'date' | 'time' | 'datetime' = 'datetime'
): string => {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
    };
    
    switch (format) {
      case 'date':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        break;
      case 'time':
        options.hour = 'numeric';
        options.minute = '2-digit';
        options.hour12 = true;
        break;
      case 'datetime':
        options.year = 'numeric';
        options.month = 'short';
        options.day = 'numeric';
        options.hour = 'numeric';
        options.minute = '2-digit';
        options.hour12 = true;
        break;
    }
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.warn(`Could not format date in timezone ${timezone}:`, error);
    return date.toLocaleString();
  }
};

/**
 * Check if a date is today in a specific timezone
 * @param date - The date to check
 * @param timezone - The timezone to check in
 * @returns True if the date is today
 */
export const isTodayInTimezone = (date: Date, timezone: string): boolean => {
  const today = getCurrentDateTimeInTimezone(timezone);
  return date.toDateString() === today.toDateString();
};

/**
 * Check if a date is overdue in a specific timezone
 * @param date - The date to check
 * @param timezone - The timezone to check in
 * @returns True if the date is overdue
 */
export const isOverdueInTimezone = (date: Date, timezone: string): boolean => {
  const now = getCurrentDateTimeInTimezone(timezone);
  return date < now;
};

/**
 * Get the display name for a timezone
 * @param timezone - The timezone identifier
 * @returns The display name
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'long'
    });
    return formatter.formatToParts(new Date())
      .find(part => part.type === 'timeZoneName')?.value || timezone;
  } catch (error) {
    return timezone;
  }
};

/**
 * Check if a timezone is valid
 * @param timezone - The timezone identifier
 * @returns True if the timezone is valid
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}; 