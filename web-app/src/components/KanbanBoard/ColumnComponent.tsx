'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
// Using basic HTML until Chakra UI v3 is properly configured
import { TaskCard } from './TaskCard';
import { Column, ColumnId, DragItem, Task } from '@/lib/types';
import { sortTasksForColumn } from '@/lib/sorting';

interface ColumnComponentProps {
  column: Column;
  onTaskMove: (taskId: string, targetColumn: ColumnId, targetIndex: number) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
  userTimezone?: string;
}

export const ColumnComponent: React.FC<ColumnComponentProps> = ({
  column,
  onTaskMove,
  onTaskUpdate,
  onTaskDelete,
  onTaskClick,
  userTimezone
}) => {
  const bgColor = 'white';
  const borderColor = 'gray.200';
  const headerBg = 'gray.50';

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: DragItem) => {
      if (item.sourceColumn !== column.id) {
        onTaskMove(item.id, column.id, column.tasks.length);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;
  const totalDuration = column.tasks.reduce((total, task) => total + (task.duration || 0), 0);
  const formatDuration = (minutes: number) => {
    if (minutes === 0) {
      return '0m';
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      ref={drop as any}
      className={`
        bg-white rounded-lg border-2 shadow-sm h-[500px] sm:h-[550px] lg:h-[600px] transition-all duration-200
        ${isActive ? 'border-blue-400' : 'border-gray-200'}
        ${canDrop ? 'opacity-90' : 'opacity-100'}
        hover:shadow-md
      `}
    >
      {/* Column Header */}
      <div className="bg-gray-50 p-3 sm:p-4 rounded-t-lg border-b border-gray-200">
        <h3 className="text-xs sm:text-sm font-semibold mb-2" style={{ color: column.color }}>
          {column.title}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-xs bg-gray-100 px-1 sm:px-2 py-1 rounded">
            {column.tasks.length} tasks
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-1 sm:px-2 py-1 rounded">
            {formatDuration(totalDuration)}
          </span>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex flex-col gap-2 sm:gap-3 p-2 sm:p-3 h-[calc(100%-70px)] sm:h-[calc(100%-80px)] overflow-y-auto">
        {column.tasks.length === 0 ? (
          <div className="p-6 text-center text-gray-500 rounded-md border-2 border-dashed border-gray-300">
            <p className="text-sm">
              {isActive ? 'Drop task here' : 'No tasks yet'}
            </p>
          </div>
        ) : (
          sortTasksForColumn(column.tasks, column.id)
            .map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                columnId={column.id}
                onUpdate={onTaskUpdate}
                onDelete={onTaskDelete}
                onMove={onTaskMove}
                onClick={onTaskClick}
                userTimezone={userTimezone}
              />
            ))
        )}
      </div>
    </div>
  );
}; 