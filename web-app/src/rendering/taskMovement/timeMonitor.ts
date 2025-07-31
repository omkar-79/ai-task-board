import { Task, ColumnId } from '@/lib/types';
import { getCurrentDateTimeInTimezone } from '@/lib/time';
import { toZonedTime } from 'date-fns-tz';

export interface TimeBasedMovement {
  taskId: string;
  fromColumn: ColumnId;
  toColumn: ColumnId;
  triggerTime: Date;
  reason: string;
  priority: 'immediate' | 'scheduled' | 'background';
}

export interface MonitoringConfig {
  userTimezone: string;
  checkIntervalMinutes: number;
  enableRealTimeMonitoring: boolean;
  enableScheduledChecks: boolean;
}

export class TimeMonitor {
  private config: MonitoringConfig;
  private scheduledMovements: Map<string, TimeBasedMovement> = new Map();
  private lastCheckTime: Date = new Date();

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  /**
   * Monitor tasks for time-based movements
   */
  public monitorTasks(tasks: Task[]): TimeBasedMovement[] {
    const movements: TimeBasedMovement[] = [];
    const currentDateTime = getCurrentDateTimeInTimezone(this.config.userTimezone);

    // Check for immediate movements (overdue tasks)
    const immediateMovements = this.checkImmediateMovements(tasks, currentDateTime);
    movements.push(...immediateMovements);

    // Check for scheduled movements (tasks that should move at specific times)
    const scheduledMovements = this.checkScheduledMovements(tasks, currentDateTime);
    movements.push(...scheduledMovements);

    // Update last check time
    this.lastCheckTime = currentDateTime;

    return movements;
  }

  /**
   * Check for immediate movements (overdue tasks)
   */
  private checkImmediateMovements(tasks: Task[], currentDateTime: Date): TimeBasedMovement[] {
    const movements: TimeBasedMovement[] = [];

    for (const task of tasks) {
      if (task.status === 'completed') continue;

      // Check if task is overdue
      if (this.isTaskOverdue(task, currentDateTime)) {
        if (task.column !== 'Overdue') {
          movements.push({
            taskId: task.id,
            fromColumn: task.column,
            toColumn: 'Overdue',
            triggerTime: currentDateTime,
            reason: 'Task is overdue',
            priority: 'immediate'
          });
        }
      }

      // Check if task should move to Today
      if (this.shouldMoveToToday(task, currentDateTime)) {
        if (task.column !== 'Today') {
          movements.push({
            taskId: task.id,
            fromColumn: task.column,
            toColumn: 'Today',
            triggerTime: currentDateTime,
            reason: 'Task is due today',
            priority: 'immediate'
          });
        }
      }

      // Check if task should move to This Week
      if (this.shouldMoveToThisWeek(task, currentDateTime)) {
        if (task.column !== 'This Week') {
          movements.push({
            taskId: task.id,
            fromColumn: task.column,
            toColumn: 'This Week',
            triggerTime: currentDateTime,
            reason: 'Task is due this week',
            priority: 'immediate'
          });
        }
      }
    }

    return movements;
  }

  /**
   * Check for scheduled movements (tasks that should move at specific times)
   */
  private checkScheduledMovements(tasks: Task[], currentDateTime: Date): TimeBasedMovement[] {
    const movements: TimeBasedMovement[] = [];

    for (const task of tasks) {
      if (task.status === 'completed') continue;

      // Check recurring tasks for time-based movements
      if (task.recurrence === 'everyday' || task.recurrence === 'everyweek') {
        const scheduledMovement = this.checkRecurringTaskMovement(task, currentDateTime);
        if (scheduledMovement) {
          movements.push(scheduledMovement);
        }
      }

      // Check one-time tasks for deadline-based movements
      if (task.recurrence === 'once') {
        const deadlineMovement = this.checkDeadlineBasedMovement(task, currentDateTime);
        if (deadlineMovement) {
          movements.push(deadlineMovement);
        }
      }
    }

    return movements;
  }

  /**
   * Check if a task is overdue
   */
  private isTaskOverdue(task: Task, currentDateTime: Date): boolean {
    // Priority 1: Check scheduled time
    if (task.scheduledTime) {
      let scheduledDateTime = toZonedTime(task.scheduledTime, this.config.userTimezone);
      
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
      let deadlineDateTime = toZonedTime(new Date(task.deadline), this.config.userTimezone);
      
      // Round up by 1 minute if there are seconds
      if (deadlineDateTime.getSeconds() > 0) {
        deadlineDateTime = new Date(deadlineDateTime.getTime() + 60000);
      }
      
      return deadlineDateTime < currentDateTime;
    }
    
    return false;
  }

  /**
   * Check if a task should move to Today column
   */
  private shouldMoveToToday(task: Task, currentDateTime: Date): boolean {
    // Check if task is scheduled for today
    if (task.scheduledTime) {
      let scheduledDateTime = toZonedTime(task.scheduledTime, this.config.userTimezone);
      
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
      let deadlineDateTime = toZonedTime(new Date(task.deadline), this.config.userTimezone);
      
      if (deadlineDateTime.getSeconds() > 0) {
        deadlineDateTime = new Date(deadlineDateTime.getTime() + 60000);
      }
      
      return deadlineDateTime.toDateString() === currentDateTime.toDateString();
    }
    
    return false;
  }

