'use client';

import React from 'react';
import { useDrop } from 'react-dnd';
import { DragItem } from '@/lib/types';

interface TrashDropZoneProps {
  onDeleteTask: (taskId: string) => void;
  isDragging: boolean;
}

export const TrashDropZone: React.FC<TrashDropZoneProps> = ({ onDeleteTask, isDragging }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'TASK',
    drop: (item: DragItem) => {
      onDeleteTask(item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Only show when dragging
  if (!isDragging) {
    return null;
  }

  return (
    <div
      ref={drop as any}
      className={`
        relative p-3 rounded-full shadow-lg transition-all duration-200
        ${isOver && canDrop 
          ? 'bg-red-500 text-white scale-110' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${canDrop ? 'cursor-pointer' : 'cursor-not-allowed'}
      `}
      style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Circle effect when task is near */}
      {isOver && canDrop && (
        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
      )}
      <div className="relative z-10">
        <svg 
          className={`w-6 h-6 transition-all duration-200 ${isOver && canDrop ? 'scale-125' : ''}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    </div>
  );
}; 