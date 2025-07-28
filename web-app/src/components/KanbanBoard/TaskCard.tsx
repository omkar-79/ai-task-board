'use client';

import React, { useState, useCallback } from 'react';
import { useDrag } from 'react-dnd';
// Using basic HTML until Chakra UI v3 is properly configured
import { Task, ColumnId, DragItem, TaskStatus } from '@/lib/types';
import { format } from 'date-fns';
import { TaskModal } from './TaskModal';

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: ColumnId;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, targetColumn: ColumnId, targetIndex: number) => void;
  onClick: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  columnId,
  onUpdate,
  onDelete,
  onMove,
  onClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && columnId !== 'Overdue';
  const daysUntilDeadline = task.deadline ? 
    Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
  const isCompleted = task.status === 'completed';

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
        p-3 rounded-md border transition-all duration-200
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
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 flex-1">
            <h4 
              className={`font-semibold text-sm line-clamp-2 ${
                isCompleted 
                  ? 'text-green-700 line-through' 
                  : isOverdue 
                    ? 'text-red-500' 
                    : 'text-gray-800'
              }`}
            >
              {task.title}
            </h4>
            
            {/* Removed tags since column context is clear */}
          </div>

          <div className="flex gap-1">
            {/* Status dropdown moved to bottom left */}
          </div>
        </div>

        {/* Task Details and Status */}
        <div className="flex justify-between items-center text-xs text-gray-600 task-card-content">
          <div className="flex gap-3">
            <div className="flex gap-1 items-center">
              <span>⏱</span>
              <span>
                {task.duration >= 60 
                  ? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m`
                  : `${task.duration}min`
                }
              </span>
            </div>

            {task.deadline && (
              <div className="flex gap-1 items-center">
                <span>📅</span>
                <span>{format(new Date(task.deadline), 'MMM dd')}</span>
              </div>
            )}
          </div>

          {/* Status Dropdown */}
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
            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
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