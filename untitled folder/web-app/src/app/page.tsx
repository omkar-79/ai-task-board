'use client';

import { motion } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { useProfile } from '../hooks/useProfile';

const MotionDiv = motion.div;

export default function Home() {
  const { tasks, loading, error, getColumnsWithTasks, resetToSampleData } = useTasks();
  const { profile } = useProfile();

  const columns = getColumnsWithTasks();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col space-y-8">
          <h1 className="text-3xl font-bold">Loading AI Task Board...</h1>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <MotionDiv
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col space-y-4 items-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Task Board
            </h1>
            <p className="text-lg text-gray-600 text-center">
              Personal task management with AI-powered categorization
            </p>
            <div className="flex space-x-4">
              <button 
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                onClick={() => {
                  resetToSampleData();
                  console.log("Sample data loaded");
                }}
              >
                Load Sample Data
              </button>
            </div>
          </div>
        </MotionDiv>

        {/* Error Display */}
        {error && (
          <MotionDiv
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-md p-4"
          >
            <p className="text-red-600 font-medium">
              Error: {error}
            </p>
          </MotionDiv>
        )}

        {/* Kanban Board Placeholder */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-50 rounded-lg p-8 min-h-[400px]"
        >
          <div className="flex flex-col space-y-6">
            <h2 className="text-xl font-semibold text-gray-700">
              Kanban Board
            </h2>
            <p className="text-gray-600 text-center">
              Your 6-column Kanban board will appear here with:
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              {['Today', 'This Week', 'Important', 'Daily', 'Pending', 'Overdue'].map((column) => (
                <div
                  key={column}
                  className="bg-white p-4 rounded-md border border-gray-200 min-w-[150px] text-center"
                >
                  <p className="font-semibold text-gray-700">
                    {column}
                  </p>
                  <p className="text-sm text-gray-500">
                    {columns.find(col => col.id === column)?.tasks.length || 0} tasks
                  </p>
                </div>
              ))}
            </div>
          </div>
        </MotionDiv>

        {/* Getting Started */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-blue-50 rounded-lg p-6"
        >
          <div className="flex flex-col space-y-4 items-start">
            <h2 className="text-xl font-semibold text-blue-700">
              Getting Started
            </h2>
            <div className="flex flex-col space-y-2 items-start">
              <p className="text-blue-600">
                • Click "Load Sample Data" to see the board in action
              </p>
              <p className="text-blue-600">
                • Add new tasks with the task input form (coming soon)
              </p>
              <p className="text-blue-600">
                • Configure your schedule in the profile section (coming soon)
              </p>
              <p className="text-blue-600">
                • AI will automatically categorize tasks based on deadlines and importance
              </p>
            </div>
          </div>
        </MotionDiv>

        {/* Stats */}
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">
                {tasks.length}
              </p>
              <p className="text-sm text-gray-600">
                Total Tasks
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {tasks.filter(t => t.completedAt).length}
              </p>
              <p className="text-sm text-gray-600">
                Completed
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">
                {tasks.filter(t => t.type === 'important').length}
              </p>
              <p className="text-sm text-gray-600">
                Important
              </p>
            </div>
          </div>
        </MotionDiv>
      </div>
    </div>
  );
}
