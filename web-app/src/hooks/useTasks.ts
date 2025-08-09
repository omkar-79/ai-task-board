'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, Column, ColumnId, UseTasksReturn } from '@/lib/types';
import { 
  determineTaskColumn, 
  getColumnColor, 
  filterTasksByColumn 
} from '@/lib/utils';
import { sortTasksForColumn } from '@/lib/sorting';
import { taskService } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { TaskMovementManager } from '@/rendering/taskMovement';

const INITIAL_COLUMNS: Column[] = [
  { id: 'Today', title: 'Today', tasks: [], color: getColumnColor('Today') },
  { id: 'This Week', title: 'This Week', tasks: [], color: getColumnColor('This Week') },
  { id: 'Upcoming task', title: 'Upcoming task', tasks: [], color: getColumnColor('Upcoming task') },
  { id: 'Overdue', title: 'Overdue', tasks: [], color: getColumnColor('Overdue') },
];

export const useTasks = (userTimezone: string = 'America/New_York'): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>(INITIAL_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Initialize task movement manager
  const [movementManager] = useState(() => new TaskMovementManager(userTimezone));

  // Load tasks from database on mount and when user changes
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const loadTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTasks = await taskService.getTasks(user.id);
        setTasks(fetchedTasks);
      } catch (err) {
        console.error('Error loading tasks:', err);
        setError('Failed to load tasks from database');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user]);

  // Update movement manager when timezone changes
  useEffect(() => {
    movementManager.updateConfig(userTimezone);
  }, [userTimezone, movementManager]);

  // Periodic automatic movement check (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-evaluation of task movements by triggering the tasks useEffect
      // This ensures tasks move from "Upcoming task" to "This Week" to "Today" to "Overdue" 
      // based on time progression
      setTasks(prev => [...prev]); // Shallow copy to trigger useEffect without changing data
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Update columns whenever tasks change and apply automatic movements
  useEffect(() => {
    // Evaluate task movements
    const movementResults = movementManager.evaluateAllMovements(tasks);
    
    // Apply automatic movements if any
    if (movementResults.movements.length > 0) {
      console.log('Automatic task movements detected:', movementResults.movements);
      
      // Update tasks with new columns
      const updatedTasks = tasks.map(task => {
        const movement = movementResults.movements.find(m => m.taskId === task.id);
        if (movement && movement.moved) {
          console.log(`Moving task "${task.title}" from ${movement.oldColumn} to ${movement.newColumn}: ${movement.reason}`);
          
          // Use the existing moveTask function for automatic movements
          if (user) {
            taskService.moveTask(task.id, movement.newColumn, user.id)
              .catch(err => console.error('Failed to persist automatic movement:', err));
          }
          
          return { ...task, column: movement.newColumn };
        }
        return task;
      });
      
      setTasks(updatedTasks);
    }

    // Update columns with current tasks
    const updatedColumns = INITIAL_COLUMNS.map(column => ({
      ...column,
      tasks: sortTasksForColumn(filterTasksByColumn(tasks, column.id), column.id, userTimezone)
    }));
    setColumns(updatedColumns);
  }, [tasks, userTimezone, movementManager, user]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'order'>) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      console.log('Adding task with data:', taskData);
      setError(null);
      const taskForColumnDetermination: Task = {
        id: 'temp-id',
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        label: taskData.label,
        status: taskData.status || 'not_complete',
        column: taskData.column || 'Today',
        createdAt: new Date(),
        order: 0,
        deadline: taskData.deadline,
        scheduledDate: taskData.scheduledDate,
        scheduledTime: taskData.scheduledTime,
        recurrence: taskData.recurrence,
        recurrenceDay: taskData.recurrenceDay,
        recurrenceTimeUTC: taskData.recurrenceTimeUTC
      };
      
      const targetColumn = determineTaskColumn(taskForColumnDetermination, userTimezone);
      const finalTaskData = {
        ...taskData,
        status: taskData.status || 'not_complete',
        column: targetColumn
      };
      
      console.log('Task for column determination:', taskForColumnDetermination);
      const newTask = await taskService.createTask(finalTaskData, user.id);
      console.log('Successfully created task:', newTask);
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      console.error('Error adding task:', err);
      setError('Failed to add task to database');
      throw err; // Re-throw so the UI can handle it
    }
  }, [user, userTimezone]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      const updatedTask = await taskService.updateTask(taskId, updates, user.id);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update task in database');
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      await taskService.deleteTask(taskId, user.id);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task from database');
    }
  }, [user]);

  const moveTask = useCallback(async (taskId: string, targetColumn: ColumnId, targetIndex: number) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      
      // Get current tasks in target column
      const targetColumnTasks = sortTasksForColumn(filterTasksByColumn(tasks, targetColumn), targetColumn);

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

      // Find the current task to preserve all its data
      const currentTask = tasks.find(task => task.id === taskId);
      if (!currentTask) {
        throw new Error('Task not found');
      }

      // Update task in database with all existing data plus new column and order
      const updatedTask = await taskService.updateTask(taskId, {
        ...currentTask,
        column: targetColumn,
        order: newOrder
      }, user.id);

      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (err) {
      console.error('Error moving task:', err);
      setError('Failed to move task in database');
    }
  }, [user, tasks]);

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