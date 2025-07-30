'use client';

import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { taskService } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ProfilePage() {
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const loadCompletedTasks = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const allTasks = await taskService.getTasks(user.id);
        const completed = allTasks.filter(task => task.status === 'completed');
        setCompletedTasks(completed);
      } catch (err) {
        console.error('Error loading completed tasks:', err);
        setError('Failed to load completed tasks');
      } finally {
        setLoading(false);
      }
    };

    loadCompletedTasks();
  }, [user]);

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const getTaskDisplayInfo = (task: Task) => {
    if (task.scheduledDate && task.scheduledTime) {
      const scheduledDate = new Date(task.scheduledDate + 'T' + task.scheduledTime);
      return {
        type: 'Scheduled',
        date: formatDate(scheduledDate),
        time: formatTime(scheduledDate)
      };
    } else if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      return {
        type: 'Deadline',
        date: formatDate(deadlineDate),
        time: formatTime(deadlineDate)
      };
    }
    return null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLabelColor = (label: string) => {
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading completed tasks...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link 
                href="/"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Profile & Analytics</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user.email}
              </span>
              <button
                onClick={signOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Stats Section */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Completed</h3>
            <p className="text-4xl font-bold text-blue-600">{completedTasks.length}</p>
            <p className="text-sm text-gray-600 mt-2">All time completed tasks</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">This Week</h3>
            <p className="text-4xl font-bold text-green-600">
              {completedTasks.filter(task => {
                const completedDate = task.completedAt;
                if (!completedDate) return false;
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return completedDate >= weekAgo;
              }).length}
            </p>
            <p className="text-sm text-gray-600 mt-2">Tasks completed in last 7 days</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">This Month</h3>
            <p className="text-4xl font-bold text-purple-600">
              {completedTasks.filter(task => {
                const completedDate = task.completedAt;
                if (!completedDate) return false;
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return completedDate >= monthAgo;
              }).length}
            </p>
            <p className="text-sm text-gray-600 mt-2">Tasks completed in last 30 days</p>
          </div>
        </div>

        {/* Future Analytics Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Productivity Analytics</h2>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-800">
              <strong>Coming Soon:</strong> Advanced productivity charts, time tracking analytics, 
              and performance insights will be available here. We're working on comprehensive 
              analytics to help you understand your productivity patterns.
            </p>
          </div>
        </div>

        {/* Completed Tasks Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Completed Tasks</h2>
            <p className="text-gray-600 text-sm mt-1">
              All your completed tasks, sorted by completion date
            </p>
          </div>

          <div className="p-6">
            {completedTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">✅</div>
                <p className="text-gray-600 text-lg mb-2">No completed tasks yet</p>
                <p className="text-gray-500 text-sm">Complete some tasks to see them here!</p>
                <Link 
                  href="/"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {completedTasks
                  .sort((a, b) => {
                    // Sort by completion date, newest first
                    const dateA = a.completedAt || new Date(0);
                    const dateB = b.completedAt || new Date(0);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .map((task) => {
                    const displayInfo = getTaskDisplayInfo(task);
                    
                    return (
                      <div 
                        key={task.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h3 className="font-semibold text-gray-800 line-through">
                                {task.title}
                              </h3>
                              <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                            </div>
                            
                            {task.description && (
                              <p className="text-gray-600 text-sm mb-3 line-through">
                                {task.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-3">
                              {/* Priority Tag */}
                              <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${getPriorityColor(task.priority || 'medium')}`}>
                                {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
                              </span>
                              
                              {/* Label Tag */}
                              <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full border ${getLabelColor(task.label || 'general')}`}>
                                {(task.label || 'general') === 'custom' ? (task.customLabel || 'Custom') : (task.label || 'general').charAt(0).toUpperCase() + (task.label || 'general').slice(1)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              {task.duration && (
                                <div className="flex items-center gap-1">
                                  <span>⏱</span>
                                  <span>
                                    {task.duration >= 60 
                                      ? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`
                                      : `${task.duration}min`
                                    }
                                  </span>
                                </div>
                              )}

                              {displayInfo && (
                                <div className="flex items-center gap-1">
                                  <span>📅</span>
                                  <span>{displayInfo.type}: {displayInfo.date} at {displayInfo.time}</span>
                                </div>
                              )}

                              {task.completedAt && (
                                <div className="flex items-center gap-1">
                                  <span>✅</span>
                                  <span>Completed: {formatDate(task.completedAt)} at {formatTime(task.completedAt)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 