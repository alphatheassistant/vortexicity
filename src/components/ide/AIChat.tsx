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
    }
  }, [streamingResponse]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);

    const result = await sendMessage(userMessage);
    if (result?.fileOperations) {
      result.fileOperations.forEach(onFileOperation);
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