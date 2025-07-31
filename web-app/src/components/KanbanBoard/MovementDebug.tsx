'use client';

import React from 'react';
import { Task } from '@/lib/types';
import { TaskMovementManager } from '@/rendering/taskMovement';

interface MovementDebugProps {
  tasks: Task[];
  userTimezone: string;
}

export const MovementDebug: React.FC<MovementDebugProps> = ({ tasks, userTimezone }) => {
  const [movementManager] = React.useState(() => new TaskMovementManager(userTimezone));
  const [movementResults, setMovementResults] = React.useState<any>(null);

  React.useEffect(() => {
    movementManager.updateConfig(userTimezone);
    const results = movementManager.evaluateAllMovements(tasks);
    setMovementResults(results);
  }, [tasks, userTimezone, movementManager]);

  if (!movementResults) return null;

  const { movements, stats } = movementResults;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <h3 className="text-sm font-semibold mb-2">Movement Debug</h3>
      
      <div className="text-xs space-y-1">
        <div>Total Tasks: {stats.totalTasks}</div>
        <div>Overdue: {stats.overdueTasks}</div>
        <div>Today: {stats.todayTasks}</div>
        <div>This Week: {stats.thisWeekTasks}</div>
        <div>Urgent: {stats.urgentTasks}</div>
      </div>

      {movements.length > 0 && (
        <div className="mt-2">
          <div className="text-xs font-semibold text-red-600">Movements Needed:</div>
          {movements.map((movement: any, index: number) => (
            <div key={index} className="text-xs text-gray-600">
              {movement.taskId.slice(0, 8)}: {movement.oldColumn} → {movement.newColumn}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 