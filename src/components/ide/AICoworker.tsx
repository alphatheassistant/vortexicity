import React, { useState, useEffect } from 'react';
import { AIChat } from './AIChat';
import { useAICoworker } from '@/hooks/useAICoworker';
import { useEditor } from '@/hooks/useEditor';
import { useFileSystem } from '@/hooks/useFileSystem';

export const AICoworker: React.FC = () => {
  const { apiKey } = useAICoworker();
  const { activeFile, files } = useEditor();
  const { getFileContent, readFile } = useFileSystem();
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
      const currentFileContent = await getCurrentFileContent();
      const fileContext = activeFile
        ? `Current file (${activeFile}):\n${currentFileContent}\n\n`
        : '';

      const otherFiles = await Promise.all(
        files
          .filter(file => file !== activeFile)
          .map(async file => {
            try {
              const content = await readFile(file);
              return `File: ${file}\n${content[0] || ''}\n`;
            } catch (error) {
              console.error(`Error reading file ${file}:`, error);
              return `File: ${file}\n[Error reading file]\n`;
            }
          })
      );

      return `${fileContext}Other files in the project:\n${otherFiles.join('\n')}`;
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
    // Handle file operations based on the type
    switch (operation.type) {
      case 'edit':
        // TODO: Implement file editing
        console.log('Edit file:', operation.path, operation.content);
        break;
      case 'create':
        // TODO: Implement file creation
        console.log('Create file:', operation.path, operation.content);
        break;
      case 'operation':
        // TODO: Implement other file operations
        console.log('File operation:', operation.path, operation.content);
        break;
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
