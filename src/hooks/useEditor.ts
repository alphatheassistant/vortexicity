import { useContext } from 'react';
import { EditorContext, EditorContextType } from '@/contexts/EditorContext';

interface EditorHookReturn extends EditorContextType {
  activeFile: string | null;
  files: string[];
}

export const useEditor = (): EditorHookReturn => {
  const context = useContext(EditorContext);
  
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  
  // Add the missing properties that AICoworker needs
  return {
    ...context,
    activeFile: context.activeTabId,
    files: context.openedTabs.map(tab => tab.path),
  };
}; 