  /**
   * Check if a task should move to This Week column
   */
  private shouldMoveToThisWeek(task: Task, currentDateTime: Date): boolean {
    // Get start and end of current week (Monday to Sunday)
    const startOfWeek = new Date(currentDateTime);
    startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    // Check if task falls within this week
    if (task.scheduledTime) {
      let scheduledDateTime = toZonedTime(task.scheduledTime, this.config.userTimezone);
      
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
      let deadlineDateTime = toZonedTime(new Date(task.deadline), this.config.userTimezone);
      
      if (deadlineDateTime.getSeconds() > 0) {
        deadlineDateTime = new Date(deadlineDateTime.getTime() + 60000);
      }
      
      return deadlineDateTime >= startOfWeek && deadlineDateTime <= endOfWeek;
    }
    
    return false;
  }

  /**
   * Check recurring task movement (daily/weekly tasks)
   */
  private checkRecurringTaskMovement(task: Task, currentDateTime: Date): TimeBasedMovement | null {
    // For daily tasks, check if it's time to move from Today to Overdue
    if (task.recurrence === 'everyday' && task.recurrenceTimeUTC) {
      let scheduledDateTime = toZonedTime(new Date(task.recurrenceTimeUTC), this.config.userTimezone);
      
      if (scheduledDateTime.getSeconds() > 0) {
        scheduledDateTime = new Date(scheduledDateTime.getTime() + 60000);
      }

      if (task.column === 'Today' && scheduledDateTime < currentDateTime) {
        return {
          taskId: task.id,
          fromColumn: 'Today',
          toColumn: 'Overdue',
          triggerTime: currentDateTime,
          reason: 'Daily task time has passed',
          priority: 'scheduled'
        };
      }
    }

    // For weekly tasks, check if it's the right day and time
    if (task.recurrence === 'everyweek' && task.recurrenceTimeUTC && task.recurrenceDay) {
      const currentDay = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (currentDay === task.recurrenceDay) {
        let scheduledDateTime = toZonedTime(new Date(task.recurrenceTimeUTC), this.config.userTimezone);
        
        if (scheduledDateTime.getSeconds() > 0) {
          scheduledDateTime = new Date(scheduledDateTime.getTime() + 60000);
        }

        if (scheduledDateTime < currentDateTime && task.column === 'Today') {
          return {
            taskId: task.id,
            fromColumn: 'Today',
            toColumn: 'Overdue',
            triggerTime: currentDateTime,
            reason: 'Weekly task time has passed',
            priority: 'scheduled'
          };
        }
      }
    }

    return null;
  }

  /**
   * Check deadline-based movement for one-time tasks
   */
  private checkDeadlineBasedMovement(task: Task, currentDateTime: Date): TimeBasedMovement | null {
    if (!task.deadline) return null;

    let deadlineDateTime = toZonedTime(new Date(task.deadline), this.config.userTimezone);
    
    if (deadlineDateTime.getSeconds() > 0) {
      deadlineDateTime = new Date(deadlineDateTime.getTime() + 60000);
    }

    // If deadline has passed and task is not in Overdue column
    if (deadlineDateTime < currentDateTime && task.column !== 'Overdue') {
      return {
        taskId: task.id,
        fromColumn: task.column,
        toColumn: 'Overdue',
        triggerTime: currentDateTime,
        reason: 'Task deadline has passed',
        priority: 'scheduled'
      };
    }

    return null;
  }

  /**
   * Get tasks that need immediate attention
   */
  public getUrgentTasks(tasks: Task[]): Task[] {
    const currentDateTime = getCurrentDateTimeInTimezone(this.config.userTimezone);
    
    return tasks.filter(task => {
      if (task.status === 'completed') return false;
      
      return this.isTaskOverdue(task, currentDateTime) || 
             this.shouldMoveToToday(task, currentDateTime);
    });
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get monitoring statistics
   */
  public getMonitoringStats(tasks: Task[]): {
    totalTasks: number;
    overdueTasks: number;
    todayTasks: number;
    thisWeekTasks: number;
    urgentTasks: number;
  } {
    const currentDateTime = getCurrentDateTimeInTimezone(this.config.userTimezone);
    
    const overdueTasks = tasks.filter(task => 
      task.status !== 'completed' && this.isTaskOverdue(task, currentDateTime)
    );
    
    const todayTasks = tasks.filter(task => 
      task.status !== 'completed' && this.shouldMoveToToday(task, currentDateTime)
    );
    
    const thisWeekTasks = tasks.filter(task => 
      task.status !== 'completed' && this.shouldMoveToThisWeek(task, currentDateTime)
    );
    
    const urgentTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      (this.isTaskOverdue(task, currentDateTime) || this.shouldMoveToToday(task, currentDateTime))
    );

    return {
      totalTasks: tasks.filter(task => task.status !== 'completed').length,
      overdueTasks: overdueTasks.length,
      todayTasks: todayTasks.length,
      thisWeekTasks: thisWeekTasks.length,
      urgentTasks: urgentTasks.length
    };
  }
} 