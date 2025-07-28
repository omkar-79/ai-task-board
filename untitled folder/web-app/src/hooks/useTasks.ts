import { useState, useEffect, useCallback } from 'react';
import { Task, TaskColumn, TaskFormData } from '../lib/types';
import { 
  createTask, 
  updateTask, 
  moveTask, 
  saveToLocalStorage, 
  loadFromLocalStorage, 
  getSampleTasks,
  validateTask 
} from '../lib/utils';
import { geminiService } from '../lib/gemini';

const TASKS_STORAGE_KEY = 'ai-task-board-tasks';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const savedTasks = loadFromLocalStorage<Task[]>(TASKS_STORAGE_KEY, getSampleTasks());
    setTasks(savedTasks);
    setLoading(false);
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (!loading) {
      saveToLocalStorage(TASKS_STORAGE_KEY, tasks);
    }
  }, [tasks, loading]);

  // Add new task
  const addTask = useCallback(async (taskData: TaskFormData) => {
    try {
      setError(null);
      
      // Validate task data
      const validationErrors = validateTask(taskData);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return null;
      }

      // Create task with initial categorization
      const newTask = createTask(taskData);
      
      // Try AI categorization if available
      try {
        const userProfile = loadFromLocalStorage('ai-task-board-profile', { id: 'default', schedule: {} });
        const aiResponse = await geminiService.categorizeTask({
          task: newTask,
          userProfile,
          allTasks: tasks
        });
        
        // Update task with AI categorization
        const categorizedTask = {
          ...newTask,
          column: aiResponse.targetColumn
        };
        
        setTasks(prev => [...prev, categorizedTask]);
        return categorizedTask;
      } catch (aiError) {
        console.warn('AI categorization failed, using fallback:', aiError);
        // Use fallback categorization
        const fallbackColumn = geminiService.categorizeTaskFallback(newTask);
        const categorizedTask = {
          ...newTask,
          column: fallbackColumn
        };
        
        setTasks(prev => [...prev, categorizedTask]);
        return categorizedTask;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add task');
      return null;
    }
  }, [tasks]);

  // Update existing task
  const updateTaskById = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      setError(null);
      
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        setError('Task not found');
        return null;
      }

      const updatedTask = updateTask(tasks[taskIndex], updates);
      
      // Try AI re-categorization if deadline or type changed
      if (updates.deadline || updates.type) {
        try {
          const userProfile = loadFromLocalStorage('ai-task-board-profile', { id: 'default', schedule: {} });
          const aiResponse = await geminiService.categorizeTask({
            task: updatedTask,
            userProfile,
            allTasks: tasks
          });
          
          const recategorizedTask = {
            ...updatedTask,
            column: aiResponse.targetColumn
          };
          
          setTasks(prev => prev.map(task => 
            task.id === taskId ? recategorizedTask : task
          ));
          return recategorizedTask;
        } catch (aiError) {
          console.warn('AI re-categorization failed, using fallback:', aiError);
          // Use fallback categorization
          const fallbackColumn = geminiService.categorizeTaskFallback(updatedTask);
          const recategorizedTask = {
            ...updatedTask,
            column: fallbackColumn
          };
          
          setTasks(prev => prev.map(task => 
            task.id === taskId ? recategorizedTask : task
          ));
          return recategorizedTask;
        }
      } else {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? updatedTask : task
        ));
        return updatedTask;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      return null;
    }
  }, [tasks]);

  // Move task to different column
  const moveTaskToColumn = useCallback((taskId: string, newColumn: TaskColumn) => {
    try {
      setError(null);
      
      const taskIndex = tasks.findIndex(task => task.id === taskId);
      if (taskIndex === -1) {
        setError('Task not found');
        return null;
      }

      const movedTask = moveTask(tasks[taskIndex], newColumn);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? movedTask : task
      ));
      
      return movedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task');
      return null;
    }
  }, [tasks]);

  // Delete task
  const deleteTask = useCallback((taskId: string) => {
    try {
      setError(null);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      return false;
    }
  }, []);

  // Complete task
  const completeTask = useCallback((taskId: string) => {
    try {
      setError(null);
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, completedAt: new Date() }
          : task
      ));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
      return false;
    }
  }, []);

  // Get tasks by column
  const getTasksByColumn = useCallback((column: TaskColumn) => {
    return tasks.filter(task => task.column === column);
  }, [tasks]);

  // Get all columns with their tasks
  const getColumnsWithTasks = useCallback(() => {
    const columns: TaskColumn[] = ['Today', 'This Week', 'Important', 'Daily', 'Pending', 'Overdue'];
    return columns.map(column => ({
      id: column,
      title: column,
      tasks: getTasksByColumn(column)
    }));
  }, [getTasksByColumn]);

  // Clear all tasks
  const clearAllTasks = useCallback(() => {
    setTasks([]);
  }, []);

  // Reset to sample data
  const resetToSampleData = useCallback(() => {
    setTasks(getSampleTasks());
  }, []);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTaskById,
    moveTaskToColumn,
    deleteTask,
    completeTask,
    getTasksByColumn,
    getColumnsWithTasks,
    clearAllTasks,
    resetToSampleData
  };
}; 