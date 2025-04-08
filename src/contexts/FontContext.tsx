
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

type FontFamily = 'JetBrains Mono' | 'Fira Code' | 'Source Code Pro' | 'Inter';

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  availableFonts: FontFamily[];
  uiFont: string;
  editorFont: string;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontFamily, setFontFamily] = useState<FontFamily>('Inter');
  const availableFonts: FontFamily[] = ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Inter'];
  
  // Set Inter as UI font and JetBrains Mono as editor font
  const uiFont = 'Inter';
  const editorFont = 'JetBrains Mono';

  // Apply font changes
  const handleFontChange = (font: FontFamily) => {
    setFontFamily(font);
    toast.success(`Font changed to ${font}`);
  };

  // Apply font to root CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', fontFamily);
    // Apply Inter as UI font
    document.documentElement.style.setProperty('--ui-font-family', uiFont);
    // Apply JetBrains Mono specifically for code
    document.documentElement.style.setProperty('--editor-font-family', editorFont);
  }, [fontFamily, uiFont, editorFont]);

  return (
    <FontContext.Provider value={{
      fontFamily,
      setFontFamily: handleFontChange,
      availableFonts,
      uiFont,
      editorFont
    }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};
