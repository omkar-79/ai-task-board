'use client';

import React from 'react';
// Temporarily using basic HTML until Chakra UI v3 is properly configured
import { ColumnComponent } from './ColumnComponent';
import { KanbanBoardProps, ColumnId, Task } from '@/lib/types';
import { getColumnColor } from '@/lib/utils';

const COLUMN_CONFIG = [
  { id: 'Today' as ColumnId, title: 'Today', maxTasks: 5 },
  { id: 'This Week' as ColumnId, title: 'This Week', maxTasks: 10 },
  { id: 'Important' as ColumnId, title: 'Important', maxTasks: 8 },
  { id: 'Daily' as ColumnId, title: 'Daily', maxTasks: 6 },
  { id: 'Pending' as ColumnId, title: 'Pending', maxTasks: undefined },
  { id: 'Overdue' as ColumnId, title: 'Overdue', maxTasks: undefined },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  onTaskMove,
  onTaskUpdate,
  onTaskDelete
}) => {
  const getTasksForColumn = (columnId: ColumnId): Task[] => {
    const column = columns.find(col => col.id === columnId);
    return column ? column.tasks : [];
  };

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
            color: getColumnColor(columnConfig.id),
            maxTasks: columnConfig.maxTasks
          };

          return (
            <ColumnComponent
              key={columnConfig.id}
              column={column}
              onTaskMove={onTaskMove}
              onTaskUpdate={onTaskUpdate}
              onTaskDelete={onTaskDelete}
            />
          );
        })}
      </div>
    </div>
  );
}; 