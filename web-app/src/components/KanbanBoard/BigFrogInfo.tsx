'use client';

import React from 'react';
import { BigFrogTask } from '@/lib/bigFrog';

interface BigFrogInfoProps {
  bigFrogTasks: BigFrogTask[];
}

export const BigFrogInfo: React.FC<BigFrogInfoProps> = ({ bigFrogTasks }) => {
  if (bigFrogTasks.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <img 
            src="/images/frog.png" 
            alt="Big Frog" 
            className="w-6 h-6"
          />
          <h3 className="text-sm font-semibold text-yellow-800">🐸 Big Frog Feature</h3>
        </div>
        <p className="text-xs text-yellow-700 mt-1">
          Mark high priority tasks as "Big Frog" to identify the most important task in each column. 
          Big Frog tasks are automatically selected based on priority, duration, and timing.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <img 
          src="/images/frog.png" 
          alt="Big Frog" 
          className="w-6 h-6 animate-bounce"
        />
        <h3 className="text-sm font-semibold text-green-800">🐸 Big Frog Tasks</h3>
      </div>
      <div className="space-y-2">
        {bigFrogTasks.map((bigFrog) => (
          <div key={bigFrog.taskId} className="flex items-center gap-2 text-xs">
            <span className="font-medium text-green-700">{bigFrog.columnId}:</span>
            <span className="text-green-600">{bigFrog.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
}; 