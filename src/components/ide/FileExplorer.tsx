
import React, { useState, useRef } from 'react';
import { 
  File, Folder, FolderOpen, ChevronDown, ChevronRight, Plus, Search, X,
  FileCode, FileText, FileImage, FileVideo, FileAudio, FileJson, FileCheck, 
  FileCog, FileSpreadsheet, Edit, Trash, FolderPlus
} from 'lucide-react';
import { useFileSystem, FileSystemItem, FileType } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { Menu, Item, useContextMenu } from 'react-contexify';
import 'react-contexify/ReactContexify.css';

const CONTEXT_MENU_ID = 'file-explorer-context-menu';
const FILE_ITEM_MENU_ID = 'file-item-context-menu';
const FOLDER_ITEM_MENU_ID = 'folder-item-context-menu';

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'php':
    case 'py':
    case 'rb':
    case 'java':
    case 'go':
    case 'c':
    case 'cpp':
    case 'cs':
      return <FileCode size={16} className="file-icon" />;
    
    case 'txt':
    case 'md':
    case 'rtf':
    case 'log':
      return <FileText size={16} className="file-icon" />;
    
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'bmp':
    case 'ico':
      return <FileImage size={16} className="file-icon" />;
    
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'webm':
      return <FileVideo size={16} className="file-icon" />;
    
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return <FileAudio size={16} className="file-icon" />;
    
    case 'json':
      return <FileJson size={16} className="file-icon" />;
    
    case 'yml':
    case 'yaml':
    case 'toml':
    case 'ini':
    case 'env':
    case 'config':
      return <FileCog size={16} className="file-icon" />;
    
    case 'csv':
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet size={16} className="file-icon" />;
    
    case 'exe':
    case 'bat':
    case 'sh':
      return <FileCheck size={16} className="file-icon" />;
    
    default:
      return <File size={16} className="file-icon" />;
  }
};

