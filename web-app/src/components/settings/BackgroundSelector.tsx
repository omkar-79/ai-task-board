'use client';

import React from 'react';

interface BackgroundSelectorProps {
  selectedBackground: string;
  onBackgroundChange: (background: string) => void;
}

// Available background images
const BACKGROUND_OPTIONS = [
  { id: 'default', name: 'Default', image: null },
  { id: 'background-6668151_1920.jpg', name: 'Abstract', image: '/images/background/background-6668151_1920.jpg' },
  { id: 'ocean-1867285_1920.jpg', name: 'Ocean', image: '/images/background/ocean-1867285_1920.jpg' },
  { id: 'background-2651266_1920.jpg', name: 'Nature', image: '/images/background/background-2651266_1920.jpg' },
  { id: 'background-7025417_1920.png', name: 'Geometric', image: '/images/background/background-7025417_1920.png' },
  { id: 'feather-4431599_1920.jpg', name: 'Feather', image: '/images/background/feather-4431599_1920.jpg' },
  { id: 'fruit-2310212_1920.jpg', name: 'Fruit', image: '/images/background/fruit-2310212_1920.jpg' },
  { id: 'marble-2398946_1920.jpg', name: 'Marble', image: '/images/background/marble-2398946_1920.jpg' },
  { id: 'leaves-5643327_1920.png', name: 'Leaves', image: '/images/background/leaves-5643327_1920.png' },
  { id: 'leaves-6640617_1920.jpg', name: 'Green Leaves', image: '/images/background/leaves-6640617_1920.jpg' },
];

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  selectedBackground,
  onBackgroundChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Background Theme</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose a background image for your task board. The selection will be saved automatically.
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {BACKGROUND_OPTIONS.map((option) => (
          <div
            key={option.id}
            className={`
              relative cursor-pointer rounded-lg border-2 transition-all duration-200 hover:scale-105
              ${selectedBackground === option.id 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => onBackgroundChange(option.id)}
          >
            {option.image ? (
              <div className="aspect-video rounded-md overflow-hidden">
                <img
                  src={option.image}
                  alt={option.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-md bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-sm font-medium">Default</span>
              </div>
            )}
            
            <div className="p-2">
              <p className="text-xs font-medium text-gray-700 text-center">
                {option.name}
              </p>
            </div>
            
            {selectedBackground === option.id && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        <p>💡 Tip: Choose a background that helps you stay focused and productive!</p>
      </div>
    </div>
  );
}; 