// Main exports for the task movement system
import { TaskMovementEngine, type MovementResult, type MovementEngineConfig } from './movementEngine';
import { ColumnEvaluator, type ColumnEvaluationResult } from './columnEvaluator';
import { TimeMonitor, type TimeBasedMovement, type MonitoringConfig } from './timeMonitor';
import type { Task, ColumnId } from '@/lib/types';

export { TaskMovementEngine, type MovementResult, type MovementEngineConfig } from './movementEngine';
export { ColumnEvaluator, type ColumnEvaluationResult } from './columnEvaluator';
export { TimeMonitor, type TimeBasedMovement, type MonitoringConfig } from './timeMonitor';

// Re-export types for convenience
export type { Task, ColumnId } from '@/lib/types';

// Main task movement manager that combines all components
export class TaskMovementManager {
  private movementEngine: TaskMovementEngine;
  private columnEvaluator: ColumnEvaluator;
  private timeMonitor: TimeMonitor;

  constructor(userTimezone: string) {
    this.movementEngine = new TaskMovementEngine({
      userTimezone,
      enableAutomaticMovement: true,
      checkIntervalMinutes: 1
    });

    this.columnEvaluator = new ColumnEvaluator(userTimezone);

    this.timeMonitor = new TimeMonitor({
      userTimezone,
      checkIntervalMinutes: 1,
      enableRealTimeMonitoring: true,
      enableScheduledChecks: true
    });
  }

  /**
   * Evaluate all tasks for movement and return results
   */
  public evaluateAllMovements(tasks: Task[]): {
    movements: MovementResult[];
    evaluations: ColumnEvaluationResult[];
    timeBasedMovements: TimeBasedMovement[];
    stats: {
      totalTasks: number;
      overdueTasks: number;
      todayTasks: number;
      thisWeekTasks: number;
      urgentTasks: number;
    };
  } {
    const movements = this.movementEngine.evaluateTaskMovements(tasks);
    const evaluations = this.columnEvaluator.evaluateAllTasks(tasks);
    const timeBasedMovements = this.timeMonitor.monitorTasks(tasks);
    const stats = this.timeMonitor.getMonitoringStats(tasks);

    return {
      movements,
      evaluations,
      timeBasedMovements,
      stats
    };
  }

  /**
   * Get urgent tasks that need immediate attention
   */
  public getUrgentTasks(tasks: Task[]): Task[] {
    return this.timeMonitor.getUrgentTasks(tasks);
  }

  /**
   * Get overdue tasks
   */
  public getOverdueTasks(tasks: Task[]): Task[] {
    return this.columnEvaluator.getOverdueTasks(tasks);
  }

  /**
   * Get tasks due today
   */
  public getTodayTasks(tasks: Task[]): Task[] {
    return this.columnEvaluator.getTodayTasks(tasks);
  }

  /**
   * Get tasks due this week
   */
  public getThisWeekTasks(tasks: Task[]): Task[] {
    return this.columnEvaluator.getThisWeekTasks(tasks);
  }

  /**
   * Update configuration for all components
   */
  public updateConfig(userTimezone: string): void {
    this.movementEngine.updateConfig({ userTimezone });
    this.columnEvaluator = new ColumnEvaluator(userTimezone);
    this.timeMonitor.updateConfig({ userTimezone });
  }

  /**
   * Check if a task is overdue
   */
  public isTaskOverdue(task: Task): boolean {
    return this.movementEngine.isTaskOverdue(task);
  }

  /**
   * Check if a task should move to Today column
   */
  public shouldMoveToToday(task: Task): boolean {
    return this.movementEngine.shouldMoveToToday(task);
  }

  /**
   * Check if a task should move to This Week column
   */
  public shouldMoveToThisWeek(task: Task): boolean {
    return this.movementEngine.shouldMoveToThisWeek(task);
  }
} 