const FileExplorer: React.FC = () => {
  const { files, createFile, renameFile, deleteFile, toggleFolder } = useFileSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileSystemItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newItemType, setNewItemType] = useState<FileType | null>(null);
  const [newItemParentPath, setNewItemParentPath] = useState<string>('');
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  const { show } = useContextMenu();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    show({ event: e, id: CONTEXT_MENU_ID });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (item.type === 'file') {
      show({ event: e, id: FILE_ITEM_MENU_ID, props: { itemId: item.id, itemPath: item.path } });
    } else {
      show({ event: e, id: FOLDER_ITEM_MENU_ID, props: { itemId: item.id, itemPath: item.path } });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    const results: FileSystemItem[] = [];
    
    const searchInItems = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        
        if (item.type === 'folder' && item.children) {
          searchInItems(item.children);
        }
      }
    };
    
    searchInItems(files);
    setSearchResults(results);
  };

  const startCreatingNewItem = (parentPath: string, type: FileType) => {
    setNewItemType(type);
    setNewItemParentPath(parentPath);
    
    setTimeout(() => {
      if (newItemInputRef.current) {
        newItemInputRef.current.focus();
      }
    }, 50);
  };

  const handleCreateNewItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItemType) {
      const name = e.currentTarget.value.trim();
      
      if (name) {
        createFile(newItemParentPath, name, newItemType);
        setNewItemType(null);
      }
    } else if (e.key === 'Escape') {
      setNewItemType(null);
    }
  };

  const startRenaming = (itemId: string) => {
    setRenamingItemId(itemId);
    
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 50);
  };

  const handleRename = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => {
    if (e.key === 'Enter') {
      const newName = e.currentTarget.value.trim();
      
      if (newName) {
        renameFile(itemId, newName);
        setRenamingItemId(null);
      }
    } else if (e.key === 'Escape') {
      setRenamingItemId(null);
    }
  };

  const renderFileTree = (items: FileSystemItem[], depth = 0) => {
    return items.map(item => (
      <FileExplorerItem 
        key={item.id}
        item={item}
        depth={depth}
        handleItemContextMenu={handleItemContextMenu}
        renamingItemId={renamingItemId}
        renameInputRef={renameInputRef}
        handleRename={handleRename}
        newItemType={newItemType}
        newItemParentPath={newItemParentPath}
        newItemInputRef={newItemInputRef}
        handleCreateNewItem={handleCreateNewItem}
        setRenamingItemId={setRenamingItemId}
      />
    ));
  };

  return (
    <div 
      className="h-full overflow-auto bg-sidebar flex flex-col"
      onContextMenu={handleContextMenu}
    >
      <div className="px-2 py-0.5 flex justify-between items-center border-b border-border">
        <h2 className="text-sm font-medium text-sidebar-foreground">EXPLORER</h2>
        <div className="flex space-x-1">
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-[#cccccc29] rounded transition-colors"
            onClick={() => setIsSearching(!isSearching)}
          >
            <Search size={16} />
          </button>
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-[#cccccc29] rounded transition-colors"
            onClick={() => startCreatingNewItem(files[0].path, 'file')}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {isSearching && (
        <div className="px-2 py-2 border-b border-border">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-sidebar-foreground bg-opacity-10 text-sm px-3 py-1 rounded text-sidebar-foreground outline-none"
              placeholder="Search files..."
              autoFocus
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                onClick={() => {
                  setSearchQuery('');
                  handleSearch('');
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="px-2 py-1">
            {searchResults.length > 0 ? (
              searchResults.map(item => (
                <SearchResultItem 
                  key={item.id} 
                  item={item} 
                  handleItemContextMenu={handleItemContextMenu}
                />
              ))
            ) : (
              <div className="text-sm text-slate-400 px-2 py-1">
                No results found
              </div>
            )}
          </div>
        ) : (
          <div className="px-2 py-1">
            {renderFileTree(files)}
          </div>
        )}
      </div>
      
      <Menu id={CONTEXT_MENU_ID} className="context-menu">
        <Item onClick={() => startCreatingNewItem(files[0].path, 'file')} className="context-menu-item">
          <div className="flex items-center">
            <FileText size={14} className="mr-2 opacity-70" />
            <span>New File</span>
          </div>
        </Item>
        <Item onClick={() => startCreatingNewItem(files[0].path, 'folder')} className="context-menu-item">
          <div className="flex items-center">
            <Folder size={14} className="mr-2 opacity-70" />
            <span>New Folder</span>
          </div>
        </Item>
      </Menu>
      
      <Menu id={FILE_ITEM_MENU_ID} className="context-menu">
        <Item onClick={({ props }) => startRenaming(props.itemId)} className="context-menu-item">
          <div className="flex items-center">
            <Edit size={14} className="mr-2 opacity-70" />
            <span>Rename</span>
          </div>
        </Item>
        <Item onClick={({ props }) => deleteFile(props.itemId)} className="context-menu-item">
          <div className="flex items-center">
            <Trash size={14} className="mr-2 opacity-70" />
            <span>Delete</span>
          </div>
        </Item>
      </Menu>
      
      <Menu id={FOLDER_ITEM_MENU_ID} className="context-menu">
        <Item onClick={({ props }) => startCreatingNewItem(props.itemPath, 'file')} className="context-menu-item">
          <div className="flex items-center">
            <FileText size={14} className="mr-2 opacity-70" />
            <span>New File</span>
          </div>
        </Item>
        <Item onClick={({ props }) => startCreatingNewItem(props.itemPath, 'folder')} className="context-menu-item">
          <div className="flex items-center">
            <FolderPlus size={14} className="mr-2 opacity-70" />
            <span>New Folder</span>
          </div>
        </Item>
        <Item onClick={({ props }) => startRenaming(props.itemId)} className="context-menu-item">
          <div className="flex items-center">
            <Edit size={14} className="mr-2 opacity-70" />
            <span>Rename</span>
          </div>
        </Item>
        <Item onClick={({ props }) => deleteFile(props.itemId)} className="context-menu-item">
          <div className="flex items-center">
            <Trash size={14} className="mr-2 opacity-70" />
            <span>Delete</span>
          </div>
        </Item>
      </Menu>
    </div>
  );
};

interface FileExplorerItemProps {
  item: FileSystemItem;
  depth: number;
  handleItemContextMenu: (e: React.MouseEvent, item: FileSystemItem) => void;
  renamingItemId: string | null;
  renameInputRef: React.RefObject<HTMLInputElement>;
  handleRename: (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => void;
  newItemType: FileType | null;
  newItemParentPath: string;
  newItemInputRef: React.RefObject<HTMLInputElement>;
  handleCreateNewItem: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setRenamingItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const FileExplorerItem: React.FC<FileExplorerItemProps> = ({ 
  item, 
  depth,
  handleItemContextMenu,
  renamingItemId,
  renameInputRef,
  handleRename,
  newItemType,
  newItemParentPath,
  newItemInputRef,
  handleCreateNewItem,
  setRenamingItemId
}) => {
  const { toggleFolder, selectedFile } = useFileSystem();
  const { openTab } = useEditor();
  
  const handleItemClick = () => {
    if (item.type === 'folder') {
      toggleFolder(item.id);
    } else {
      openTab(item.id);
    }
  };
  
  const isSelected = selectedFile === item.id;
  const showNewItemInput = newItemType && newItemParentPath === item.path;
  
  return (
    <div>
      <div
        className={`file-explorer-item flex items-center py-0.5 px-1 cursor-pointer rounded ${
          isSelected ? 'selected' : ''
        }`}
        style={{ paddingLeft: `${(depth * 12) + 4}px` }}
        onClick={handleItemClick}
        onContextMenu={(e) => handleItemContextMenu(e, item)}
      >
        {item.type === 'folder' && (
          <span className="mr-1 text-slate-400">
            {item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        )}
        
        <span className="mr-1 text-slate-400">
          {item.type === 'folder' 
            ? (item.isOpen ? <FolderOpen size={16} /> : <Folder size={16} />)
            : getFileIcon(item.name)
          }
        </span>
        
        {renamingItemId === item.id ? (
          <input
            type="text"
            defaultValue={item.name}
            ref={renameInputRef}
            className="bg-sidebar-foreground bg-opacity-20 text-sm px-1 rounded text-sidebar-foreground outline-none"
            onKeyDown={(e) => handleRename(e, item.id)}
            onBlur={() => setTimeout(() => setRenamingItemId(null), 100)}
          />
        ) : (
          <span className="text-sm text-sidebar-foreground opacity-90 truncate">{item.name}</span>
        )}
      </div>
      
      {showNewItemInput && (
        <div 
          className="flex items-center py-0.5 px-1"
          style={{ paddingLeft: `${((depth + 1) * 12) + 4}px` }}
        >
          <span className="mr-1 text-slate-400">
            {newItemType === 'folder' ? <Folder size={16} /> : <File size={16} />}
          </span>
          <input
            type="text"
            ref={newItemInputRef}
            className="bg-sidebar-foreground bg-opacity-20 text-sm px-1 rounded text-sidebar-foreground outline-none"
            onKeyDown={handleCreateNewItem}
            placeholder={`New ${newItemType}`}
          />
        </div>
      )}
      
      {item.type === 'folder' && item.isOpen && item.children && (
        <div>
          {item.children.map(child => (
            <FileExplorerItem
              key={child.id}
              item={child}
              depth={depth + 1}
              handleItemContextMenu={handleItemContextMenu}
              renamingItemId={renamingItemId}
              renameInputRef={renameInputRef}
              handleRename={handleRename}
              newItemType={newItemType}
              newItemParentPath={newItemParentPath}
              newItemInputRef={newItemInputRef}
              handleCreateNewItem={handleCreateNewItem}
              setRenamingItemId={setRenamingItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SearchResultItemProps {
  item: FileSystemItem;
  handleItemContextMenu: (e: React.MouseEvent, item: FileSystemItem) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, handleItemContextMenu }) => {
  const { openTab } = useEditor();
  
  const handleClick = () => {
    if (item.type === 'file') {
      openTab(item.id);
    }
  };
  
  return (
    <div
      className="file-explorer-item flex items-center py-0.5 px-2 cursor-pointer rounded hover:bg-[#cccccc29] transition-colors"
      onClick={handleClick}
      onContextMenu={(e) => handleItemContextMenu(e, item)}
    >
      <span className="mr-2 text-slate-400">
        {item.type === 'folder' ? <Folder size={16} /> : getFileIcon(item.name)}
      </span>
      <span className="text-sm text-sidebar-foreground opacity-90 truncate">{item.name}</span>
      <span className="text-xs text-slate-500 ml-2 truncate opacity-70">{item.path}</span>
    </div>
  );
};

export default FileExplorer;
