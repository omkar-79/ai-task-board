'use client';

import React, { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/KanbanBoard';
import { useTasks } from '@/hooks/useTasks';
import { Providers } from '@/components/Providers';
import { useAuth } from '@/contexts/AuthContext';
import { AuthContainer } from '@/components/auth/AuthContainer';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { BigFrogInfo } from '@/components/KanbanBoard/BigFrogInfo';
import { MovementDebug } from '@/components/KanbanBoard/MovementDebug';
import { profileService } from '@/lib/database';
import { getUserTimezone } from '@/lib/time';
import { getBigFrogTasks } from '@/lib/bigFrog';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [userTimezone, setUserTimezone] = useState<string>('America/New_York');
  const [backgroundImage, setBackgroundImage] = useState<string>('default');
  const [showSettings, setShowSettings] = useState(false);
  const [settingsKey, setSettingsKey] = useState(0); // Force re-render when settings change
  
  const { 
    columns, 
    addTask, 
    updateTask, 
    deleteTask, 
    moveTask, 
    loading: tasksLoading, 
    error,
    tasks
  } = useTasks(userTimezone);

  // Load user settings on mount and when settings change
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user, settingsKey]);

  // Debug background changes
  useEffect(() => {
    console.log('Background changed to:', backgroundImage);
  }, [backgroundImage]);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      const profile = await profileService.getUserProfile(user.id);
      if (profile) {
        setUserTimezone(profile.timezone);
        const newBackground = profile.backgroundImage || 'default';
        console.log('Loading background:', newBackground);
        setBackgroundImage(newBackground);
      } else {
        // Set default timezone if no profile exists
        setUserTimezone(getUserTimezone());
        setBackgroundImage('default');
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
      setUserTimezone(getUserTimezone());
      setBackgroundImage('default');
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth forms if user is not authenticated
  if (!user) {
    return <AuthContainer />;
  }

  // Show loading while tasks are loading
  if (tasksLoading) {
    return (
      <div className="w-full py-8">
        <h1 className="text-xl mb-6 text-center">
          Loading your tasks...
        </h1>
      </div>
    );
  }

  return (
    <Providers>
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: backgroundImage !== 'default' ? `url(/images/background/${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          backgroundColor: backgroundImage === 'default' ? '#f9fafb' : undefined
        }}
      >
        <div className="w-full py-4 sm:py-6 px-2 sm:px-4">
          {/* Header with user info and logout */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
                Hoply
              </h1>

            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <Link
                href="/profile"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                👤 Profile
              </Link>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 mb-6 rounded-md border border-red-200">
              <p className="text-red-700 font-semibold">Error: {error}</p>
            </div>
          )}


          <KanbanBoard
            columns={columns}
            onTaskMove={moveTask}
            onTaskUpdate={updateTask}
            onTaskDelete={deleteTask}
            onAddTask={addTask}
            userTimezone={userTimezone}
          />
          
          {/* Debug component for movement system */}
          <MovementDebug tasks={tasks} userTimezone={userTimezone} />

          {showSettings && (
            <SettingsPage 
              onClose={() => setShowSettings(false)}
              onSettingsChange={() => setSettingsKey(prev => prev + 1)}
          />
          )}

          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-sm sm:text-md font-semibold mb-3 sm:mb-4">
              🚀 Getting Started
            </h2>
            <p className="mb-3 sm:mb-4 text-sm sm:text-base">
              Welcome to your AI-powered task management board! Here's what you can do:
            </p>
            <ul className="pl-4 sm:pl-6 text-gray-700 list-disc text-sm sm:text-base">
              <li className="mb-2">📋 <strong>Drag & Drop:</strong> Move tasks between columns to organize your workflow</li>
              <li className="mb-2">🔍 <strong>Smart Categories:</strong> Tasks are automatically categorized based on deadlines and importance</li>
              <li className="mb-2">⚡ <strong>Quick Actions:</strong> Click the + button to expand task details, × to delete</li>
              <li className="mb-2">🤖 <strong>AI Integration:</strong> Set up your Gemini API key for intelligent task suggestions</li>
              <li className="mb-2">📅 <strong>Time Management:</strong> Set up your schedule to get personalized task recommendations</li>
            </ul>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Next Steps:</strong> Add your Gemini API key in the environment variables (NEXT_PUBLIC_GEMINI_API_KEY) 
              to enable AI-powered task categorization and smart suggestions based on your free time.
            </p>
          </div>
        </div>
    </div>
    </Providers>
  );
}
