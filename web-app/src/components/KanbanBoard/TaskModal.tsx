'use client';

import React, { useState, useEffect } from 'react';
import { Task, ColumnId, TaskStatus } from '@/lib/types';
import { format } from 'date-fns';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 0,
    hours: 0,
    minutes: 0,
    type: 'regular' as 'regular' | 'important',
    status: 'not_complete' as TaskStatus,
    deadline: '',
    column: 'Today' as ColumnId
  });

  useEffect(() => {
    if (task) {
      const hours = Math.floor(task.duration / 60);
      const minutes = task.duration % 60;
      setFormData({
        title: task.title,
        description: task.description || '',
        duration: task.duration,
        hours,
        minutes,
        type: task.type,
        status: task.status || 'not_complete',
        deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : '',
        column: task.column
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const totalMinutes = (formData.hours * 60) + formData.minutes;
    const updates: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      duration: totalMinutes,
      type: formData.type,
      status: formData.status,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      column: formData.column
    };
    onUpdate(task.id, updates);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const isCompleted = task.completedAt !== undefined;
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

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
        className="bg-white rounded-2xl shadow-2xl w-full mx-4 transform transition-all duration-300 scale-100"
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Task Details</h2>
            <p className="text-xs md:text-sm text-gray-600">Edit your task information</p>
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
        <div className="p-4 md:p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            {/* Desktop Layout - Two Columns */}
            <div className="hidden md:grid md:grid-cols-2 md:gap-8">
              {/* Left Column */}
              <div className="space-y-4 md:space-y-6">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Task Title
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

                {/* Task Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                    placeholder="Enter task description"
                    rows={6}
                  />
                </div>

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
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        min="0"
                        max="24"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Minutes</label>
                      <input
                        type="number"
                        value={formData.minutes}
                        onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                        min="0"
                        max="59"
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg">
                    Total: {formData.hours}h {formData.minutes}m ({(formData.hours * 60) + formData.minutes} minutes)
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4 md:space-y-6">
                {/* Task Type and Status */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'regular' | 'important' })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                    >
                      <option value="regular">Regular</option>
                      <option value="important">Important</option>
                    </select>
                  </div>
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

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  />
                </div>

                {/* Column */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Column
                  </label>
                  <select
                    value={formData.column}
                    onChange={(e) => setFormData({ ...formData, column: e.target.value as ColumnId })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="Upcoming task">Upcoming task</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* Status Information */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Task Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Created:</span>
                      <span className="text-gray-800 font-semibold">
                        {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    {task.completedAt && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Completed:</span>
                        <span className="text-green-600 font-semibold">
                          {format(new Date(task.completedAt), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Deadline:</span>
                        <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                          {format(new Date(task.deadline), 'MMM dd, yyyy')}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout - Single Column */}
            <div className="md:hidden space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Task Title
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

              {/* Task Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>

              {/* Task Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'regular' | 'important' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  >
                    <option value="regular">Regular</option>
                    <option value="important">Important</option>
                  </select>
                </div>
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      min="0"
                      max="24"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Minutes</label>
                    <input
                      type="number"
                      value={formData.minutes}
                      onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                      min="0"
                      max="59"
                    />
                  </div>
                </div>
                <div className="mt-3 text-sm text-blue-600 font-medium bg-blue-50 px-3 py-2 rounded-lg">
                  Total: {formData.hours}h {formData.minutes}m ({(formData.hours * 60) + formData.minutes} minutes)
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                />
              </div>

              {/* Column */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Column
                </label>
                <select
                  value={formData.column}
                  onChange={(e) => setFormData({ ...formData, column: e.target.value as ColumnId })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                >
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="Upcoming task">Upcoming task</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              {/* Status Information */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  Task Information
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Created:</span>
                    <span className="text-gray-800 font-semibold">
                      {format(new Date(task.createdAt), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {task.completedAt && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Completed:</span>
                      <span className="text-green-600 font-semibold">
                        {format(new Date(task.completedAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {task.deadline && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600 font-medium">Deadline:</span>
                      <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
                        {format(new Date(task.deadline), 'MMM dd, yyyy')}
                        {isOverdue && ' (Overdue)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-semibold"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-semibold"
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