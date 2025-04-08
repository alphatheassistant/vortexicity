import React, { useState, useRef, useEffect } from 'react';
import { useGeminiAI } from '@/hooks/useGeminiAI';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';

interface AIChatProps {
  apiKey: string;
  codebaseContext: string;
  onFileOperation: (operation: { type: string; path: string; content: string }) => void;
}

export const AIChat: React.FC<AIChatProps> = ({
  apiKey,
  codebaseContext,
  onFileOperation,
}) => {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const {
    isLoading,
    error,
    streamingResponse,
    initializeChat,
    sendMessage,
  } = useGeminiAI(apiKey);

  useEffect(() => {
    initializeChat(codebaseContext);
  }, [codebaseContext, initializeChat]);

  useEffect(() => {
    if (streamingResponse) {
      setChatHistory(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === 'assistant') {
          return [
            ...prev.slice(0, -1),
            { role: 'assistant', content: streamingResponse }
          ];
        }
        return [...prev, { role: 'assistant', content: streamingResponse }];
      });

      // Try to parse and execute file operations from streaming response
      const operations = parseFileOperations(streamingResponse);
      if (operations.length > 0) {
        operations.forEach(operation => {
          console.log('Executing operation from stream:', operation);
          onFileOperation(operation);
        });
      }
    }
  }, [streamingResponse]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Extract actual code content from a diff block
  const extractCodeFromDiff = (diffContent: string): string => {
    const lines = diffContent.split('\n');
    let actualCode = '';
    
    // Skip the first 4 lines if they contain diff headers
    let startIndex = 0;
    if (lines[0]?.startsWith('---') && lines[1]?.startsWith('+++')) {
      startIndex = 2;
      if (lines[2]?.startsWith('@@')) {
        startIndex = 3;
      }
    }

    // Process remaining lines
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('+')) {
        // Add new lines (remove the + prefix)
        actualCode += line.substring(1) + '\n';
      } else if (!line.startsWith('-')) {
        // Keep unchanged lines
        actualCode += line + '\n';
      }
      // Skip removed lines (starting with -)
    }

    return actualCode.trim();
  };

  // Parse file operations from the response
  const parseFileOperations = (content: string) => {
    const operations: { type: string; path: string; content: string }[] = [];
    
    // Match patterns for both regular code blocks and diff blocks
    const codeBlockRegex = /```(?:(?:typescript|javascript|tsx|jsx|diff)?\s*(?:edit|create):([^\n]+)\n([\s\S]*?)```)/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const [fullMatch, path, codeContent] = match;
      if (path && codeContent) {
        const isDiff = fullMatch.includes('```diff') || codeContent.startsWith('---') || codeContent.includes('\n---');
        const finalContent = isDiff ? extractCodeFromDiff(codeContent) : codeContent;
        
        // Normalize the path
        const normalizedPath = path.trim()
          .replace(/^["']|["']$/g, '') // Remove quotes if present
          .replace(/^\/+/, ''); // Remove leading slashes
        
        // Determine if it's a new file or edit based on path and content
        const type = normalizedPath.includes('/my-project/') ? 
          normalizedPath.replace('/my-project/', '') : 
          normalizedPath;

        operations.push({
          type: 'edit',
          path: type,
          content: finalContent.trim()
        });
      }
    }

    // Match delete operations
    const deleteRegex = /```delete:([^\n]+)```/g;
    while ((match = deleteRegex.exec(content)) !== null) {
      const [_, path] = match;
      if (path) {
        operations.push({
          type: 'delete',
          path: path.trim().replace(/^\/+/, ''),
          content: ''
        });
      }
    }
    
    return operations;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    const result = await sendMessage(userMessage);
    
    // Parse and execute file operations from final response
    if (result?.response) {
      const operations = parseFileOperations(result.response);
      console.log('Parsed file operations from final response:', operations);
      
      // Execute each file operation
      for (const operation of operations) {
        console.log('Executing operation:', operation);
        await onFileOperation(operation);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${
              msg.role === 'user' ? 'text-right' : 'text-left'
            }`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <pre className="whitespace-pre-wrap">{msg.content}</pre>
            </div>
          </div>
        ))}
        {error && (
          <div className="text-destructive p-2 rounded-lg bg-destructive/10">
            {error}
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !message.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}; 
