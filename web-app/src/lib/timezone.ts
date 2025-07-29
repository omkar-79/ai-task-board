/**
 * Timezone utilities for the task management app
 */

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
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return convertToTimezone(date, timezone);
  } else {
    const date = new Date(year, month - 1, day, 0, 0, 0, 0);
    return convertToTimezone(date, timezone);
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
    const [datePart, timePart] = timeString.split(', ');
    const [month, day, year] = datePart.split('/');
    const [time, period] = timePart.split(' ');
    const [hours, minutes, seconds] = time.split(':');
    
    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    // Create date in the target timezone
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hour, parseInt(minutes), parseInt(seconds));
    
    return targetDate;
  } catch (error) {
    console.warn(`Could not get current time in timezone ${timezone}:`, error);
    return new Date(); // Fallback to local time
  }
};

/**
 * Format a date for display in a specific timezone
 * @param date - The date to format
 * @param timezone - The timezone to format in
 * @param format - The format to use ('date', 'time', 'datetime')
 * @returns Formatted date string
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
        options.month = '2-digit';
        options.day = '2-digit';
        break;
      case 'time':
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
      case 'datetime':
        options.year = 'numeric';
        options.month = '2-digit';
        options.day = '2-digit';
        options.hour = '2-digit';
        options.minute = '2-digit';
        break;
    }

    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.warn(`Could not format date in timezone ${timezone}:`, error);
    return date.toLocaleString();
  }
};

/**
 * Check if a date is today in a specific timezone
 * @param date - The date to check
 * @param timezone - The timezone to check in
 * @returns True if the date is today in the timezone
 */
export const isTodayInTimezone = (date: Date, timezone: string): boolean => {
  const today = getCurrentDateTimeInTimezone(timezone);
  const dateInTimezone = convertToTimezone(date, timezone);
  
  return (
    dateInTimezone.getFullYear() === today.getFullYear() &&
    dateInTimezone.getMonth() === today.getMonth() &&
    dateInTimezone.getDate() === today.getDate()
  );
};

/**
 * Check if a date is overdue in a specific timezone
 * @param date - The date to check
 * @param timezone - The timezone to check in
 * @returns True if the date is overdue in the timezone
 */
export const isOverdueInTimezone = (date: Date, timezone: string): boolean => {
  const now = getCurrentDateTimeInTimezone(timezone);
  const dateInTimezone = convertToTimezone(date, timezone);
  return dateInTimezone < now;
};

/**
 * Get timezone display name
 * @param timezone - The timezone identifier
 * @returns The display name for the timezone
 */
export const getTimezoneDisplayName = (timezone: string): string => {
  const option = TIMEZONE_OPTIONS.find(opt => opt.value === timezone);
  return option ? option.label : timezone;
};

/**
 * Validate if a timezone is supported
 * @param timezone - The timezone to validate
 * @returns True if the timezone is supported
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch (error) {
    return false;
  }
}; 