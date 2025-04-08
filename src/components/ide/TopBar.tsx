
import React, { useState } from 'react';
import { Command, Save, Settings, File as FileIcon, Edit as EditIcon, Eye, HelpCircle, Copy, Clipboard, Download, Upload, Trash2, Undo, Redo, RotateCcw, X, LayoutGrid } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { useFileSystem } from '@/contexts/FileSystemContext';
import FontSelector from './FontSelector';
import { toast } from 'sonner';

const TopBar: React.FC = () => {
  const { saveActiveFile, activeTabId, undoLastAction, redoLastAction } = useEditor();
  const { createFile, deleteFile, addLogMessage } = useFileSystem();
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Handle opening/closing menus
  const toggleMenu = (menuName: string) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuName);
    }
  };
  
  // Handle menu item actions
  const handleAction = (action: string) => {
    switch (action) {
      case 'new-file':
        createFile('/my-project', 'untitled.txt', 'file');
        addLogMessage('success', 'New file created');
        break;
      case 'save':
        saveActiveFile();
        break;
      case 'delete':
        if (activeTabId) {
          deleteFile(activeTabId);
          addLogMessage('success', 'File deleted');
        } else {
          addLogMessage('error', 'No file selected');
        }
        break;
      case 'copy':
        if (document.execCommand('copy')) {
          toast.success('Content copied to clipboard');
        }
        break;
      case 'cut':
        if (document.execCommand('cut')) {
          toast.success('Content cut to clipboard');
        }
        break;
      case 'paste':
        if (document.execCommand('paste')) {
          toast.success('Content pasted from clipboard');
        }
        break;
      case 'undo':
        undoLastAction();
        break;
      case 'redo':
        redoLastAction();
        break;
      case 'toggle-minimap':
        addLogMessage('success', 'Minimap toggled');
        break;
      case 'toggle-wrap':
        addLogMessage('success', 'Word wrap toggled');
        break;
      case 'keyboard-shortcuts':
        toast.info('Keyboard shortcuts: Ctrl+S to save, Ctrl+Z to undo, Ctrl+Y to redo');
        break;
      case 'about':
        addLogMessage('info', 'Code Editor IDE - Version 1.0.0');
        break;
      default:
        break;
    }
    
    // Close menu after action
    setActiveMenu(null);
  };
  
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-status-bar text-slate-400 text-sm border-b border-border">
      <div className="flex items-center space-x-1">
        <h1 className="font-medium mr-4">Code Editor IDE</h1>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'file' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('file')}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="menu-dropdown mt-1 left-0 bg-sidebar border border-border rounded shadow-lg py-1 z-50">
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('new-file')}>
                <FileIcon size={14} className="mr-2" />
                New File
              </div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('save')}>
                <Save size={14} className="mr-2" />
                Save
                <span className="ml-auto text-xs opacity-70">Ctrl+S</span>
              </div>
              <div className="border-t border-border my-1"></div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('delete')}>
                <Trash2 size={14} className="mr-2" />
                Delete
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'edit' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('edit')}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="menu-dropdown mt-1 left-0 bg-sidebar border border-border rounded shadow-lg py-1 z-50">
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('undo')}>
                <Undo size={14} className="mr-2" />
                Undo
                <span className="ml-auto text-xs opacity-70">Ctrl+Z</span>
              </div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('redo')}>
                <Redo size={14} className="mr-2" />
                Redo
                <span className="ml-auto text-xs opacity-70">Ctrl+Y</span>
              </div>
              <div className="border-t border-border my-1"></div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('copy')}>
                <Copy size={14} className="mr-2" />
                Copy
                <span className="ml-auto text-xs opacity-70">Ctrl+C</span>
              </div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('cut')}>
                <Clipboard size={14} className="mr-2" />
                Cut
                <span className="ml-auto text-xs opacity-70">Ctrl+X</span>
              </div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('paste')}>
                <Clipboard size={14} className="mr-2" />
                Paste
                <span className="ml-auto text-xs opacity-70">Ctrl+V</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'view' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('view')}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div className="menu-dropdown mt-1 left-0 bg-sidebar border border-border rounded shadow-lg py-1 z-50">
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('toggle-minimap')}>
                <LayoutGrid size={14} className="mr-2" />
                Toggle Minimap
              </div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('toggle-wrap')}>
                <RotateCcw size={14} className="mr-2" />
                Toggle Word Wrap
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'help' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('help')}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="menu-dropdown mt-1 left-0 bg-sidebar border border-border rounded shadow-lg py-1 z-50">
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('keyboard-shortcuts')}>
                <Command size={14} className="mr-2" />
                Keyboard Shortcuts
              </div>
              <div className="menu-item flex items-center px-3 py-1.5 hover:bg-tab-active hover:text-white cursor-pointer" onClick={() => handleAction('about')}>
                <HelpCircle size={14} className="mr-2" />
                About
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <FontSelector />
        
        <button 
          className="p-1 hover:text-white transition-colors"
          onClick={() => handleAction('save')}
          title="Save (Ctrl+S)"
        >
          <Save size={16} />
        </button>
        
        <button 
          className="p-1 hover:text-white transition-colors"
          onClick={() => handleAction('undo')}
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        
        <button 
          className="p-1 hover:text-white transition-colors"
          onClick={() => handleAction('redo')}
          title="Redo (Ctrl+Y)"
        >
          <Redo size={16} />
        </button>
        
        <button 
          className="p-1 hover:text-white transition-colors"
          title="Command Palette (Ctrl+P)"
        >
          <Command size={16} />
        </button>
        
        <button 
          className="p-1 hover:text-white transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
