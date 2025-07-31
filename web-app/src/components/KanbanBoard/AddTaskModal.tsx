'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskLabel, TaskRecurrence, ColumnId } from '@/lib/types';
import { determineTaskColumn, createUserDateTime, createUserDate } from '@/lib/utils';
import { fromZonedTime } from 'date-fns-tz';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  userTimezone?: string;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  userTimezone
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    hours: 0,
    minutes: 0,
    priority: 'medium' as TaskPriority,
    label: 'general' as TaskLabel,
    customLabel: '',
    recurrence: 'once' as TaskRecurrence,
    scheduledDate: '',
    scheduledTime: '',
    deadline: '',
    deadlineTime: '', // New field for deadline time
    recurrenceDay: '',
    recurrenceTime: ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        hours: 0,
        minutes: 0,
        priority: 'medium',
        label: 'general',
        customLabel: '',
        recurrence: 'once',
        scheduledDate: '',
        scheduledTime: '',
        deadline: '',
        deadlineTime: '',
        recurrenceDay: '',
        recurrenceTime: ''
      });
      setErrors([]); // Clear any previous errors
    }
  }, [isOpen]);

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

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔍 AddTaskModal handleSubmit called!');
    
    // Validate required fields
    const validationErrors: string[] = [];
    
    // Check title
    if (!formData.title.trim()) {
      validationErrors.push('Task title is required');
    }
    
    // Duration is now optional
    const totalMinutes = (formData.hours * 60) + formData.minutes;
    
    // Check deadline based on recurrence type
    let hasValidDeadline = false;
    
    if (formData.recurrence === 'once') {
      // For "once" tasks, deadline is mandatory
      if (formData.deadline) {
        hasValidDeadline = true;
        // Also check if time is provided for "once" tasks
        if (!formData.deadlineTime) {
          validationErrors.push('Time is required for "once" tasks');
          hasValidDeadline = false;
        }
      } else {
        validationErrors.push('Deadline is required for "once" tasks');
      }
    } else if (formData.recurrence === 'everyweek') {
      // For weekly tasks, day and time are mandatory
      if (formData.recurrenceDay && formData.recurrenceTime) {
        hasValidDeadline = true;
      } else {
        validationErrors.push('Day and time are required for weekly tasks');
      }
    } else if (formData.recurrence === 'everyday') {
      // For everyday tasks, time is mandatory
      if (formData.recurrenceTime) {
        hasValidDeadline = true;
      } else {
        validationErrors.push('Time is required for daily tasks');
      }
    }
    
    // If there are validation errors, show them and don't submit
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Clear any previous errors
    setErrors([]);
    
    // Create deadline with time if available
    let taskDeadline: Date | undefined = undefined;
    
    console.log('🔍 AddTaskModal Debug - Input Data:', {
      deadline: formData.deadline,
      deadlineTime: formData.deadlineTime,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      recurrence: formData.recurrence,
      userTimezone: userTimezone
    });
    
    console.log('🔍 TEST LOG - This should appear if debug logs are working');
    
    // Priority 1: Use scheduled date/time for "once" tasks (if available)
    if (formData.recurrence === 'once' && formData.scheduledDate) {
      if (formData.scheduledTime) {
        // Use user's timezone for scheduled date/time
        taskDeadline = createUserDateTime(formData.scheduledDate, formData.scheduledTime, userTimezone || 'America/New_York');
        console.log('🔍 Created taskDeadline from scheduled date/time:', {
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          userTimezone: userTimezone,
          taskDeadline: taskDeadline?.toISOString(),
          taskDeadlineLocal: taskDeadline?.toLocaleString()
        });
      } else {
        // Just date, set to start of day in user's timezone
        taskDeadline = createUserDate(formData.scheduledDate, userTimezone || 'America/New_York');
        console.log('🔍 Created taskDeadline from scheduled date only:', {
          scheduledDate: formData.scheduledDate,
          userTimezone: userTimezone,
          taskDeadline: taskDeadline?.toISOString(),
          taskDeadlineLocal: taskDeadline?.toLocaleString()
        });
      }
    }
    // Priority 2: Use deadline date/time (if no scheduled date or not "once" task)
    else if (formData.deadline) {
      // If we have a time for "once" tasks, combine date and time in user's timezone
      if (formData.recurrence === 'once' && formData.deadlineTime) {
        taskDeadline = createUserDateTime(formData.deadline, formData.deadlineTime, userTimezone || 'America/New_York');
        console.log('🔍 Created taskDeadline from deadline date/time:', {
          deadline: formData.deadline,
          deadlineTime: formData.deadlineTime,
          userTimezone: userTimezone,
          taskDeadline: taskDeadline?.toISOString(),
          taskDeadlineLocal: taskDeadline?.toLocaleString()
        });
      } else {
        // For other cases, just use the date (set to start of day in user's timezone)
        taskDeadline = createUserDate(formData.deadline, userTimezone || 'America/New_York');
        console.log('🔍 Created taskDeadline from deadline date only:', {
          deadline: formData.deadline,
          userTimezone: userTimezone,
          taskDeadline: taskDeadline?.toISOString(),
          taskDeadlineLocal: taskDeadline?.toLocaleString()
        });
      }
    }
    
    // Debug logging for date handling
    console.log('🔍 Date Debug:', {
      originalDeadline: formData.deadline,
      originalScheduledDate: formData.scheduledDate,
      taskDeadline: taskDeadline?.toISOString(),
      taskDeadlineLocal: taskDeadline?.toLocaleDateString()
    });

    // Generate recurrenceTimeUTC for daily and weekly tasks
    let recurrenceTimeUTC: string | undefined = undefined;
    if ((formData.recurrence === 'everyday' || formData.recurrence === 'everyweek') && formData.recurrenceTime) {
      const tz = userTimezone || 'America/New_York';
      recurrenceTimeUTC = fromZonedTime(`2000-01-01T${formData.recurrenceTime}:00`, tz).toISOString();

          }

    // Create the task object for column determination (only required fields)
    const taskForColumnDetermination: Task = {
      id: 'temp-id',
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      label: formData.label,
      status: 'not_complete',
      column: 'Today',
      createdAt: new Date(),
      order: 0,
      deadline: taskDeadline,
      scheduledDate: formData.scheduledDate || undefined,
      scheduledTime: formData.scheduledTime ? createUserDateTime(formData.scheduledDate || '2000-01-01', formData.scheduledTime, userTimezone || 'America/New_York') : undefined,
      recurrence: formData.recurrence,
      recurrenceTimeUTC: recurrenceTimeUTC
    };

    // Use the centralized column determination logic with user's timezone
    const targetColumn = determineTaskColumn(taskForColumnDetermination, userTimezone || 'America/New_York');

    // Create the final task object with the determined column
    const newTask = {
      title: formData.title,
      description: formData.description,
      duration: totalMinutes > 0 ? totalMinutes : undefined,
      priority: formData.priority,
      label: formData.label,
      customLabel: formData.label === 'custom' ? formData.customLabel : undefined,
      deadline: taskDeadline,
      column: targetColumn,
      status: 'not_complete' as const,
      recurrence: formData.recurrence,
      recurrenceDay: formData.recurrenceDay || undefined,
      recurrenceTimeUTC: recurrenceTimeUTC,
      scheduledDate: formData.scheduledDate || undefined,
      scheduledTime: formData.scheduledTime ? createUserDateTime(formData.scheduledDate || '2000-01-01', formData.scheduledTime, userTimezone || 'America/New_York') : undefined
    };



    setIsLoading(true);
    try {
      await onAddTask(newTask);
      onClose();
    } catch (error) {
      console.error('Error adding task:', error);
      setErrors(['Failed to add task. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

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
          // Removed e.stopPropagation() to allow form submission to work
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-xl">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-1">Add New Task</h2>
            <p className="text-xs text-gray-600">Create a new task with smart categorization</p>
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
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            {/* Desktop Layout - Two Columns */}
            <div className="hidden md:grid md:grid-cols-5 md:gap-6">
              {/* Left Column */}
              <div className="col-span-3 space-y-3 md:space-y-4">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Enter task title"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* Task Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                    placeholder="Enter task description"
                    rows={4}
                    disabled={isLoading}
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hours</label>
                      <input
                        type="number"
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        min="0"
                        max="24"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Minutes</label>
                      <input
                        type="number"
                        value={formData.minutes}
                        onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        min="0"
                        max="59"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                    Total: {formData.hours}h {formData.minutes}m ({(formData.hours * 60) + formData.minutes} minutes)
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-2 space-y-3 md:space-y-4">
                {/* Task Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                    disabled={isLoading}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Task Label */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Label
                  </label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value as TaskLabel })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    disabled={isLoading}
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Custom Label Input */}
                {formData.label === 'custom' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Custom Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customLabel}
                      onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Enter custom label"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                {/* Task Recurrence */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Recurrence <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as TaskRecurrence })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                    disabled={isLoading}
                  >
                    <option value="once">Once</option>
                    <option value="everyday">Every Day</option>
                    <option value="everyweek">Every Week</option>
                  </select>
                </div>

                {/* Recurrence Details */}
                {formData.recurrence === 'once' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      When would you like to do it? (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Date</label>
                        <input
                          type="date"
                          value={formData.scheduledDate}
                          onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          disabled={isLoading}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Time</label>
                        <input
                          type="time"
                          value={formData.scheduledTime}
                          onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.recurrence === 'everyday' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Daily Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.recurrenceTime}
                      onChange={(e) => setFormData({ ...formData, recurrenceTime: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                {formData.recurrence === 'everyweek' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Weekly Schedule <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Day of Week <span className="text-red-500">*</span></label>
                        <select
                          value={formData.recurrenceDay}
                          onChange={(e) => setFormData({ ...formData, recurrenceDay: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          disabled={isLoading}
                        >
                          <option value="">Select day</option>
                          <option value="monday">Monday</option>
                          <option value="tuesday">Tuesday</option>
                          <option value="wednesday">Wednesday</option>
                          <option value="thursday">Thursday</option>
                          <option value="friday">Friday</option>
                          <option value="saturday">Saturday</option>
                          <option value="sunday">Sunday</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Time <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          value={formData.recurrenceTime}
                          onChange={(e) => setFormData({ ...formData, recurrenceTime: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Deadline - Show for "once" tasks and high priority tasks (but not for everyday/everyweek) */}
                {((formData.recurrence === 'once') || (formData.priority === 'high' && formData.recurrence !== 'everyday' && formData.recurrence !== 'everyweek')) ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Deadline {formData.recurrence === 'once' ? <span className="text-red-500">*</span> : ''}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Date</label>
                        <input
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          disabled={isLoading}
                        />
                      </div>
                      {formData.recurrence === 'once' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">Time (EST)</label>
                          <input
                            type="time"
                            value={formData.deadlineTime}
                            onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                            disabled={isLoading}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}


              </div>
            </div>

            {/* Mobile Layout - Single Column */}
            <div className="md:hidden space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Task Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter task title"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                  placeholder="Enter task description"
                  rows={4}
                  disabled={isLoading}
                />
              </div>

                              {/* Task Priority */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                    disabled={isLoading}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Task Label */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Label
                  </label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value as TaskLabel })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    disabled={isLoading}
                  >
                    <option value="general">General</option>
                    <option value="work">Work</option>
                    <option value="study">Study</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Custom Label Input */}
                {formData.label === 'custom' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Custom Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customLabel}
                      onChange={(e) => setFormData({ ...formData, customLabel: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="Enter custom label"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

              {/* Task Recurrence */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Recurrence <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => {
                    const newRecurrence = e.target.value as TaskRecurrence;
                    console.log('🔍 Recurrence selection changed:', {
                      from: formData.recurrence,
                      to: newRecurrence,
                      isEveryweek: newRecurrence === 'everyweek'
                    });
                    setFormData({ ...formData, recurrence: newRecurrence });
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  required
                  disabled={isLoading}
                >
                  <option value="once">Once</option>
                  <option value="everyday">Every Day</option>
                  <option value="everyweek">Every Week</option>
                </select>
              </div>

              {/* Recurrence Details */}
              {formData.recurrence === 'once' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    When would you like to do it? (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Time</label>
                      <input
                        type="time"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.recurrence === 'everyday' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Daily Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.recurrenceTime}
                    onChange={(e) => setFormData({ ...formData, recurrenceTime: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    required
                    disabled={isLoading}
                  />
                </div>
              )}

              {formData.recurrence === 'everyweek' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Weekly Schedule <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Day of Week <span className="text-red-500">*</span></label>
                      <select
                        value={formData.recurrenceDay}
                        onChange={(e) => setFormData({ ...formData, recurrenceDay: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        disabled={isLoading}
                      >
                        <option value="">Select day</option>
                        <option value="monday">Monday</option>
                        <option value="tuesday">Tuesday</option>
                        <option value="wednesday">Wednesday</option>
                        <option value="thursday">Thursday</option>
                        <option value="friday">Friday</option>
                        <option value="saturday">Saturday</option>
                        <option value="sunday">Sunday</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Time <span className="text-red-500">*</span></label>
                      <input
                        type="time"
                        value={formData.recurrenceTime}
                        onChange={(e) => setFormData({ ...formData, recurrenceTime: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Duration
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Hours</label>
                    <input
                      type="number"
                      value={formData.hours}
                      onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      min="0"
                      max="24"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Minutes</label>
                    <input
                      type="number"
                      value={formData.minutes}
                      onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      min="0"
                      max="59"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="mt-3 text-sm text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg">
                  Total: {formData.hours}h {formData.minutes}m ({(formData.hours * 60) + formData.minutes} minutes)
                </div>
              </div>

              {/* Deadline - Show for "once" tasks and high priority tasks (but not for everyday/everyweek) */}
              {((formData.recurrence === 'once') || (formData.priority === 'high' && formData.recurrence !== 'everyday' && formData.recurrence !== 'everyweek')) ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Deadline {formData.recurrence === 'once' ? <span className="text-red-500">*</span> : ''}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Date</label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        disabled={isLoading}
                      />
                    </div>
                    {formData.recurrence === 'once' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Time (EST)</label>
                        <input
                          type="time"
                          value={formData.deadlineTime}
                          onChange={(e) => setFormData({ ...formData, deadlineTime: e.target.value })}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}


            </div>

            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center mb-2">
                  <span className="text-red-500 font-semibold text-sm">Please fix the following errors:</span>
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-red-600 text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={(e) => {
                  console.log('🧪 Manual form submission test');
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    console.log('Found form, submitting manually');
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  } else {
                    console.log('No form found');
                  }
                }}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-4 py-2 border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-semibold"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 