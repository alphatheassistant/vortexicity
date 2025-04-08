import React, { createContext, useContext, useState, useEffect } from 'react';
import { editor } from 'monaco-editor';
import { useFileSystem } from './FileSystemContext';
import { toast } from 'sonner';

interface TabInfo {
  id: string;
  name: string;
  language: string;
  path: string;
  isModified: boolean;
  content?: string; // Store content per tab
}

export interface EditorContextType {
  openedTabs: TabInfo[];
  activeTabId: string | null;
  monacoInstance: editor.IStandaloneCodeEditor | null;
  openTab: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateMonacoInstance: (instance: editor.IStandaloneCodeEditor | null) => void;
  saveActiveFile: () => void;
  saveAllFiles: () => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  getTabContent: (tabId: string) => string;
  updateTabContent: (tabId: string, content: string) => void;
  undoLastAction: () => void;
  redoLastAction: () => void;
}

interface EditorHistoryAction {
  type: 'content' | 'tab' | 'delete';
  tabId: string;
  content?: string;
  previousContent?: string;
  tabInfo?: TabInfo;
}

const STORAGE_KEY_PREFIX = 'code-editor-tab-';
const TABS_STORAGE_KEY = 'code-editor-tabs';
const ACTIVE_TAB_KEY = 'code-editor-active-tab';

