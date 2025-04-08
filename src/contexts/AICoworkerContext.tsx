import React, { createContext, useContext, useState, useEffect } from 'react';
import { GeminiConfig, Message, FileOperation } from '@/types/gemini';
import { GeminiService } from '@/services/gemini';
import { useFileSystem } from './FileSystemContext';

const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-pro',
  apiKey: '',
  temperature: 0.7,
  maxTokens: 2048,
};

interface AICoworkerContextType {
  messages: Message[];
  config: GeminiConfig;
  isTyping: boolean;
  activeFile: string | null;
  apiKey: string;
  sendMessage: (content: string) => Promise<void>;
  updateConfig: (newConfig: Partial<GeminiConfig>) => void;
  copyToClipboard: (content: string, messageId: string) => Promise<void>;
}

const AICoworkerContext = createContext<AICoworkerContextType | undefined>(undefined);

export { AICoworkerContext };

export const AICoworkerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI coding assistant powered by Gemini. How can I help you today?',
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [config, setConfig] = useState<GeminiConfig>(DEFAULT_CONFIG);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const { readFile, writeFile, deleteFile, openFile, addLogMessage } = useFileSystem();

  useEffect(() => {
    if (config.apiKey) {
      setGeminiService(new GeminiService(config));
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<GeminiConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleFileOperation = async (operation: FileOperation) => {
    try {
      switch (operation.type) {
        case 'create':
        case 'edit':
          if (operation.content) {
            await writeFile(operation.path, operation.content);
            await openFile(operation.path);
            setActiveFile(operation.path);
          }
          break;
        case 'delete':
          await deleteFile(operation.path);
          break;
      }
    } catch (error) {
      console.error('File operation failed:', error);
      addLogMessage('error', `File operation failed: ${error}`);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !geminiService) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Get current file context
    const fileContext = await Promise.all(
      (await readFile('.')).map(async file => ({
        path: file,
        content: (await readFile(file))[0] || '',
        language: file.split('.').pop(),
      }))
    );

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      let content = '';
      const fileOps: FileOperation[] = [];

      await geminiService.streamResponse(
        content,
        fileContext,
        (token) => {
          content += token;
          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, content }
              : msg
          ));
        },
        (operation) => {
          fileOps.push(operation);
          handleFileOperation(operation);
        }
      );

      // Update final message with file operations
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content, fileOperations: fileOps, isStreaming: false }
          : msg
      ));
    } catch (error) {
      console.error('AI response failed:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id
          ? { ...msg, content: 'Sorry, an error occurred while processing your request.', isStreaming: false }
          : msg
      ));
    }

    setIsTyping(false);
  };

  const copyToClipboard = async (content: string, messageId: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <AICoworkerContext.Provider
      value={{
        messages,
        config,
        isTyping,
        activeFile,
        apiKey: config.apiKey,
        sendMessage,
        updateConfig,
        copyToClipboard,
      }}
    >
      {children}
    </AICoworkerContext.Provider>
  );
};

export const useAICoworker = () => {
  const context = useContext(AICoworkerContext);
  if (context === undefined) {
    throw new Error('useAICoworker must be used within an AICoworkerProvider');
  }
  return context;
}; 