
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  editorTheme: string;
  terminalTheme: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to dark theme
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Set up editor and terminal themes based on UI theme
  const editorTheme = theme === 'dark' ? 'custom-dark' : 'custom-light';
  
  const terminalTheme = {
    dark: {
      background: 'hsl(var(--terminal))',
      foreground: 'hsl(var(--terminal-foreground))',
      cursor: '#AEAFAD',
      selection: 'rgba(255, 255, 255, 0.3)'
    },
    light: {
      background: 'hsl(var(--terminal))',
      foreground: 'hsl(var(--terminal-foreground))',
      cursor: '#333333',
      selection: 'rgba(0, 0, 0, 0.3)'
    }
  };

  // Toggle between dark and light theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme activated`);
  };

  // Apply theme to document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      editorTheme,
      terminalTheme: terminalTheme[theme]
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
