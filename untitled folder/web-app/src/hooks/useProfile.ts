import { useState, useEffect, useCallback } from 'react';
import { UserProfile, DaySchedule, TimeBlock } from '../lib/types';
import { 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  getDefaultUserProfile,
  validateTimeBlock,
  getWeekDays 
} from '../lib/utils';

const PROFILE_STORAGE_KEY = 'ai-task-board-profile';

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile>(getDefaultUserProfile());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = loadFromLocalStorage<UserProfile>(PROFILE_STORAGE_KEY, getDefaultUserProfile());
    setProfile(savedProfile);
    setLoading(false);
  }, []);

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      saveToLocalStorage(PROFILE_STORAGE_KEY, profile);
    }
  }, [profile, loading]);

  // Update entire profile
  const updateProfile = useCallback((newProfile: UserProfile) => {
    try {
      setError(null);
      setProfile(newProfile);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  }, []);

  // Update schedule for a specific day
  const updateDaySchedule = useCallback((day: string, schedule: DaySchedule) => {
    try {
      setError(null);
      
      // Validate time blocks
      const validationErrors: string[] = [];
      
      // Validate work hours
      schedule.workHours.forEach((block, index) => {
        if (!validateTimeBlock(block)) {
          validationErrors.push(`Work hour block ${index + 1} has invalid time range`);
        }
      });
      
      // Validate sleep hours
      if (!validateTimeBlock(schedule.sleepHours)) {
        validationErrors.push('Sleep hours have invalid time range');
      }
      
      // Validate free time
      schedule.freeTime.forEach((block, index) => {
        if (!validateTimeBlock(block)) {
          validationErrors.push(`Free time block ${index + 1} has invalid time range`);
        }
      });
      
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return false;
      }
      
      setProfile(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: schedule
        }
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update day schedule');
      return false;
    }
  }, []);

  // Add work hour block to a day
  const addWorkHourBlock = useCallback((day: string, timeBlock: TimeBlock) => {
    try {
      setError(null);
      
      if (!validateTimeBlock(timeBlock)) {
        setError('Invalid time range for work hours');
        return false;
      }
      
      setProfile(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            workHours: [...prev.schedule[day].workHours, timeBlock]
          }
        }
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add work hour block');
      return false;
    }
  }, []);

  // Remove work hour block from a day
  const removeWorkHourBlock = useCallback((day: string, index: number) => {
    try {
      setError(null);
      
      setProfile(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            workHours: prev.schedule[day].workHours.filter((_, i) => i !== index)
          }
        }
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove work hour block');
      return false;
    }
  }, []);

  // Update sleep hours for a day
  const updateSleepHours = useCallback((day: string, timeBlock: TimeBlock) => {
    try {
      setError(null);
      
      if (!validateTimeBlock(timeBlock)) {
        setError('Invalid time range for sleep hours');
        return false;
      }
      
      setProfile(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            sleepHours: timeBlock
          }
        }
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sleep hours');
      return false;
    }
  }, []);

  // Add free time block to a day
  const addFreeTimeBlock = useCallback((day: string, timeBlock: TimeBlock) => {
    try {
      setError(null);
      
      if (!validateTimeBlock(timeBlock)) {
        setError('Invalid time range for free time');
        return false;
      }
      
      setProfile(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            freeTime: [...prev.schedule[day].freeTime, timeBlock]
          }
        }
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add free time block');
      return false;
    }
  }, []);

  // Remove free time block from a day
  const removeFreeTimeBlock = useCallback((day: string, index: number) => {
    try {
      setError(null);
      
      setProfile(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [day]: {
            ...prev.schedule[day],
            freeTime: prev.schedule[day].freeTime.filter((_, i) => i !== index)
          }
        }
      }));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove free time block');
      return false;
    }
  }, []);

  // Get schedule for a specific day
  const getDaySchedule = useCallback((day: string): DaySchedule | null => {
    return profile.schedule[day] || null;
  }, [profile.schedule]);

  // Get all week days
  const getWeekDays = useCallback(() => {
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  }, []);

  // Reset profile to default
  const resetToDefault = useCallback(() => {
    setProfile(getDefaultUserProfile());
  }, []);

  // Calculate total free time for a day
  const getTotalFreeTimeForDay = useCallback((day: string): number => {
    const daySchedule = profile.schedule[day];
    if (!daySchedule) return 0;
    
    return daySchedule.freeTime.reduce((total, block) => {
      const startMinutes = parseInt(block.start.split(':')[0]) * 60 + parseInt(block.start.split(':')[1]);
      const endMinutes = parseInt(block.end.split(':')[0]) * 60 + parseInt(block.end.split(':')[1]);
      return total + (endMinutes - startMinutes);
    }, 0);
  }, [profile.schedule]);

  // Calculate total work time for a day
  const getTotalWorkTimeForDay = useCallback((day: string): number => {
    const daySchedule = profile.schedule[day];
    if (!daySchedule) return 0;
    
    return daySchedule.workHours.reduce((total, block) => {
      const startMinutes = parseInt(block.start.split(':')[0]) * 60 + parseInt(block.start.split(':')[1]);
      const endMinutes = parseInt(block.end.split(':')[0]) * 60 + parseInt(block.end.split(':')[1]);
      return total + (endMinutes - startMinutes);
    }, 0);
  }, [profile.schedule]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateDaySchedule,
    addWorkHourBlock,
    removeWorkHourBlock,
    updateSleepHours,
    addFreeTimeBlock,
    removeFreeTimeBlock,
    getDaySchedule,
    getWeekDays,
    resetToDefault,
    getTotalFreeTimeForDay,
    getTotalWorkTimeForDay
  };
}; 