import { useContext } from 'react';
import { EditorContext, EditorContextType } from '@/contexts/EditorContext';

interface EditorHookReturn extends EditorContextType {
  activeFile: string | null;
  files: string[];
  openFile: (path: string) => Promise<void>;
  refreshFile: (path: string) => Promise<void>;
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
    openFile: async (path: string) => {
      // Open or focus the file in the editor
      if (!context.openedTabs.find(tab => tab.path === path)) {
        context.openTab(path);
      }
      context.setActiveTab(path);
    },
    refreshFile: async (path: string) => {
      // Refresh the file content in the editor
      const tab = context.openedTabs.find(tab => tab.path === path);
      if (tab) {
        // Re-open the tab to refresh its content
        context.closeTab(tab.id);
        context.openTab(tab.id);
      }
    }
  };
}; 
