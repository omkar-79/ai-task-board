/**
 * Time utility functions for the task management app
 */

/**
 * Format time for display
 * @param date - The date containing the time
 * @param format - The format type
 * @returns The formatted time string
 */
export const formatTime = (date: Date, format: '12hour' | '24hour' = '12hour'): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
  };
  
  if (format === '12hour') {
    options.hour12 = true;
  } else {
    options.hour12 = false;
  }
  
  return date.toLocaleTimeString('en-US', options);
};

/**
 * Convert minutes to hours and minutes
 * @param minutes - Total minutes
 * @returns Object with hours and minutes
 */
export const minutesToHoursAndMinutes = (minutes: number): { hours: number; minutes: number } => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return { hours, minutes: remainingMinutes };
};

/**
 * Convert hours and minutes to total minutes
 * @param hours - Hours
 * @param minutes - Minutes
 * @returns Total minutes
 */
export const hoursAndMinutesToMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

/**
 * Format duration for display
 * @param minutes - Total minutes
 * @returns Formatted duration string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0m';
  
  const { hours, minutes: remainingMinutes } = minutesToHoursAndMinutes(minutes);
  
  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${remainingMinutes}m`;
  }
};

/**
 * Parse time string to hours and minutes
 * @param timeString - Time string in HH:MM format
 * @returns Object with hours and minutes
 */
export const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Format time string from hours and minutes
 * @param hours - Hours
 * @param minutes - Minutes
 * @returns Time string in HH:MM format
 */
export const formatTimeString = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Get time difference between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Time difference in minutes
 */
export const getTimeDifference = (date1: Date, date2: Date): number => {
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60));
};

/**
 * Check if a time is in the morning (6 AM - 12 PM)
 * @param date - The date containing the time
 * @returns True if the time is in the morning
 */
export const isMorning = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 6 && hours < 12;
};

/**
 * Check if a time is in the afternoon (12 PM - 6 PM)
 * @param date - The date containing the time
 * @returns True if the time is in the afternoon
 */
export const isAfternoon = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 12 && hours < 18;
};

/**
 * Check if a time is in the evening (6 PM - 12 AM)
 * @param date - The date containing the time
 * @returns True if the time is in the evening
 */
export const isEvening = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 18 && hours < 24;
};

/**
 * Check if a time is at night (12 AM - 6 AM)
 * @param date - The date containing the time
 * @returns True if the time is at night
 */
export const isNight = (date: Date): boolean => {
  const hours = date.getHours();
  return hours >= 0 && hours < 6;
};

/**
 * Get the time period of day
 * @param date - The date containing the time
 * @returns The time period ('morning', 'afternoon', 'evening', 'night')
 */
export const getTimePeriod = (date: Date): 'morning' | 'afternoon' | 'evening' | 'night' => {
  if (isMorning(date)) return 'morning';
  if (isAfternoon(date)) return 'afternoon';
  if (isEvening(date)) return 'evening';
  return 'night';
}; 