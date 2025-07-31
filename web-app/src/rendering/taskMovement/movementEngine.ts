import { Task, ColumnId } from '@/lib/types';
import { determineTaskColumn } from '@/lib/utils';
import { getCurrentDateTimeInTimezone } from '@/lib/time';
import { toZonedTime } from 'date-fns-tz';

export interface MovementResult {
  taskId: string;
  oldColumn: ColumnId;
  newColumn: ColumnId;
  reason: string;
  moved: boolean;
}

export interface MovementEngineConfig {
  userTimezone: string;
  enableAutomaticMovement: boolean;
  checkIntervalMinutes: number;
}

export class TaskMovementEngine {
  private config: MovementEngineConfig;

  constructor(config: MovementEngineConfig) {
    this.config = config;
  }

  /**
   * Evaluate all tasks and determine which ones need to be moved
   */
  public evaluateTaskMovements(tasks: Task[]): MovementResult[] {
    if (!this.config.enableAutomaticMovement) {
      return [];
    }

    const movements: MovementResult[] = [];
    const currentDateTime = getCurrentDateTimeInTimezone(this.config.userTimezone);

    for (const task of tasks) {
      // Skip completed tasks
      if (task.status === 'completed') {
        continue;
      }

      const movement = this.evaluateSingleTaskMovement(task, currentDateTime);
      if (movement.moved) {
        movements.push(movement);
      }
    }

    return movements;
  }

  /**
   * Evaluate a single task for movement
   */
  private evaluateSingleTaskMovement(task: Task, currentDateTime: Date): MovementResult {
    const oldColumn = task.column;
    const newColumn = this.determineOptimalColumn(task, currentDateTime);
    
    if (oldColumn === newColumn) {
      return {
        taskId: task.id,
        oldColumn,
        newColumn,
        reason: 'No movement needed',
        moved: false
      };
    }

    const reason = this.getMovementReason(task, oldColumn, newColumn, currentDateTime);
    
    return {
      taskId: task.id,
      oldColumn,
      newColumn,
      reason,
      moved: true
    };
  }

  /**
   * Determine the optimal column for a task based on current time
   */
  private determineOptimalColumn(task: Task, currentDateTime: Date): ColumnId {
    // Create a temporary task object for column determination
    const tempTask = {
      ...task,
      // Use current time for evaluation
    };

    return determineTaskColumn(tempTask, this.config.userTimezone);
  }

  /**
   * Get a human-readable reason for the movement
   */
  private getMovementReason(task: Task, oldColumn: ColumnId, newColumn: ColumnId, currentDateTime: Date): string {
    const reasons: Record<string, string> = {
      'Today-Overdue': 'Task is now overdue',
      'This Week-Today': 'Task is due today',
      'This Week-Overdue': 'Task is now overdue',
      'Upcoming task-This Week': 'Task is now in this week',
      'Upcoming task-Today': 'Task is due today',
      'Upcoming task-Overdue': 'Task is now overdue',
      'Overdue-Today': 'Task deadline updated to today',
      'Overdue-This Week': 'Task deadline updated to this week',
      'Overdue-Upcoming task': 'Task deadline updated to upcoming',
    };

    const key = `${oldColumn}-${newColumn}`;
    return reasons[key] || `Moved from ${oldColumn} to ${newColumn}`;
  }

  /**
   * Check if a task is overdue
   */
  public isTaskOverdue(task: Task): boolean {
    const currentDateTime = getCurrentDateTimeInTimezone(this.config.userTimezone);
    
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
  public shouldMoveToToday(task: Task): boolean {
    const currentDateTime = getCurrentDateTimeInTimezone(this.config.userTimezone);
    
    // Check if task is scheduled for today
    if (task.scheduledTime) {
      let scheduledDate = toZonedTime(task.scheduledTime, this.config.userTimezone);
      
      if (scheduledDate.getSeconds() > 0) {
        scheduledDate = new Date(scheduledDate.getTime() + 60000);
      }
      
      return scheduledDate.toDateString() === currentDateTime.toDateString();
    }
    
    if (task.scheduledDate) {
      const scheduledDate = new Date(`${task.scheduledDate}T00:00:00`);
      return scheduledDate.toDateString() === currentDateTime.toDateString();
    }
    
    if (task.deadline) {
      let deadlineDate = toZonedTime(new Date(task.deadline), this.config.userTimezone);
      
      if (deadlineDate.getSeconds() > 0) {
        deadlineDate = new Date(deadlineDate.getTime() + 60000);
      }
      
      return deadlineDate.toDateString() === currentDateTime.toDateString();
    }
    
    // Check weekly recurring tasks
    if (task.recurrence === 'everyweek' && task.recurrenceTimeUTC && task.recurrenceDay) {
      const currentDay = currentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
      
      if (currentDay === task.recurrenceDay) {
        let scheduledDateTime = toZonedTime(new Date(task.recurrenceTimeUTC), this.config.userTimezone);
        
        if (scheduledDateTime.getSeconds() > 0) {
          scheduledDateTime = new Date(scheduledDateTime.getTime() + 60000);
        }
        
        // Check if the time hasn't passed yet
        return scheduledDateTime > currentDateTime;
      }
    }
    
    return false;
  }

  /**
   * Check if a task should move to This Week column
   */
  public shouldMoveToThisWeek(task: Task): boolean {
    const currentDateTime = getCurrentDateTimeInTimezone(this.config.userTimezone);
    
    // Get start and end of current week (Monday to Sunday)
    const startOfWeek = new Date(currentDateTime);
    startOfWeek.setDate(currentDateTime.getDate() - currentDateTime.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
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
    
    // Check weekly recurring tasks
    if (task.recurrence === 'everyweek' && task.recurrenceDay) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const targetDayOfWeek = dayNames.indexOf(task.recurrenceDay);
      
      if (targetDayOfWeek !== -1) {
        // Calculate days until the target day
        let daysUntilTarget = targetDayOfWeek - currentDateTime.getDay();
        if (daysUntilTarget < 0) {
          daysUntilTarget += 7; // Next week
        }
        
        // If the target day is this week (0-6 days away)
        return daysUntilTarget >= 0 && daysUntilTarget <= 6;
      }
    }
    
    return false;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<MovementEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
} 