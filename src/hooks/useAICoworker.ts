import { useContext } from 'react';
import { AICoworkerContext } from '@/contexts/AICoworkerContext';

export const useAICoworker = () => {
  const context = useContext(AICoworkerContext);
  if (!context) {
    throw new Error('useAICoworker must be used within an AICoworkerProvider');
  }
  return context;
}; 