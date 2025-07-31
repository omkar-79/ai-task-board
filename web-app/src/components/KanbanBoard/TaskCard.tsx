'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDrag } from 'react-dnd';
// Using basic HTML until Chakra UI v3 is properly configured
import { Task, ColumnId, DragItem, TaskStatus } from '@/lib/types';
import { format } from 'date-fns';
import { formatESTDate, getCurrentESTDateTime } from '@/lib/utils';
import { getCurrentDateTimeInTimezone, createDateInTimezone, convertToTimezone } from '@/lib/time';
import { TaskModal } from './TaskModal';
import { useDrag as useDragContext } from '@/contexts/DragContext';
import { isBigFrogTask } from '@/lib/bigFrog';
import { toZonedTime } from 'date-fns-tz';

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: ColumnId;
  columnTasks: Task[]; // Add this to check Big Frog status
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, targetColumn: ColumnId, targetIndex: number) => void;
  onClick: (task: Task) => void;
  userTimezone?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  columnId,
  columnTasks,
  onUpdate,
  onDelete,
  onMove,
  onClick,
  userTimezone
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { setIsDragging } = useDragContext();
  
  const bgColor = 'white';
  const borderColor = 'gray.200';
  const hoverBg = 'gray.50';

  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>({
    type: 'TASK',
    item: {
      type: 'TASK',
      id: task.id,
      sourceColumn: columnId,
      index
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Update global drag state
  useEffect(() => {
    setIsDragging(isDragging);
  }, [isDragging, setIsDragging]);

  // Determine the relevant date for overdue calculation
  const getRelevantDate = (): Date | null => {
    // Priority 1: Check scheduled time
    if (task.scheduledTime) {
      let scheduledDate = toZonedTime(task.scheduledTime, userTimezone || 'America/New_York');
      
      // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
      if (scheduledDate.getSeconds() > 0) {
        scheduledDate = new Date(scheduledDate.getTime() + 60000); // Add 1 minute
      }
      
      return scheduledDate;
    }
    
    // Priority 2: Check scheduled date only
    if (task.scheduledDate) {
      const scheduledDateString = `${task.scheduledDate}T00:00:00`;
      return new Date(scheduledDateString);
    }
    
    // Priority 3: Check deadline
    if (task.deadline) {
      let deadlineDate = toZonedTime(new Date(task.deadline), userTimezone || 'America/New_York');
      
      // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
      if (deadlineDate.getSeconds() > 0) {
        deadlineDate = new Date(deadlineDate.getTime() + 60000); // Add 1 minute
      }
      
      return deadlineDate;
    }
    
    return null;
  };

  const relevantDate = getRelevantDate();
  const currentDateTime = getCurrentDateTimeInTimezone(userTimezone || 'America/New_York');
  const isOverdue = relevantDate && relevantDate < currentDateTime;
  
  const daysUntilDeadline = relevantDate ? 
    Math.ceil((relevantDate.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isCompleted = task.status === 'completed';
  
  // Check if this task is the Big Frog
  const isBigFrog = isBigFrogTask(task, columnTasks, columnId);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open modal if clicking on the card itself, not on buttons
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.task-card-content')) {
      e.preventDefault();
      e.stopPropagation();
      onClick(task);
    }
  };

  return (
    <div
      ref={drag as any}
      onClick={handleCardClick}
      className={`
        p-2 sm:p-3 rounded-md border transition-all duration-200
        ${isCompleted 
          ? 'bg-green-50 border-green-200 opacity-75' 
          : 'bg-white border-gray-200'
        }
        ${isDragging ? 'opacity-50 rotate-1' : 'opacity-100'}
        ${!isCompleted ? 'cursor-pointer hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 active:cursor-grabbing' : 'cursor-pointer'}
      `}
    >
      {/* Task Header */}
      <div className="flex flex-col gap-2 task-card-content">
        <div className="flex justify-between items-start relative">
          {isBigFrog && (
            <div className="absolute -top-1 -right-1 z-10" title="🐸 Big Frog - Most important task in this column">
              <img 
                src="/images/frog.png" 
                alt="Big Frog" 
                className="w-6 h-6 animate-bounce drop-shadow-lg"
              />
            </div>
          )}
          <div className="flex flex-col gap-1 flex-1">
            <h4 
              className={`font-semibold text-xs sm:text-sm line-clamp-2 ${
                isCompleted 
                  ? 'text-green-700 line-through' 
                  : isOverdue 
                    ? 'text-red-500' 
                    : 'text-gray-800'
              }`}
            >
              {task.title}
            </h4>
            {/* Tags */}
            <div className="flex gap-2 mt-1">
              {/* Priority Tag */}
              <span className={`inline-block text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${
                (task.priority || 'medium') === 'high' 
                  ? 'bg-red-100 text-red-700 border-red-200' 
                  : (task.priority || 'medium') === 'medium'
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    : 'bg-blue-100 text-blue-700 border-blue-200'
              }`}>
                {(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}
              </span>
              
              {/* Label Tag */}
              <span className="inline-block bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border border-gray-200">
                {(task.label || 'general') === 'custom' ? (task.customLabel || 'Custom') : (task.label || 'general').charAt(0).toUpperCase() + (task.label || 'general').slice(1)}
              </span>
              
              {isOverdue && columnId !== 'Overdue' && (
                <span className="inline-block bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border border-yellow-200">Overdue</span>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {/* Status dropdown moved to bottom left */}
          </div>
        </div>

        {/* Task Details */}
        <div className="flex gap-3 text-xs text-gray-600 task-card-content">
          {task.duration && (
            <div className="flex gap-1 items-center">
              <span>⏱</span>
              <span>
                {task.duration >= 60 
                  ? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`
                  : `${task.duration}min`
                }
              </span>
            </div>
          )}

          {/* Time/Date Display based on column */}
          {(() => {
            const isTodayColumn = columnId === 'Today';
            

            

            

            
            // Recurrence time display for daily tasks
            if (task.recurrence === 'everyday' && task.recurrenceTimeUTC) {
              const tz = userTimezone || 'America/New_York';
              const localTime = toZonedTime(new Date(task.recurrenceTimeUTC), tz);
              const displayTime = localTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              return (
                <div className="flex gap-1 items-center">
                  <span>🕐</span>
                  <span>Daily at: {displayTime}</span>
                </div>
              );
            }

            // Recurrence time display for weekly tasks
            if (task.recurrence === 'everyweek' && task.recurrenceTimeUTC && task.recurrenceDay) {
              const tz = userTimezone || 'America/New_York';
              const localTime = toZonedTime(new Date(task.recurrenceTimeUTC), tz);
              const displayTime = localTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
              const dayName = task.recurrenceDay.charAt(0).toUpperCase() + task.recurrenceDay.slice(1);
              return (
                <div className="flex gap-1 items-center">
                  <span>📅</span>
                  <span>Weekly on {dayName} at: {displayTime}</span>
                </div>
              );
            }

            // Time display for "once" tasks - show either scheduled time or deadline
            if (task.recurrence === 'once') {
              const tz = userTimezone || 'America/New_York';
              
              // Priority 1: Show scheduled time if it exists
              if (task.scheduledTime) {
                let scheduledDate = toZonedTime(task.scheduledTime, tz);
                
                // Round up by 1 minute if there are seconds
                if (scheduledDate.getSeconds() > 0) {
                  scheduledDate = new Date(scheduledDate.getTime() + 60000);
                }
                
                if (isTodayColumn) {
                  return (
                    <div className="flex gap-1 items-center">
                      <span>🕐</span>
                      <span>Scheduled at: {scheduledDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex gap-1 items-center">
                      <span>📅</span>
                      <span>Scheduled: {scheduledDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                  );
                }
              }
              
              // Priority 2: Show deadline if no scheduled time
              if (task.deadline) {
                let deadlineDate = toZonedTime(new Date(task.deadline), tz);
                
                // Round up by 1 minute if there are seconds
                if (deadlineDate.getSeconds() > 0) {
                  deadlineDate = new Date(deadlineDate.getTime() + 60000);
                }
                
                if (isTodayColumn) {
                  return (
                    <div className="flex gap-1 items-center">
                      <span>📅</span>
                      <span>Deadline: {deadlineDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="flex gap-1 items-center">
                      <span>📅</span>
                      <span>Deadline: {deadlineDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                  );
                }
              }
            }

            return null;
          })()}
        </div>

        {/* Status Dropdown */}
        <div className="flex justify-start mt-2">
          <select
            value={task.status}
            onChange={(e) => {
              e.stopPropagation();
              const newStatus = e.target.value as TaskStatus;
              const updates: Partial<Task> = { status: newStatus };
              if (newStatus === 'completed') {
                updates.completedAt = new Date();
              } else {
                updates.completedAt = undefined;
              }
              onUpdate(task.id, updates);
            }}
            className="text-xs px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <option value="not_complete">Not Complete</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Expandable Description */}
        {task.description && isExpanded && (
          <div className="bg-gray-50 p-2 rounded-sm text-xs task-card-content">
            <p>{task.description}</p>
          </div>
        )}
      </div>

      {/* Task Modal is now handled at KanbanBoard level */}
    </div>
  );
}; 