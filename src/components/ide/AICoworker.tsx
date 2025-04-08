import React from 'react';
import { AIChat } from './AIChat';
import { useAICoworker } from '@/hooks/useAICoworker';
import { useEditor } from '@/hooks/useEditor';
import { useFileSystem } from '@/hooks/useFileSystem';

export const AICoworker: React.FC = () => {
  const { apiKey } = useAICoworker();
  const { activeFile, files } = useEditor();
  const { getFileContent } = useFileSystem();

  // Get the current file's content for context
  const getCurrentFileContent = () => {
    if (!activeFile) return '';
    return getFileContent(activeFile) || '';
  };

  // Get the codebase context
  const getCodebaseContext = () => {
    const currentFileContent = getCurrentFileContent();
    const fileContext = activeFile
      ? `Current file (${activeFile}):\n${currentFileContent}\n\n`
      : '';

    const otherFiles = files
      .filter(file => file !== activeFile)
      .map(file => {
        const content = getFileContent(file);
        return `File: ${file}\n${content}\n`;
      })
      .join('\n');

    return `${fileContext}Other files in the project:\n${otherFiles}`;
  };

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
        codebaseContext={getCodebaseContext()}
        onFileOperation={handleFileOperation}
      />
    </div>
  );
};
