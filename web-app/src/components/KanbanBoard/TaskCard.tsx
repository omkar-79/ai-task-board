'use client';

import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
// Using basic HTML until Chakra UI v3 is properly configured
import { Task, ColumnId, DragItem } from '@/lib/types';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: ColumnId;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onMove: (taskId: string, targetColumn: ColumnId, targetIndex: number) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  columnId,
  onUpdate,
  onDelete,
  onMove
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

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={drag as any}
      className={`
        bg-white p-3 rounded-md border border-gray-200 cursor-grab transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-1' : 'opacity-100'}
        hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5
        active:cursor-grabbing
      `}
    >
      {/* Task Header */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1 flex-1">
            <h4 
              className={`font-semibold text-sm line-clamp-2 ${
                isOverdue ? 'text-red-500' : 'text-gray-800'
              }`}
            >
              {task.title}
            </h4>
            
            <div className="flex gap-1 flex-wrap">
              <span 
                className={`text-xs px-2 py-1 rounded ${
                  task.type === 'important' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {task.type}
              </span>
              
              {isOverdue && (
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
                  Overdue
                </span>
              )}

              {daysUntilDeadline !== null && !isOverdue && (
                <span 
                  className={`text-xs px-2 py-1 rounded ${
                    daysUntilDeadline <= 1 
                      ? 'bg-orange-100 text-orange-700' 
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {daysUntilDeadline === 0 ? 'Today' : 
                   daysUntilDeadline === 1 ? 'Tomorrow' : 
                   `${daysUntilDeadline}d`}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-1">
            {task.description && (
              <button
                className="text-xs px-2 py-1 hover:bg-gray-100 rounded"
                onClick={toggleExpand}
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            <button
              className="text-xs px-2 py-1 hover:bg-red-100 text-red-600 rounded"
              onClick={handleDelete}
            >
              ×
            </button>
          </div>
        </div>

        {/* Task Details */}
        <div className="flex gap-3 text-xs text-gray-600">
          <div className="flex gap-1 items-center">
            <span>⏱</span>
            <span>{task.duration}min</span>
          </div>

          {task.deadline && (
            <div className="flex gap-1 items-center">
              <span>📅</span>
              <span>{format(new Date(task.deadline), 'MMM dd')}</span>
            </div>
          )}
        </div>

        {/* Expandable Description */}
        {task.description && isExpanded && (
          <div className="bg-gray-50 p-2 rounded-sm text-xs">
            <p>{task.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}; 