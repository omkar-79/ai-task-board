'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, Column, ColumnId, UseTasksReturn } from '@/lib/types';
import { 
  generateId, 
  determineTaskColumn, 
  getColumnColor, 
  saveToLocalStorage, 
  loadFromLocalStorage,
  filterTasksByColumn 
} from '@/lib/utils';

const STORAGE_KEY = 'ai-task-board-tasks';

const INITIAL_COLUMNS: Column[] = [
  { id: 'Today', title: 'Today', tasks: [], color: getColumnColor('Today'), maxTasks: 5 },
  { id: 'This Week', title: 'This Week', tasks: [], color: getColumnColor('This Week'), maxTasks: 10 },
  { id: 'Important', title: 'Important', tasks: [], color: getColumnColor('Important'), maxTasks: 8 },
  { id: 'Daily', title: 'Daily', tasks: [], color: getColumnColor('Daily'), maxTasks: 6 },
  { id: 'Pending', title: 'Pending', tasks: [], color: getColumnColor('Pending') },
  { id: 'Overdue', title: 'Overdue', tasks: [], color: getColumnColor('Overdue') },
];

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    try {
      const savedTasks = loadFromLocalStorage<Task[]>(STORAGE_KEY, []);
      setTasks(savedTasks);
      setLoading(false);
    } catch (err) {
      setError('Failed to load tasks from storage');
      setLoading(false);
    }
  }, []);

  // Update columns whenever tasks change
  useEffect(() => {
    const updatedColumns = INITIAL_COLUMNS.map(column => ({
      ...column,
      tasks: filterTasksByColumn(tasks, column.id)
        .sort((a, b) => a.order - b.order)
    }));
    setColumns(updatedColumns);
  }, [tasks]);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (!loading) {
      saveToLocalStorage(STORAGE_KEY, tasks);
    }
  }, [tasks, loading]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'order'>) => {
    try {
      const taskForColumnDetermination = {
        ...taskData,
        id: generateId(),
        createdAt: new Date(),
        order: 0
      };
      
      const newTask: Task = {
        ...taskForColumnDetermination,
        order: Date.now(), // Simple ordering system
        column: taskData.column || determineTaskColumn(taskForColumnDetermination)
      };

      setTasks(prev => [...prev, newTask]);
      setError(null);
    } catch (err) {
      setError('Failed to add task');
    }
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, ...updates }
          : task
      ));
      setError(null);
    } catch (err) {
      setError('Failed to update task');
    }
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      setError(null);
    } catch (err) {
      setError('Failed to delete task');
    }
  }, []);

  const moveTask = useCallback((taskId: string, targetColumn: ColumnId, targetIndex: number) => {
    try {
      setTasks(prev => {
        const taskToMove = prev.find(task => task.id === taskId);
        if (!taskToMove) return prev;

        // Remove task from current position
        const otherTasks = prev.filter(task => task.id !== taskId);
        
        // Get tasks in target column
        const targetColumnTasks = filterTasksByColumn(otherTasks, targetColumn)
          .sort((a, b) => a.order - b.order);

        // Calculate new order
        let newOrder: number;
        if (targetIndex === 0) {
          newOrder = targetColumnTasks.length > 0 ? targetColumnTasks[0].order - 1 : Date.now();
        } else if (targetIndex >= targetColumnTasks.length) {
          newOrder = targetColumnTasks.length > 0 ? targetColumnTasks[targetColumnTasks.length - 1].order + 1 : Date.now();
        } else {
          const prevOrder = targetColumnTasks[targetIndex - 1].order;
          const nextOrder = targetColumnTasks[targetIndex].order;
          newOrder = (prevOrder + nextOrder) / 2;
        }

        // Update the task
        const updatedTask = {
          ...taskToMove,
          column: targetColumn,
          order: newOrder
        };

        return [...otherTasks, updatedTask];
      });
      setError(null);
    } catch (err) {
      setError('Failed to move task');
    }
  }, []);

  const getTasksByColumn = useCallback((columnId: ColumnId): Task[] => {
    return filterTasksByColumn(tasks, columnId);
  }, [tasks]);

  return {
    tasks,
    columns,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    getTasksByColumn,
    loading,
    error
  };
}; 