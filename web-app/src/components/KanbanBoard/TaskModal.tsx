'use client';

import React, { useState, useEffect } from 'react';
import { Task, ColumnId, TaskStatus, TaskPriority, TaskLabel } from '@/lib/types';
import { format } from 'date-fns';
import { convertToTimezone, createUserDateTime, createUserDate } from '@/lib/time';
import { toZonedTime } from 'date-fns-tz';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  userTimezone?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  userTimezone
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 0,
    hours: 0,
    minutes: 0,
    priority: 'medium' as TaskPriority,
    label: 'general' as TaskLabel,
    customLabel: '',
    status: 'not_complete' as TaskStatus,
    deadline: '',
    deadlineTime: '',
    scheduledDate: '',
    scheduledTime: '',
    recurrence: 'once' as 'once' | 'everyday' | 'everyweek',
    recurrenceDay: '',
    recurrenceTime: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (task) {
      const hours = Math.floor((task.duration || 0) / 60);
      const minutes = (task.duration || 0) % 60;
      
      setFormData({
        title: task.title,
        description: task.description || '',
        duration: task.duration || 0,
        hours,
        minutes,
        priority: task.priority || 'medium',
        label: task.label || 'general',
        customLabel: task.customLabel || '',
        status: task.status || 'not_complete',
        deadline: task.deadline ? format(toZonedTime(new Date(task.deadline), userTimezone || 'America/New_York'), 'yyyy-MM-dd') : '',
        deadlineTime: task.deadline ? format(toZonedTime(new Date(task.deadline), userTimezone || 'America/New_York'), 'HH:mm') : '',
        scheduledDate: task.scheduledDate || '',
        scheduledTime: task.scheduledTime ? format(toZonedTime(task.scheduledTime, userTimezone || 'America/New_York'), 'HH:mm') : '',
        recurrence: task.recurrence || 'once',
        recurrenceDay: task.recurrenceDay || '',
        recurrenceTime: task.recurrenceTimeUTC ? format(toZonedTime(new Date(task.recurrenceTimeUTC), userTimezone || 'America/New_York'), 'HH:mm') : ''
      });
    }
  }, [task]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !task) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    
    try {
      const totalMinutes = (formData.hours * 60) + formData.minutes;
      
      // Create deadline date if both date and time are provided
      let deadline: Date | undefined = undefined;
      if (formData.deadline && formData.deadlineTime) {
        // Use timezone-aware date creation to ensure correct timezone handling
        deadline = createUserDateTime(formData.deadline, formData.deadlineTime, userTimezone || 'America/New_York');
      } else if (formData.deadline) {
        deadline = createUserDate(formData.deadline, userTimezone || 'America/New_York');
      }

      const updates: Partial<Task> = {
        title: formData.title,
        description: formData.description,
        duration: totalMinutes > 0 ? totalMinutes : undefined,
        priority: formData.priority,
        label: formData.label,
        customLabel: formData.label === 'custom' ? formData.customLabel : undefined,
        status: formData.status,
        deadline,
        scheduledDate: formData.scheduledDate || undefined,
        scheduledTime: formData.scheduledTime ? createUserDateTime(formData.scheduledDate || '2000-01-01', formData.scheduledTime, userTimezone || 'America/New_York') : undefined,
        recurrence: formData.recurrence,
        recurrenceDay: formData.recurrenceDay || undefined,
        recurrenceTimeUTC: formData.recurrenceTime ? new Date(`2000-01-01T${formData.recurrenceTime}:00`).toISOString() : undefined
      };

      await onUpdate(task.id, updates);
      
      onClose();
    } catch (error) {
      console.error('TaskModal: Error updating task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const isCompleted = task.status === 'completed';
  const isOverdue = task.deadline && toZonedTime(new Date(task.deadline), userTimezone || 'America/New_York') < new Date();

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)'
      } as React.CSSProperties}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full mx-4 transform transition-all duration-300 scale-100"
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          maxWidth: '60vw',
          maxHeight: '85vh'
        }}
        onClick={(e) => {
          e.preventDefault();
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-1">Edit Task</h2>
            <p className="text-xs text-gray-600">Update task details and settings</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200 text-lg md:text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4" id="task-modal-form">
            {/* Desktop Layout - Two Columns */}
            <div className="hidden md:grid md:grid-cols-5 md:gap-6">
              {/* Left Column */}
              <div className="col-span-3 space-y-3 md:space-y-4">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Enter task title"
                    required
                    minLength={1}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                    placeholder="Add task description..."
                    rows={3}
                  />
                </div>

                {/* Priority and Label */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Label
                    </label>
                    <select
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value as TaskLabel })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    >
                      <option value="general">General</option>
                      <option value="work">Work</option>
                      <option value="study">Study</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Custom Label */}
                {formData.label === 'custom' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Custom Label
                    </label>
                    <input
                      type="text"
                      value={formData.customLabel}
                      onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Enter custom label"
                    />
                  </div>
                )}

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Duration (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Hours</label>
                      <input
                        type="number"
                        value={formData.hours || 0}
                        onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        min="0"
                        max="24"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Minutes</label>
                      <input
                        type="number"
                        value={formData.minutes || 0}
                        onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        min="0"
                        max="59"
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg">
                    Total: {formData.hours || 0}h {formData.minutes || 0}m ({(formData.hours || 0) * 60 + (formData.minutes || 0)} minutes)
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-2 space-y-3 md:space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="not_complete">Not Complete</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Recurrence */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Recurrence
                  </label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as 'once' | 'everyday' | 'everyweek' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="once">Once</option>
                    <option value="everyday">Every Day</option>
                    <option value="everyweek">Every Week</option>
                  </select>
                </div>

                {/* Recurrence Day (for weekly) */}
                {formData.recurrence === 'everyweek' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Day of Week
                    </label>
                    <select
                      value={formData.recurrenceDay}
                      onChange={(e) => setFormData({ ...formData, recurrenceDay: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    >
                      <option value="">Select day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                )}

                {/* Recurrence Time */}
                {(formData.recurrence === 'everyday' || formData.recurrence === 'everyweek') && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formData.recurrenceTime}
                      onChange={(e) => setFormData({ ...formData, recurrenceTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      required
                    />
                  </div>
                )}

                {/* Scheduled Date and Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                </div>

                {formData.scheduledDate && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Scheduled Time
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                )}

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                </div>

                {formData.deadline && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Deadline Time
                    </label>
                    <input
                      type="time"
                      value={formData.deadlineTime}
                      onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter task title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                  placeholder="Add task description..."
                  rows={3}
                />
              </div>

              {/* Priority and Label */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Label
                  </label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value as TaskLabel })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                >
                  <option value="not_complete">Not Complete</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Task Information Display */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Task Information</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{task.createdAt ? formatDate(new Date(task.createdAt)) : 'N/A'}</span>
                </div>
                {task.scheduledDate && (
                  <div className="flex justify-between">
                    <span>Scheduled:</span>
                    <span>
                      {task.scheduledDate}
                      {task.scheduledTime && ` at ${formatTime(toZonedTime(task.scheduledTime, userTimezone || 'America/New_York'))}`}
                    </span>
                  </div>
                )}
                {task.deadline && (
                  <div className="flex justify-between">
                    <span>Deadline:</span>
                    <span>{formatDate(toZonedTime(new Date(task.deadline), userTimezone || 'America/New_York'))}</span>
                  </div>
                )}
                {task.duration && (
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>
                      {task.duration >= 60 
                        ? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`
                        : `${task.duration}min`
                      }
                    </span>
                  </div>
                )}
                {isCompleted && task.completedAt && (
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span>{formatDate(new Date(task.completedAt))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  const form = document.getElementById('task-modal-form') as HTMLFormElement;
                  if (form) {
                    form.requestSubmit();
                  }
                }}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 