import { Task, ColumnId } from '@/lib/types';
import { getCurrentDateTimeInTimezone } from '@/lib/time';
import { toZonedTime } from 'date-fns-tz';

export interface ColumnEvaluationResult {
  taskId: string;
  currentColumn: ColumnId;
  recommendedColumn: ColumnId;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  shouldMove: boolean;
}

export class ColumnEvaluator {
  private userTimezone: string;

  constructor(userTimezone: string) {
    this.userTimezone = userTimezone;
  }

  /**
   * Evaluate all tasks for column movement
   */
  public evaluateAllTasks(tasks: Task[]): ColumnEvaluationResult[] {
    return tasks
      .filter(task => task.status !== 'completed')
      .map(task => this.evaluateSingleTask(task))
      .filter(result => result.shouldMove);
  }

  /**
   * Evaluate a single task for column movement
   */
  public evaluateSingleTask(task: Task): ColumnEvaluationResult {
    const currentDateTime = getCurrentDateTimeInTimezone(this.userTimezone);
    const currentColumn = task.column;
    
    // Check for overdue tasks first (highest priority)
    if (this.isTaskOverdue(task)) {
      return {
        taskId: task.id,
        currentColumn,
        recommendedColumn: 'Overdue',
        reason: 'Task is overdue',
        priority: 'high',
        shouldMove: currentColumn !== 'Overdue'
      };
    }

    // Check if task should be in Today column
    if (this.shouldBeInToday(task, currentDateTime)) {
      return {
        taskId: task.id,
        currentColumn,
        recommendedColumn: 'Today',
        reason: 'Task is due today',
        priority: 'high',
        shouldMove: currentColumn !== 'Today'
      };
    }

    // Check if task should be in This Week column
    if (this.shouldBeInThisWeek(task, currentDateTime)) {
      return {
        taskId: task.id,
        currentColumn,
        recommendedColumn: 'This Week',
        reason: 'Task is due this week',
        priority: 'medium',
        shouldMove: currentColumn !== 'This Week'
      };
    }

    // Default to Upcoming task
    return {
      taskId: task.id,
      currentColumn,
      recommendedColumn: 'Upcoming task',
      reason: 'Task is in the future',
      priority: 'low',
      shouldMove: currentColumn !== 'Upcoming task'
    };
  }

  /**
   * Check if a task is overdue
   */
  private isTaskOverdue(task: Task): boolean {
    const currentDateTime = getCurrentDateTimeInTimezone(this.userTimezone);
    
    // Priority 1: Check scheduled time
    if (task.scheduledTime) {
      let scheduledDateTime = toZonedTime(task.scheduledTime, this.userTimezone);
      
      // Round up by 1 minute if there are seconds
      if (scheduledDateTime.getSeconds() > 0) {
        scheduledDateTime = new Date(scheduledDateTime.getTime() + 60000);
      }
      
      return scheduledDateTime < currentDateTime;
    }
    
    // Priority 2: Check scheduled date only
    if (task.scheduledDate) {
      const scheduledDate = new Date(`${task.scheduledDate}T00:00:00`);
      return scheduledDate < currentDateTime;
    }
    
    // Priority 3: Check deadline
    if (task.deadline) {
      let deadlineDateTime = toZonedTime(new Date(task.deadline), this.userTimezone);
      
      // Round up by 1 minute if there are seconds
      if (deadlineDateTime.getSeconds() > 0) {
        deadlineDateTime = new Date(deadlineDateTime.getTime() + 60000);
      }
      
      return deadlineDateTime < currentDateTime;
    }
    
    return false;
  }

  /**
   * Check if a task should be in Today column
   */
  private shouldBeInToday(task: Task, currentDateTime: Date): boolean {
    // Check if task is scheduled for today
    if (task.scheduledTime) {
      let scheduledDateTime = toZonedTime(task.scheduledTime, this.userTimezone);
      
      if (scheduledDateTime.getSeconds() > 0) {
        scheduledDateTime = new Date(scheduledDateTime.getTime() + 60000);
      }
      
      return scheduledDateTime.toDateString() === currentDateTime.toDateString();
    }
    
    if (task.scheduledDate) {
      const scheduledDate = new Date(`${task.scheduledDate}T00:00:00`);
      return scheduledDate.toDateString() === currentDateTime.toDateString();
    }
    
    if (task.deadline) {
      let deadlineDateTime = toZonedTime(new Date(task.deadline), this.userTimezone);
      
      if (deadlineDateTime.getSeconds() > 0) {
        deadlineDateTime = new Date(deadlineDateTime.getTime() + 60000);
      }
      
      return deadlineDateTime.toDateString() === currentDateTime.toDateString();
    }
    
    return false;
  }

  /**
   * Check if a task should be in This Week column
   */
  private shouldBeInThisWeek(task: Task, currentDateTime: Date): boolean {
    // Get start and end of current week (Monday to Sunday)
    const startOfWeek = new Date(currentDateTime);
    startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Check if task falls within this week
    if (task.scheduledTime) {
      let scheduledDateTime = toZonedTime(task.scheduledTime, this.userTimezone);
      
      if (scheduledDateTime.getSeconds() > 0) {
        scheduledDateTime = new Date(scheduledDateTime.getTime() + 60000);
      }
      
      return scheduledDateTime >= startOfWeek && scheduledDateTime <= endOfWeek;
    }
    
    if (task.scheduledDate) {
      const scheduledDate = new Date(`${task.scheduledDate}T00:00:00`);
      return scheduledDate >= startOfWeek && scheduledDate <= endOfWeek;
    }
    
    if (task.deadline) {
      let deadlineDateTime = toZonedTime(new Date(task.deadline), this.userTimezone);
      
      if (deadlineDateTime.getSeconds() > 0) {
        deadlineDateTime = new Date(deadlineDateTime.getTime() + 60000);
      }
      
      return deadlineDateTime >= startOfWeek && deadlineDateTime <= endOfWeek;
    }
    
    return false;
  }

  /**
   * Get tasks that need immediate attention (overdue or due today)
   */
  public getUrgentTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      
      return this.isTaskOverdue(task) || this.shouldBeInToday(task, getCurrentDateTimeInTimezone(this.userTimezone));
    });
  }

  /**
   * Get tasks that are overdue
   */
  public getOverdueTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      return this.isTaskOverdue(task);
    });
  }

  /**
   * Get tasks due today
   */
  public getTodayTasks(tasks: Task[]): Task[] {
    const currentDateTime = getCurrentDateTimeInTimezone(this.userTimezone);
    
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      return this.shouldBeInToday(task, currentDateTime);
    });
  }

  /**
   * Get tasks due this week
   */
  public getThisWeekTasks(tasks: Task[]): Task[] {
    const currentDateTime = getCurrentDateTimeInTimezone(this.userTimezone);
    
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      return this.shouldBeInThisWeek(task, currentDateTime);
    });
  }
} 