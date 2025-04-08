
import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Plus, X, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

interface TerminalTabProps {
  terminalId: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const TerminalTab: React.FC<TerminalTabProps> = ({ terminalId, isActive, onClick, onClose }) => {
  return (
    <div 
      className={`flex items-center px-3 py-1 border-r border-border cursor-pointer ${
        isActive ? 'bg-terminal text-white' : 'bg-tab-inactive text-slate-400 hover:text-white'
      }`}
      onClick={onClick}
    >
      <span className="text-sm">Terminal {terminalId}</span>
      <button 
        className="ml-2 p-0.5 text-slate-400 hover:text-white rounded-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface TerminalInstance {
  id: string;
  terminal: XTerm;
  fitAddon: FitAddon;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface TerminalPanelProps {
  maximizeTerminal?: () => void;
  minimizeTerminal?: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ maximizeTerminal, minimizeTerminal }) => {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { terminalTheme } = useTheme();
  
  // Initialize a new terminal
  const createTerminal = () => {
    const id = `term-${Date.now()}`;
    const terminal = new XTerm({
      cursorBlink: true,
      fontFamily: "var(--font-family), 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
      fontSize: 14,
      theme: {
        background: terminalTheme.background,
        foreground: terminalTheme.foreground,
        cursor: terminalTheme.cursor,
        selectionBackground: terminalTheme.selection,
      }
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    const newTermRef = React.createRef<HTMLDivElement>();
    
    setTerminals(prev => [...prev, { id, terminal, fitAddon, containerRef: newTermRef }]);
    setActiveTerminalId(id);
    
    return { id, terminal, fitAddon, containerRef: newTermRef };
  };
  
  // Initialize the first terminal
  useEffect(() => {
    if (terminals.length === 0) {
      const newTerm = createTerminal();
      
      // Wait for the DOM to update
      setTimeout(() => {
        if (newTerm.containerRef.current) {
          newTerm.terminal.open(newTerm.containerRef.current);
          newTerm.fitAddon.fit();
          
          // Set up some initial terminal content
          newTerm.terminal.writeln('Welcome to the IDE Terminal!');
          newTerm.terminal.writeln('');
          newTerm.terminal.write('$ ');
          
          // Set up basic terminal input handling
          newTerm.terminal.onData(data => {
            // Echo back input
            newTerm.terminal.write(data);
            
            // Handle Enter key
            if (data === '\r') {
              newTerm.terminal.writeln('');
              newTerm.terminal.write('$ ');
            }
          });
        }
      }, 0);
    }
  }, []);
  
  // Resize terminals when window resizes
  useEffect(() => {
    const handleResize = () => {
      terminals.forEach(term => {
        term.fitAddon.fit();
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [terminals]);
  
  // Set up new terminal when created
  useEffect(() => {
    const currentTerminal = terminals.find(t => t.id === activeTerminalId);
    
    if (currentTerminal && currentTerminal.containerRef.current && 
        !currentTerminal.containerRef.current.querySelector('.xterm')) {
      currentTerminal.terminal.open(currentTerminal.containerRef.current);
      currentTerminal.fitAddon.fit();
      
      // Set up some initial terminal content if this is a new terminal
      const isNewTerminal = !currentTerminal.containerRef.current.querySelector('.xterm-cursor');
      if (isNewTerminal) {
        currentTerminal.terminal.writeln('Terminal session started.');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
        
        // Set up basic terminal input handling
        currentTerminal.terminal.onData(data => {
          // Echo back input
          currentTerminal.terminal.write(data);
          
          // Handle Enter key
          if (data === '\r') {
            currentTerminal.terminal.writeln('');
            currentTerminal.terminal.write('$ ');
          }
        });
      }
    }
  }, [terminals, activeTerminalId]);

  // Apply theme changes to existing terminals
  useEffect(() => {
    terminals.forEach(term => {
      term.terminal.options.theme = {
        background: terminalTheme.background,
        foreground: terminalTheme.foreground,
        cursor: terminalTheme.cursor,
        selectionBackground: terminalTheme.selection,
      };
    });
  }, [terminalTheme, terminals]);
  
  // Handle close terminal
  const closeTerminal = (id: string) => {
    const terminalToClose = terminals.find(t => t.id === id);
    if (terminalToClose) {
      terminalToClose.terminal.dispose();
    }
    
    setTerminals(prev => prev.filter(t => t.id !== id));
    
    // Set a new active terminal if needed
    if (activeTerminalId === id) {
      const remainingTerminals = terminals.filter(t => t.id !== id);
      if (remainingTerminals.length > 0) {
        setActiveTerminalId(remainingTerminals[0].id);
      } else {
        // Create a new terminal if we closed the last one
        createTerminal();
      }
    }
  };
  
  // Toggle maximize
  const toggleMaximize = () => {
    setMaximized(prev => !prev);
    
    if (!maximized) {
      // Maximize the terminal panel
      if (maximizeTerminal) {
        maximizeTerminal();
      }
      toast.info("Terminal maximized");
    } else {
      // Restore the terminal panel
      if (minimizeTerminal) {
        minimizeTerminal();
      }
      toast.info("Terminal restored");
    }
    
    // Resize terminals after the animation completes
    setTimeout(() => {
      terminals.forEach(term => {
        term.fitAddon.fit();
      });
    }, 300);
  };
  
  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col bg-terminal text-terminal-foreground"
    >
      {/* Terminal tabs */}
      <div className="flex items-center justify-between bg-sidebar border-b border-border">
        <div className="flex overflow-x-auto">
          {terminals.map(term => (
            <TerminalTab
              key={term.id}
              terminalId={term.id.replace('term-', '')}
              isActive={term.id === activeTerminalId}
              onClick={() => setActiveTerminalId(term.id)}
              onClose={() => closeTerminal(term.id)}
            />
          ))}
        </div>
        <div className="flex items-center px-2">
          <button 
            className="p-1 text-slate-400 hover:text-white rounded-sm"
            onClick={() => {
              createTerminal();
              toast.success("New terminal created");
            }}
            title="New Terminal"
          >
            <Plus size={16} />
          </button>
          <button 
            className="p-1 ml-1 text-slate-400 hover:text-white rounded-sm"
            onClick={toggleMaximize}
            title={maximized ? "Restore Terminal" : "Maximize Terminal"}
          >
            {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      
      {/* Terminal containers */}
      <div className="flex-1 relative">
        {terminals.map(term => (
          <div
            key={term.id}
            ref={term.containerRef}
            className="absolute inset-0 p-2"
            style={{ display: term.id === activeTerminalId ? 'block' : 'none' }}
          />
        ))}
      </div>
    </div>
  );
};

export default TerminalPanel;
