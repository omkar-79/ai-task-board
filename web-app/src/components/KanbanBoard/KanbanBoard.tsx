'use client';

import React, { useState, useCallback } from 'react';
// Temporarily using basic HTML until Chakra UI v3 is properly configured
import { ColumnComponent } from './ColumnComponent';
import { TaskModal } from './TaskModal';
import { KanbanBoardProps, ColumnId, Task } from '@/lib/types';
import { getColumnColor } from '@/lib/utils';

const COLUMN_CONFIG = [
  { id: 'Today' as ColumnId, title: 'Today' },
  { id: 'This Week' as ColumnId, title: 'This Week' },
  { id: 'Important' as ColumnId, title: 'Important' },
  { id: 'Daily' as ColumnId, title: 'Daily' },
  { id: 'Pending' as ColumnId, title: 'Pending' },
  { id: 'Overdue' as ColumnId, title: 'Overdue' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onTaskMove,
  onTaskUpdate,
  onTaskDelete
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTasksForColumn = (columnId: ColumnId): Task[] => {
    const column = columns.find(col => col.id === columnId);
    return column ? column.tasks : [];
  };

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
  }, []);

  const handleTaskUpdate = useCallback((taskId: string, updates: Partial<Task>) => {
    onTaskUpdate(taskId, updates);
    // Update the selected task if it's the one being edited
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, ...updates });
    }
  }, [onTaskUpdate, selectedTask]);

  return (
    <div className="w-full py-6 px-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-700 text-center">
        AI Task Board
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {COLUMN_CONFIG.map((columnConfig) => {
          const tasks = getTasksForColumn(columnConfig.id);
          const column = {
            id: columnConfig.id,
            title: columnConfig.title,
            tasks,
            color: getColumnColor(columnConfig.id)
          };

          return (
            <ColumnComponent
              key={columnConfig.id}
              column={column}
              onTaskMove={onTaskMove}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
              onTaskClick={handleTaskClick}
            />
          );
        })}
      </div>

      {/* Single Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onUpdate={handleTaskUpdate}
        onDelete={onTaskDelete}
      />
    </div>
  );
}; 