'use client';

import React, { createContext, useContext, useState } from 'react';

interface DragContextType {
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export const useDrag = () => {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
};

interface DragProviderProps {
  children: React.ReactNode;
}

export const DragProvider: React.FC<DragProviderProps> = ({ children }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <DragContext.Provider value={{ isDragging, setIsDragging }}>
      {children}
    </DragContext.Provider>
  );
}; 