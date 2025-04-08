import { useContext } from 'react';
import { FileSystemContext, FileSystemContextType } from '@/contexts/FileSystemContext';

interface FileSystemHookReturn extends FileSystemContextType {
  getFileContent: (path: string) => string;
}

export const useFileSystem = (): FileSystemHookReturn => {
  const context = useContext(FileSystemContext);
  
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  
  // Add the missing properties that AICoworker needs
  return {
    ...context,
    getFileContent: (path: string) => {
      const file = context.files.find(f => f.path === path);
      return file?.content || '';
    },
  };
}; 