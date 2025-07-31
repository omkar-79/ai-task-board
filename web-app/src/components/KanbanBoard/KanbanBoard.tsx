'use client';

import React, { useState, useCallback, useEffect } from 'react';
// Temporarily using basic HTML until Chakra UI v3 is properly configured
import { ColumnComponent } from './ColumnComponent';
import { TaskModal } from './TaskModal';
import { AddTaskModal } from './AddTaskModal';
import { TrashDropZone } from './TrashDropZone';
import { KanbanBoardProps, ColumnId, Task } from '@/lib/types';
import { getColumnColor } from '@/lib/utils';
import { DragProvider, useDrag } from '@/contexts/DragContext';

const COLUMN_CONFIG = [
  { id: 'Today' as ColumnId, title: 'Today' },
  { id: 'This Week' as ColumnId, title: 'This Week' },
  { id: 'Upcoming task' as ColumnId, title: 'Upcoming task' },

  { id: 'Overdue' as ColumnId, title: 'Overdue' },

];

const KanbanBoardContent: React.FC<KanbanBoardProps> = ({
  columns,
  onTaskMove,
  onTaskUpdate,
  onTaskDelete,
  onAddTask,
  userTimezone
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { isDragging } = useDrag();

  // Timer-based state to trigger re-render every minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleTaskUpdate = useCallback(async (taskId: string, updates: Partial<Task>) => {
    console.log('KanbanBoard: handleTaskUpdate called');
    console.log('KanbanBoard: taskId:', taskId);
    console.log('KanbanBoard: updates:', updates);
    
    try {
      await onTaskUpdate(taskId, updates);
      console.log('KanbanBoard: onTaskUpdate completed');
      
      // Update the selected task if it's the one being edited
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, ...updates });
        console.log('KanbanBoard: updated selectedTask');
      }
    } catch (error) {
      console.error('KanbanBoard: Error in handleTaskUpdate:', error);
    }
  }, [onTaskUpdate, selectedTask]);

  const handleAddTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'order'>) => {
    try {
      setIsAddingTask(true);
      await onAddTask(taskData);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding task:', error);
      // You could show an error message to the user here
    } finally {
      setIsAddingTask(false);
    }
  }, [onAddTask]);

  return (
    <div className="w-full py-4 sm:py-6 px-2 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-700">
          AI Task Board
        </h1>
        <div className="flex items-center gap-3">
          <TrashDropZone
            onDeleteTask={onTaskDelete}
            isDragging={isDragging}
          />
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl flex items-center gap-2 text-sm sm:text-base"
          >
            <span className="text-base sm:text-lg">+</span>
            Add Task
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
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
                  userTimezone={userTimezone}
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
        userTimezone={userTimezone}
      />

                        {/* Add Task Modal */}
                  <AddTaskModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onAddTask={handleAddTask}
                    userTimezone={userTimezone}
                  />
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = (props) => {
  return (
    <DragProvider>
      <KanbanBoardContent {...props} />
    </DragProvider>
  );
}; 