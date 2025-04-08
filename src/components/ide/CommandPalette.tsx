
import React, { useState, useEffect, useRef } from 'react';
import { Search, File, Folder, Command, Terminal, Settings } from 'lucide-react';
import { useFileSystem, FileSystemItem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';

interface CommandPaletteProps {
  onClose: () => void;
}

interface CommandItem {
  id: string;
  type: 'file' | 'command';
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose }) => {
  const { searchFiles } = useFileSystem();
  const { openTab } = useEditor();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Define available commands
  const commands: CommandItem[] = [
    {
      id: 'command-new-file',
      type: 'command',
      title: 'New File',
      icon: <File size={16} />,
      action: () => {
        // Implement new file action
        onClose();
      }
    },
    {
      id: 'command-new-folder',
      type: 'command',
      title: 'New Folder',
      icon: <Folder size={16} />,
      action: () => {
        // Implement new folder action
        onClose();
      }
    },
    {
      id: 'command-show-terminal',
      type: 'command',
      title: 'Toggle Terminal',
      icon: <Terminal size={16} />,
      action: () => {
        // This would be handled at a higher level
        onClose();
      }
    },
    {
      id: 'command-settings',
      type: 'command',
      title: 'Open Settings',
      icon: <Settings size={16} />,
      action: () => {
        // Implement settings action
        onClose();
      }
    }
  ];
  
  // Search for files and commands based on query
  useEffect(() => {
    if (query.trim() === '') {
      setResults(commands);
      return;
    }
    
    // Search for matching files
    const fileResults = searchFiles(query).map(file => ({
      id: file.id,
      type: 'file' as const,
      title: file.name,
      icon: file.type === 'file' ? <File size={16} /> : <Folder size={16} />,
      action: () => {
        if (file.type === 'file') {
          openTab(file.id);
        }
        onClose();
      }
    }));
    
    // Filter commands
    const commandResults = commands.filter(command => 
      command.title.toLowerCase().includes(query.toLowerCase())
    );
    
    setResults([...fileResults, ...commandResults]);
    setSelectedIndex(0);
  }, [query, commands, searchFiles, openTab, onClose]);
  
  // Handle key navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].action();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [results, selectedIndex, onClose]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  return (
    <div className="fixed inset-0 flex items-start justify-center pt-20 bg-black bg-opacity-50 z-50">
      <div className="w-full max-w-2xl bg-sidebar rounded-md shadow-lg overflow-hidden">
        <div className="p-2 flex items-center border-b border-border">
          <Search size={18} className="mr-2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files or type a command..."
            className="flex-1 bg-transparent border-none outline-none text-white"
          />
          <div className="text-xs text-slate-400">
            <span className="px-1 py-0.5 border border-slate-600 rounded">ESC</span> to close
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              {results.map((item, index) => (
                <div
                  key={item.id}
                  className={`px-4 py-2 flex items-center ${
                    index === selectedIndex ? 'bg-sidebar-foreground bg-opacity-20' : ''
                  } hover:bg-sidebar-foreground hover:bg-opacity-10 cursor-pointer`}
                  onClick={() => item.action()}
                >
                  <span className="mr-2 text-slate-400">{item.icon}</span>
                  <span className="text-white">{item.title}</span>
                  {item.type === 'command' && (
                    <span className="ml-auto text-slate-400">
                      <Command size={14} />
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400">
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
