'use client';

import React from 'react';
// Using basic HTML until Chakra UI v3 is properly configured
import { KanbanBoard } from '@/components/KanbanBoard';
import { useTasks } from '@/hooks/useTasks';
import { Providers } from '@/components/Providers';

export default function Dashboard() {
  const { 
    columns, 
    addTask, 
    updateTask, 
    deleteTask, 
    moveTask, 
    loading, 
    error 
  } = useTasks();

  // Sample task for testing
  React.useEffect(() => {
    // Add some sample tasks on first load if no tasks exist
    const hasExistingTasks = columns.some(col => col.tasks.length > 0);
    if (!loading && !hasExistingTasks) {
      addTask({
        title: 'Welcome to AI Task Board!',
        description: 'This is a sample task. You can drag it between columns, edit it, or delete it.',
        duration: 15,
        type: 'regular',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        column: 'Today'
      });

      addTask({
        title: 'Setup Gemini API',
        description: 'Configure the Google Gemini API for AI-powered task categorization and suggestions.',
        duration: 30,
        type: 'important',
        column: 'Important'
      });

      addTask({
        title: 'Review task management workflow',
        description: 'Analyze current productivity and optimize task organization strategies.',
        duration: 45,
        type: 'regular',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        column: 'This Week'
      });
    }
  }, [loading, columns, addTask]);

  if (loading) {
    return (
      <div className="w-full py-8">
        <h1 className="text-xl mb-6 text-center">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <Providers>
      <div className="min-h-screen bg-gray-50">
        <div className="w-full py-6 px-4">
          {error && (
            <div className="bg-red-50 p-4 mb-6 rounded-md border border-red-200">
              <p className="text-red-700 font-semibold">Error: {error}</p>
            </div>
          )}

          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4 text-gray-800">
              AI Task Board
            </h1>
            <p className="text-lg text-gray-600">
              Smart personal task management with AI-powered categorization
            </p>
          </div>

          <KanbanBoard
            columns={columns}
            onTaskMove={moveTask}
            onTaskUpdate={updateTask}
            onTaskDelete={deleteTask}
          />

          <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
            <h2 className="text-md font-semibold mb-4">
              🚀 Getting Started
            </h2>
            <p className="mb-4">
              Welcome to your AI-powered task management board! Here's what you can do:
            </p>
            <ul className="pl-6 text-gray-700 list-disc">
              <li className="mb-2">📋 <strong>Drag & Drop:</strong> Move tasks between columns to organize your workflow</li>
              <li className="mb-2">🔍 <strong>Smart Categories:</strong> Tasks are automatically categorized based on deadlines and importance</li>
              <li className="mb-2">⚡ <strong>Quick Actions:</strong> Click the + button to expand task details, × to delete</li>
              <li className="mb-2">🤖 <strong>AI Integration:</strong> Set up your Gemini API key for intelligent task suggestions</li>
              <li className="mb-2">📅 <strong>Time Management:</strong> Set up your schedule to get personalized task recommendations</li>
            </ul>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>Next Steps:</strong> Add your Gemini API key in the environment variables (NEXT_PUBLIC_GEMINI_API_KEY) 
              to enable AI-powered task categorization and smart suggestions based on your free time.
            </p>
          </div>
        </div>
      </div>
    </Providers>
  );
}
