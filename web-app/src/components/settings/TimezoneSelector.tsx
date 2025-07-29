'use client';

import React, { useState } from 'react';
import { TIMEZONE_OPTIONS, getTimezoneDisplayName } from '@/lib/timezone';

interface TimezoneSelectorProps {
  currentTimezone: string;
  onTimezoneChange: (timezone: string) => void;
  className?: string;
}

export const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({
  currentTimezone,
  onTimezoneChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTimezoneChange = (timezone: string) => {
    onTimezoneChange(timezone);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            {getTimezoneDisplayName(currentTimezone)}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {TIMEZONE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimezoneChange(option.value)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                currentTimezone === option.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}; 