import React, { useState, useEffect } from 'react';
import { AIChat } from './AIChat';
import { useAICoworker } from '@/hooks/useAICoworker';
import { useEditor } from '@/hooks/useEditor';
import { useFileSystem } from '@/hooks/useFileSystem';

export const AICoworker: React.FC = () => {
  const { apiKey } = useAICoworker();
  const { activeFile, files } = useEditor();
  const { getFileContent, readFile, writeFile, createFile } = useFileSystem();
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

  const handleFileOperation = async (operation: { type: string; path: string; content: string }) => {
    try {
      console.log('Handling file operation:', operation);
      
      switch (operation.type) {
        case 'edit':
          await writeFile(operation.path, operation.content);
          console.log(`File edited: ${operation.path}`);
          break;
        case 'create':
          // Check if file exists
          try {
            await readFile(operation.path);
            // File exists, update it
            await writeFile(operation.path, operation.content);
            console.log(`File updated: ${operation.path}`);
          } catch (error) {
            // File doesn't exist, create it
            const pathParts = operation.path.split('/');
            const fileName = pathParts.pop() || '';
            const parentPath = pathParts.join('/');
            
            if (!fileName) {
              throw new Error('Invalid file path');
            }
            
            await createFile(parentPath, fileName, 'file');
            await writeFile(operation.path, operation.content);
            console.log(`File created: ${operation.path}`);
          }
          break;
        case 'delete':
          // TODO: Implement file deletion
          console.log(`File deletion requested: ${operation.path}`);
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
