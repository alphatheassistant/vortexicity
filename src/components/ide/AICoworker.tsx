import React, { useState, useEffect } from 'react';
import { AIChat } from './AIChat';
import { useAICoworker } from '@/hooks/useAICoworker';
import { useEditor } from '@/hooks/useEditor';
import { useFileSystem } from '@/hooks/useFileSystem';

export const AICoworker: React.FC = () => {
  const { apiKey } = useAICoworker();
  const { activeFile, files } = useEditor();
  const { getFileContent, readFile, writeFile, createFile, deleteFile } = useFileSystem();
  const [codebaseContext, setCodebaseContext] = useState('');

  // Get the current file's content for context
  const getCurrentFileContent = async () => {
    if (!activeFile) return '';
    try {
      const content = await readFile(activeFile);
      return content[0] || '';
    } catch (error) {
      console.error('Error reading current file:', error);
      return '';
    }
  };

  // Get the codebase context
  const getCodebaseContext = async () => {
    try {
      // Get all files in the project
      const allFiles = await readFile('.');
      
      // Get content for each file
      const fileContents = await Promise.all(
        allFiles.map(async filePath => {
          try {
            const content = await readFile(filePath);
            return {
              path: filePath,
              content: content[0] || ''
            };
          } catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            return {
              path: filePath,
              content: '[Error reading file]'
            };
          }
        })
      );

      // Format the context
      const formattedContext = fileContents
        .map(file => `File: ${file.path}\nContent:\n${file.content}\n---\n`)
        .join('\n');

      return `Project Context:\n${formattedContext}`;
    } catch (error) {
      console.error('Error getting codebase context:', error);
      return 'Error: Unable to get codebase context';
    }
  };

  // Update codebase context when files or active file changes
  useEffect(() => {
    const updateContext = async () => {
      const context = await getCodebaseContext();
      setCodebaseContext(context);
    };
    updateContext();
  }, [activeFile, files]);

  const ensureDirectoryExists = async (filePath: string) => {
    const parts = filePath.split('/');
    parts.pop(); // Remove the file name
    if (parts.length === 0) return;

    let currentPath = '';
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      try {
        await readFile(currentPath);
      } catch (error) {
        // Directory doesn't exist, create it
        await createFile('', currentPath, 'folder');
      }
    }
  };

  const handleFileOperation = async (operation: { type: string; path: string; content: string }) => {
    try {
      console.log('Handling file operation:', operation);
      
      // Normalize the path to use forward slashes
      const normalizedPath = operation.path.replace(/\\/g, '/').replace(/^\/+/, '');
      
      switch (operation.type) {
        case 'edit':
          // Ensure the directory exists
          await ensureDirectoryExists(normalizedPath);
          
          try {
            // Try to read the file first
            await readFile(normalizedPath);
          } catch (error) {
            // File doesn't exist, create it
            const pathParts = normalizedPath.split('/');
            const fileName = pathParts.pop() || '';
            const parentPath = pathParts.join('/');
            await createFile(parentPath, fileName, 'file');
          }
          
          // Write the content
          await writeFile(normalizedPath, operation.content);
          console.log(`File edited: ${normalizedPath}`);
          break;

        case 'create':
          // Ensure the directory exists
          await ensureDirectoryExists(normalizedPath);
          
          // Create the file and write content
          const pathParts = normalizedPath.split('/');
          const fileName = pathParts.pop() || '';
          const parentPath = pathParts.join('/');
          
          if (!fileName) {
            throw new Error('Invalid file path');
          }
          
          await createFile(parentPath, fileName, 'file');
          await writeFile(normalizedPath, operation.content);
          console.log(`File created: ${normalizedPath}`);
          break;

        case 'delete':
          await deleteFile(normalizedPath);
          console.log(`File deleted: ${normalizedPath}`);
          break;

        default:
          console.log(`Unknown operation type: ${operation.type}`);
      }
      
      // Refresh the codebase context after operation
      const newContext = await getCodebaseContext();
      setCodebaseContext(newContext);
    } catch (error) {
      console.error('Error handling file operation:', error);
    }
  };

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center">
        <p className="text-muted-foreground">
          Please set your Gemini API key in the settings to use the AI assistant.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <p className="text-sm text-muted-foreground">
          Ask me anything about your code
        </p>
      </div>
      
      <AIChat
        apiKey={apiKey}
        codebaseContext={codebaseContext}
        onFileOperation={handleFileOperation}
      />
    </div>
  );
};
