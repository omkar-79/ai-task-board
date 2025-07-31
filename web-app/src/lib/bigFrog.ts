import { Task, ColumnId } from './types';
import { toZonedTime } from 'date-fns-tz';

export interface BigFrogTask {
  taskId: string;
  columnId: ColumnId;
  reason: string;
}

/**
 * Determines the Big Frog task for a given column based on priority, duration, and timing
 * @param tasks - Array of tasks in the column
 * @param columnId - The column ID
 * @returns The Big Frog task or null if no eligible task found
 */
export const determineBigFrogTask = (tasks: Task[], columnId: ColumnId): Task | null => {
  if (tasks.length === 0) return null;

  // Filter out completed tasks and only consider high priority tasks
  const activeTasks = tasks.filter(task => task.status !== 'completed');
  const highPriorityTasks = activeTasks.filter(task => task.priority === 'high');
  
  if (highPriorityTasks.length === 0) {
    // If no high priority tasks, return null (no Big Frog)
    return null;
  }

  // If only one high priority task, it's the Big Frog
  if (highPriorityTasks.length === 1) {
    return highPriorityTasks[0];
  }

  // Multiple high priority tasks - need to find the one with highest duration
  const tasksWithDuration = highPriorityTasks.filter(task => task.duration && task.duration > 0);
  
  if (tasksWithDuration.length === 0) {
    // No tasks with duration, return the first high priority task
    return highPriorityTasks[0];
  }

  // Find the task with the highest duration
  const maxDuration = Math.max(...tasksWithDuration.map(task => task.duration || 0));
  const highestDurationTasks = tasksWithDuration.filter(task => (task.duration || 0) === maxDuration);

  if (highestDurationTasks.length === 1) {
    return highestDurationTasks[0];
  }

  // Multiple tasks with same highest duration - check for earliest scheduled/deadline
  const tasksWithTiming = highestDurationTasks.filter(task => 
    (task.scheduledDate && task.scheduledTime) || task.deadline
  );

  if (tasksWithTiming.length === 0) {
    // No tasks with timing, return the first highest duration task
    return highestDurationTasks[0];
  }

  // Find the task with the earliest scheduled time or deadline
  let earliestTask: Task | null = null;
  let earliestTime: Date | null = null;

  for (const task of tasksWithTiming) {
    let taskTime: Date | null = null;

    // Priority 1: Check scheduled date and time
    if (task.scheduledDate && task.scheduledTime) {
      const scheduledDateTimeString = `${task.scheduledDate}T${task.scheduledTime}:00`;
      let taskTime = toZonedTime(new Date(scheduledDateTimeString), 'America/New_York');
      
      // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
      if (taskTime.getSeconds() > 0) {
        taskTime = new Date(taskTime.getTime() + 60000); // Add 1 minute
      }
    }
    // Priority 2: Check deadline
    else if (task.deadline) {
      let taskTime = new Date(task.deadline);
      
      // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
      if (taskTime.getSeconds() > 0) {
        taskTime = new Date(taskTime.getTime() + 60000); // Add 1 minute
      }
    }

    if (taskTime && (!earliestTime || taskTime < earliestTime)) {
      earliestTime = taskTime;
      earliestTask = task;
    }
  }

  return earliestTask || highestDurationTasks[0];
};

/**
 * Gets the Big Frog task for each column
 * @param columns - Array of columns with their tasks
 * @returns Array of Big Frog tasks
 */
export const getBigFrogTasks = (columns: { id: ColumnId; tasks: Task[] }[]): BigFrogTask[] => {
  const bigFrogTasks: BigFrogTask[] = [];

  for (const column of columns) {
    const bigFrogTask = determineBigFrogTask(column.tasks, column.id);
    
    if (bigFrogTask) {
      const reason = getBigFrogReason(bigFrogTask, column.tasks);
      bigFrogTasks.push({
        taskId: bigFrogTask.id,
        columnId: column.id,
        reason
      });
    }
  }

  return bigFrogTasks;
};

/**
 * Generates a human-readable reason for why a task was selected as Big Frog
 * @param task - The Big Frog task
 * @param allTasks - All tasks in the column
 * @returns Reason string
 */
export const getBigFrogReason = (task: Task, allTasks: Task[]): string => {
  const activeTasks = allTasks.filter(t => t.status !== 'completed');
  const highPriorityTasks = activeTasks.filter(t => t.priority === 'high');
  const tasksWithDuration = highPriorityTasks.filter(t => t.duration && t.duration > 0);
  const maxDuration = Math.max(...tasksWithDuration.map(t => t.duration || 0));
  
  let reason = 'High priority task';
  
  if (task.duration && task.duration > 0) {
    if (task.duration === maxDuration) {
      reason += ` with highest duration (${task.duration}min)`;
    } else {
      reason += ` with duration (${task.duration}min)`;
    }
  }
  
  if (task.scheduledDate && task.scheduledTime) {
    reason += ` - scheduled for ${task.scheduledDate} at ${task.scheduledTime}`;
  } else if (task.deadline) {
    let deadlineDate = new Date(task.deadline);
    
    // Round up by 1 minute if there are seconds (to handle PostgreSQL timestamp precision)
    if (deadlineDate.getSeconds() > 0) {
      deadlineDate = new Date(deadlineDate.getTime() + 60000); // Add 1 minute
    }
    
    reason += ` - deadline ${deadlineDate.toLocaleDateString()}`;
  }
  
  return reason;
};

/**
 * Checks if a task is the Big Frog in its column
 * @param task - The task to check
 * @param columnTasks - All tasks in the column
 * @param columnId - The column ID
 * @returns True if the task is the Big Frog
 */
export const isBigFrogTask = (task: Task, columnTasks: Task[], columnId: ColumnId): boolean => {
  const bigFrogTask = determineBigFrogTask(columnTasks, columnId);
  return bigFrogTask?.id === task.id;
}; 