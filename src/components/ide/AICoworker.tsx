import React, { useRef, useState } from 'react';
import { Send, Bot, Settings, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileOperation } from '@/types/gemini';
import { useAICoworker } from '@/contexts/AICoworkerContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AICoworker: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    messages, 
    config, 
    isTyping, 
    activeFile, 
    sendMessage, 
    updateConfig, 
    copyToClipboard 
  } = useAICoworker();

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea based on content
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    sendMessage(inputValue);
    setInputValue('');
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleCopyToClipboard = async (content: string, messageId: string) => {
    await copyToClipboard(content, messageId);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const FileOperationCard: React.FC<{ operation: FileOperation }> = ({ operation }) => (
    <div className="mt-2 p-2 bg-muted rounded-md text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">{operation.path}</span>
        <span className={cn(
          "px-2 py-0.5 rounded text-xs",
          operation.type === 'create' && "bg-green-500/20 text-green-400",
          operation.type === 'edit' && "bg-blue-500/20 text-blue-400",
          operation.type === 'delete' && "bg-red-500/20 text-red-400"
        )}>
          {operation.type}
        </span>
      </div>
      {operation.language && (
        <div className="mt-1 text-muted-foreground">
          Language: {operation.language}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center space-x-2">
          <Bot size={18} className="text-primary" />
          <span className="font-medium">AI Coworker</span>
          {isTyping && (
            <span className="text-xs text-muted-foreground ml-2">typing...</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>AI Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Select
                    value={config.model}
                    onValueChange={(value: any) =>
                      updateConfig({ model: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-pro-preview-03-25">Gemini Pro</SelectItem>
                      <SelectItem value="gemini-pro-vision">Gemini Pro Vision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) =>
                      updateConfig({ apiKey: e.target.value })
                    }
                    placeholder="Enter your Gemini API key"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3 max-w-[90%]",
              message.type === 'user' ? "ml-auto" : "mr-auto"
            )}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot size={16} className="text-primary" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className={cn(
                "rounded-lg p-3",
                message.type === 'user'
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}>
                <div className="flex justify-between items-start gap-2">
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  {message.type === 'assistant' && (
                    <button
                      onClick={() => handleCopyToClipboard(message.content, message.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {copiedMessageId === message.id ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} className="text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              {message.fileOperations?.map((operation, index) => (
                <FileOperationCard key={index} operation={operation} />
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about your code..."
            className="w-full min-h-[60px] max-h-[200px] resize-none rounded-lg bg-muted p-3 pr-12 text-sm"
            disabled={!config.apiKey}
          />
          <button
            className={cn(
              "absolute right-3 bottom-3 p-1.5 rounded-md transition-colors",
              inputValue.trim() && config.apiKey
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted-foreground/20 text-muted-foreground"
            )}
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !config.apiKey}
          >
            <Send size={16} />
          </button>
        </div>
        {!config.apiKey && (
          <p className="text-xs text-muted-foreground mt-2">
            Please set your Gemini API key in settings to start using the AI assistant.
          </p>
        )}
      </div>
    </div>
  );
};

export default AICoworker;