export const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getFileById, updateFileContent, selectFile } = useFileSystem();
  const [openedTabs, setOpenedTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [undoStack, setUndoStack] = useState<EditorHistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<EditorHistoryAction[]>([]);

  // Load tabs from session storage on initial load
  useEffect(() => {
    try {
      const savedTabsJson = sessionStorage.getItem(TABS_STORAGE_KEY);
      const savedActiveTab = sessionStorage.getItem(ACTIVE_TAB_KEY);
      
      if (savedTabsJson) {
        const savedTabs: TabInfo[] = JSON.parse(savedTabsJson);
        
        // Load content for each tab from session storage
        const loadedTabs = savedTabs.map(tab => {
          const savedContent = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${tab.id}`);
          return {
            ...tab,
            content: savedContent || ''
          };
        });
        
        setOpenedTabs(loadedTabs);
        
        if (savedActiveTab) {
          setActiveTabId(savedActiveTab);
          selectFile(savedActiveTab);
        }
      }
    } catch (error) {
      console.error('Error loading saved tabs:', error);
    }
  }, []);

  // Save tabs to session storage whenever they change
  useEffect(() => {
    try {
      // Store tab metadata without content to reduce storage size
      const tabsForStorage = openedTabs.map(({ id, name, language, path, isModified }) => ({
        id, name, language, path, isModified
      }));
      
      sessionStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabsForStorage));
      
      // Save content for each tab separately
      openedTabs.forEach(tab => {
        if (tab.content !== undefined) {
          sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${tab.id}`, tab.content);
        }
      });
      
      if (activeTabId) {
        sessionStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
      }
    } catch (error) {
      console.error('Error saving tabs to session storage:', error);
    }
  }, [openedTabs, activeTabId]);

  // Get tab content - first check in memory, then session storage, then file system
  const getTabContent = (tabId: string): string => {
    // Check in memory first
    const tab = openedTabs.find(t => t.id === tabId);
    if (tab?.content !== undefined) {
      return tab.content;
    }
    
    // Check in session storage
    const storedContent = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${tabId}`);
    if (storedContent !== null) {
      return storedContent;
    }
    
    // Fall back to file system
    const file = getFileById(tabId);
    return file?.content || '';
  };

  // Update tab content in memory and session storage
  const updateTabContent = (tabId: string, content: string) => {
    // Add to undo stack first
    const tab = openedTabs.find(t => t.id === tabId);
    if (tab) {
      const previousContent = tab.content;
      setUndoStack(prev => [...prev, {
        type: 'content',
        tabId,
        previousContent,
        content
      }]);
      setRedoStack([]);
    }
    
    // Update content in memory
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, content, isModified: true } 
          : tab
      )
    );
    
    // Update session storage
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${tabId}`, content);
  };

  // Open a tab for a file
  const openTab = (fileId: string) => {
    const file = getFileById(fileId);
    
    if (!file || file.type !== 'file') return;
    
    // Check if tab is already open
    const existingTab = openedTabs.find(tab => tab.id === fileId);
    
    if (!existingTab) {
      // Get content from file system
      const content = file.content || '';
      
      // Add new tab
      const newTab: TabInfo = {
        id: fileId,
        name: file.name,
        language: file.language || 'plaintext',
        path: file.path,
        isModified: false,
        content
      };
      
      setOpenedTabs(prevTabs => [...prevTabs, newTab]);
      
      // Save to session storage
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${fileId}`, content);
    }
    
    // Set as active tab
    setActiveTabId(fileId);
    selectFile(fileId);
  };

  // Close a tab
  const closeTab = (tabId: string) => {
    // Add to undo stack
    const tab = openedTabs.find(t => t.id === tabId);
    if (tab) {
      setUndoStack(prev => [...prev, {
        type: 'tab',
        tabId,
        tabInfo: tab
      }]);
      setRedoStack([]);
    }
    
    setOpenedTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
    
    // Remove from session storage
    sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${tabId}`);
    
    // If closing the active tab, select another one
    if (activeTabId === tabId) {
      const newActiveTab = openedTabs.length > 1 ? 
        openedTabs.find(tab => tab.id !== tabId)?.id || null : 
        null;
      
      setActiveTabId(newActiveTab);
      if (newActiveTab) {
        selectFile(newActiveTab);
      }
    }
  };

  // Set active tab
  const setActiveTab = (tabId: string) => {
    setActiveTabId(tabId);
    selectFile(tabId);
  };

  // Update Monaco editor instance
  const updateMonacoInstance = (instance: editor.IStandaloneCodeEditor | null) => {
    setMonacoInstance(instance);
  };

  // Save the active file
  const saveActiveFile = () => {
    if (!activeTabId) return;
    
    const tabContent = getTabContent(activeTabId);
    
    // Update file in file system
    updateFileContent(activeTabId, tabContent);
    
    // Update tab state to remove modified indicator
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId ? { ...tab, isModified: false } : tab
      )
    );
    
    toast.success(`File ${openedTabs.find(tab => tab.id === activeTabId)?.name} saved`);
  };

  // Save all open files
  const saveAllFiles = () => {
    openedTabs.forEach(tab => {
      const content = getTabContent(tab.id);
      updateFileContent(tab.id, content);
    });
    
    // Mark all tabs as unmodified
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => ({ ...tab, isModified: false }))
    );
    
    toast.success('All files saved');
  };

  // Move tab (for drag and drop reordering)
  const moveTab = (fromIndex: number, toIndex: number) => {
    setOpenedTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
  };

  // Undo last action
  const undoLastAction = () => {
    const lastAction = undoStack[undoStack.length - 1];
    if (!lastAction) return;
    
    // Remove from undo stack
    setUndoStack(prev => prev.slice(0, -1));
    
    // Add to redo stack
    setRedoStack(prev => [...prev, lastAction]);
    
    // Perform the undo
    if (lastAction.type === 'content' && lastAction.previousContent !== undefined) {
      // Restore previous content
      setOpenedTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === lastAction.tabId 
            ? { ...tab, content: lastAction.previousContent, isModified: true } 
            : tab
        )
      );
      
      // Update session storage
      if (lastAction.previousContent) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${lastAction.tabId}`, lastAction.previousContent);
      }
      
      toast.info('Undid last edit');
    } else if (lastAction.type === 'tab' && lastAction.tabInfo) {
      // Restore closed tab
      setOpenedTabs(prevTabs => [...prevTabs, lastAction.tabInfo!]);
      
      // Restore content in session storage
      if (lastAction.tabInfo.content) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${lastAction.tabId}`, lastAction.tabInfo.content);
      }
      
      toast.info(`Restored tab: ${lastAction.tabInfo.name}`);
    }
  };

  // Redo last undone action
  const redoLastAction = () => {
    const lastRedoAction = redoStack[redoStack.length - 1];
    if (!lastRedoAction) return;
    
    // Remove from redo stack
    setRedoStack(prev => prev.slice(0, -1));
    
    // Add to undo stack
    setUndoStack(prev => [...prev, lastRedoAction]);
    
    // Perform the redo
    if (lastRedoAction.type === 'content') {
      // Apply the content
      setOpenedTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === lastRedoAction.tabId 
            ? { ...tab, content: lastRedoAction.content, isModified: true } 
            : tab
        )
      );
      
      // Update session storage
      if (lastRedoAction.content) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${lastRedoAction.tabId}`, lastRedoAction.content);
      }
      
      toast.info('Redid last edit');
    } else if (lastRedoAction.type === 'tab') {
      // Remove the tab again
      setOpenedTabs(prevTabs => prevTabs.filter(tab => tab.id !== lastRedoAction.tabId));
      
      // Remove from session storage
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${lastRedoAction.tabId}`);
      
      toast.info(`Closed tab: ${lastRedoAction.tabInfo?.name}`);
    }
  };

  return (
    <EditorContext.Provider value={{
      openedTabs,
      activeTabId,
      monacoInstance,
      openTab,
      closeTab,
      setActiveTab,
      updateMonacoInstance,
      saveActiveFile,
      saveAllFiles,
      moveTab,
      getTabContent,
      updateTabContent,
      undoLastAction,
      redoLastAction
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
