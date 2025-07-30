'use client';

import React, { useState, useEffect } from 'react';
import { TimezoneSelector } from './TimezoneSelector';
import { BackgroundSelector } from './BackgroundSelector';
import { getUserTimezone } from '@/lib/timezone';
import { profileService } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsPageProps {
  onClose: () => void;
  onSettingsChange?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose, onSettingsChange }) => {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [backgroundImage, setBackgroundImage] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const profile = await profileService.getUserProfile(user.id);
      if (profile) {
        setTimezone(profile.timezone);
        setBackgroundImage(profile.backgroundImage || 'default');
      } else {
        // Set default timezone if no profile exists
        setTimezone(getUserTimezone());
        setBackgroundImage('default');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    if (!user) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Get current profile or create default one
      let profile = await profileService.getUserProfile(user.id);
      
      if (!profile) {
        // Create new profile with default schedule
        const defaultSchedule = {
          monday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          tuesday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          wednesday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          thursday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          friday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          saturday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          sunday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } }
        };
        
        await profileService.upsertUserProfile(user.id, defaultSchedule);
        profile = await profileService.getUserProfile(user.id);
      }

      // Update timezone in database
      await profileService.updateUserProfile(user.id, {
        ...profile!.schedule,
        timezone: newTimezone,
        backgroundImage: profile!.backgroundImage
      });

      setTimezone(newTimezone);
      setMessage({ type: 'success', text: 'Timezone updated successfully!' });
      onSettingsChange?.();
    } catch (error) {
      console.error('Error updating timezone:', error);
      setMessage({ type: 'error', text: 'Failed to update timezone' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackgroundChange = async (newBackground: string) => {
    if (!user) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Get current profile or create default one
      let profile = await profileService.getUserProfile(user.id);
      
      if (!profile) {
        // Create new profile with default schedule
        const defaultSchedule = {
          monday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          tuesday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          wednesday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          thursday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          friday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          saturday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } },
          sunday: { workHours: [], sleepHours: { start: '22:00', end: '06:00' } }
        };
        
        await profileService.upsertUserProfile(user.id, defaultSchedule);
        profile = await profileService.getUserProfile(user.id);
      }

      console.log('Saving background to database:', newBackground);
      
      // Update background in database
      await profileService.updateUserProfile(user.id, {
        ...profile!.schedule,
        timezone: profile!.timezone,
        backgroundImage: newBackground
      });
      
      console.log('Background saved successfully');

      setBackgroundImage(newBackground);
      setMessage({ type: 'success', text: 'Background updated successfully!' });
      onSettingsChange?.();
    } catch (error) {
      console.error('Error updating background:', error);
      setMessage({ type: 'error', text: 'Failed to update background' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-8">
          {/* Timezone Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Timezone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose your timezone to ensure all dates and times are displayed correctly.
            </p>
            
            <TimezoneSelector
              currentTimezone={timezone}
              onTimezoneChange={handleTimezoneChange}
              className="w-full"
            />
            
            {isLoading && (
              <div className="mt-2 text-sm text-blue-600">
                Updating timezone...
              </div>
            )}
          </div>

          {/* Background Section */}
          <div>
            <BackgroundSelector
              selectedBackground={backgroundImage}
              onBackgroundChange={handleBackgroundChange}
            />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Current Time Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Time</h4>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleString('en-US', { 
                timeZone: timezone,
                timeZoneName: 'short'
              })}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 