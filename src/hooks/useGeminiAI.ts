import { useState, useCallback, useEffect } from 'react';
import { GeminiService } from '@/services/ai/geminiService';

export const useGeminiAI = (apiKey: string) => {
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string>('');

  useEffect(() => {
    try {
      const service = new GeminiService(apiKey);
      setGeminiService(service);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Gemini service');
    }
  }, [apiKey]);

  const initializeChat = useCallback(async (codebaseContext: string) => {
    if (!geminiService) {
      setError('Gemini service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await geminiService.initializeChat(codebaseContext);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize chat');
    } finally {
      setIsLoading(false);
    }
  }, [geminiService]);

  const sendMessage = useCallback(async (message: string) => {
    if (!geminiService) {
      setError('Gemini service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setStreamingResponse('');

      const onStream = (chunk: string) => {
        setStreamingResponse(prev => prev + chunk);
      };

      const response = await geminiService.sendMessage(message, onStream);
      const fileOperations = geminiService.parseFileOperations(response);

      return {
        response,
        fileOperations,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [geminiService]);

  return {
    isLoading,
    error,
    streamingResponse,
    initializeChat,
    sendMessage,
  };
}; 
