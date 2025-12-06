import React, { createContext, useContext, useState, useCallback } from 'react';
import { DevContextType, DevLog } from '../types';

const DevContext = createContext<DevContextType | undefined>(undefined);

export const DevProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [codeSnippet, setCodeSnippet] = useState<string>('// Select a demo to view implementation details');
  const [isOpen, setIsOpen] = useState(false);

  const addLog = useCallback((log: Omit<DevLog, 'id' | 'timestamp'>) => {
    const newLog: DevLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
    };
    setLogs((prev) => [newLog, ...prev]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <DevContext.Provider value={{ logs, addLog, clearLogs, codeSnippet, setCodeSnippet, isOpen, setIsOpen }}>
      {children}
    </DevContext.Provider>
  );
};

export const useDevConsole = () => {
  const context = useContext(DevContext);
  if (context === undefined) {
    throw new Error('useDevConsole must be used within a DevProvider');
  }
  return context;
};