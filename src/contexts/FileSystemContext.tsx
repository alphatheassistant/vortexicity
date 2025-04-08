import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type FileType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  language?: string;
  children?: FileSystemItem[];
  path: string;
  isOpen?: boolean;
  isModified?: boolean;
  parentId?: string;
}

export interface Log {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: Date;
}

export interface FileSystemContextType {
  files: FileSystemItem[];
  selectedFile: string | null;
  logs: Log[];
  createFile: (parentPath: string, name: string, type: FileType) => string | undefined;
  renameFile: (id: string, newName: string) => void;
  deleteFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  selectFile: (id: string) => void;
  getFileById: (id: string) => FileSystemItem | undefined;
  toggleFolder: (id: string) => void;
  searchFiles: (query: string) => FileSystemItem[];
  moveFile: (fileId: string, newParentId: string) => void;
  addLogMessage: (type: 'info' | 'success' | 'error' | 'warning', message: string) => void;
  clearLogs: () => void;
  removeLog: (id: string) => void;
  resetFileSystem: () => void;
  replaceFileSystem: (newRootName: string) => void;
  readFile: (path: string) => Promise<string[]>;
  writeFile: (path: string, content: string) => Promise<void>;
  openFile: (path: string) => Promise<void>;
}

export const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

// Helper function to determine language based on file extension
const getLanguageFromExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  const extensionMap: Record<string, string> = {
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // JavaScript family
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    
    // Python
    'py': 'python',
    'pyc': 'python',
    'pyd': 'python',
    'pyo': 'python',
    
    // Java
    'java': 'java',
    
    // C family
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    
    // Ruby
    'rb': 'ruby',
    
    // PHP
    'php': 'php',
    
    // Go
    'go': 'go',
    
    // Rust
    'rs': 'rust',
    
    // Swift
    'swift': 'swift',
    
    // Kotlin
    'kt': 'kotlin',
    
    // Shell
    'sh': 'shell',
    'bash': 'bash',
    
    // SQL
    'sql': 'sql',
    
    // Markup and config
    'md': 'markdown',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'toml': 'toml',
    'ini': 'ini',
    
    // Other
    'graphql': 'graphql',
    'dockerfile': 'dockerfile',
  };
  
  return extensionMap[extension] || 'plaintext';
};

// Sample initial file system
const initialFileSystem: FileSystemItem[] = [
  {
    id: 'root',
    name: 'my-project',
    type: 'folder',
    path: '/my-project',
    isOpen: true,
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        path: '/my-project/src',
        isOpen: true,
        parentId: 'root',
        children: [
          {
            id: 'components',
            name: 'components',
            type: 'folder',
            path: '/my-project/src/components',
            isOpen: false,
            parentId: 'src',
            children: [
              {
                id: 'button',
                name: 'Button.tsx',
                type: 'file',
                path: '/my-project/src/components/Button.tsx',
                language: 'typescript',
                content: 'import React from "react";\n\ninterface ButtonProps {\n  children: React.ReactNode;\n  onClick?: () => void;\n  variant?: "primary" | "secondary";\n}\n\nconst Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary" }) => {\n  return (\n    <button\n      className={`px-4 py-2 rounded ${variant === "primary" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n};\n\nexport default Button;',
                parentId: 'components',
              }
            ]
          },
          {
            id: 'app',
            name: 'App.tsx',
            type: 'file',
            path: '/my-project/src/App.tsx',
            language: 'typescript',
            content: 'import React from "react";\nimport Button from "./components/Button";\n\nconst App: React.FC = () => {\n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold mb-4">My Application</h1>\n      <Button onClick={() => alert("Button clicked!")}>Click Me</Button>\n    </div>\n  );\n};\n\nexport default App;',
            parentId: 'src',
          },
          {
            id: 'index',
            name: 'index.tsx',
            type: 'file',
            path: '/my-project/src/index.tsx',
            language: 'typescript',
            content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);',
            parentId: 'src',
          }
        ]
      },
      {
        id: 'package',
        name: 'package.json',
        type: 'file',
        path: '/my-project/package.json',
        language: 'json',
        content: '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}',
        parentId: 'root',
      },
      {
        id: 'readme',
        name: 'README.md',
        type: 'file',
        path: '/my-project/README.md',
        language: 'markdown',
        content: '# My Project\n\nThis is a sample React project.\n\n## Getting Started\n\nInstall dependencies:\n\n```bash\nnpm install\n```\n\nStart the development server:\n\n```bash\nnpm start\n```',
        parentId: 'root',
      }
    ]
  }
];

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper function to find an item by ID in the file system tree
const findItemById = (files: FileSystemItem[], id: string): FileSystemItem | undefined => {
  for (const file of files) {
    if (file.id === id) return file;
    if (file.children) {
      const found = findItemById(file.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

// Helper function to find a parent by child ID
const findParentById = (files: FileSystemItem[], childId: string): FileSystemItem | undefined => {
  for (const file of files) {
    if (file.children?.some(child => child.id === childId)) return file;
    if (file.children) {
      const found = findParentById(file.children, childId);
      if (found) return found;
    }
  }
  return undefined;
};

// Empty file system for new projects
const createEmptyFileSystem = (rootName: string = 'new-project'): FileSystemItem[] => {
  return [
    {
      id: 'root',
      name: rootName,
      type: 'folder',
      path: `/${rootName}`,
      isOpen: true,
      children: []
    }
  ];
};

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileSystemItem[]>(initialFileSystem);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([
    {
      id: '1',
      type: 'info',
      message: 'IDE initialized successfully',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'success',
      message: 'Project files loaded',
      timestamp: new Date(Date.now() - 60000)
    }
  ]);

  // Get file by ID
  const getFileById = (id: string) => {
    return findItemById(files, id);
  };

  // Create new file or folder
  const createFile = (parentPath: string, name: string, type: FileType) => {
    const newId = generateId();
    const path = `${parentPath}/${name}`;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      // Find the parent folder in which to create the new item
      const findAndAddToParent = (items: FileSystemItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.path === parentPath) {
            // Found the parent, add the new item to its children
            const newItem: FileSystemItem = {
              id: newId,
              name,
              type,
              path,
              parentId: item.id,
              isOpen: false,
            };
            
            if (type === 'folder') {
              newItem.children = [];
            } else {
              newItem.content = '';
              newItem.language = getLanguageFromExtension(name);

              newItem.isModified = false;
            }
            
            item.children = [...(item.children || []), newItem];
            return true;
          }
          
          if (item.children) {
            const added = findAndAddToParent(item.children);
            if (added) return true;
          }
        }
        
        return false;
      };
      
      findAndAddToParent(newFiles);
      return newFiles;
    });
    
    if (type === 'file') {
      setSelectedFile(newId);
    }
    
    return newId;
  };

  // Rename a file or folder
  const renameFile = (id: string, newName: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const updateItem = (items: FileSystemItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.id === id) {
            const oldPathParts = item.path.split('/');
            oldPathParts[oldPathParts.length - 1] = newName;
            const newPath = oldPathParts.join('/');
            
            // Update item
            item.name = newName;
            item.path = newPath;
            
            // Update language if file extension changed
            if (item.type === 'file') {
              item.language = getLanguageFromExtension(newName);
            }
            
            // Update paths of all children recursively
            const updateChildrenPaths = (parentItem: FileSystemItem, oldParentPath: string, newParentPath: string) => {
              if (!parentItem.children) return;
              
              for (const child of parentItem.children) {
                child.path = child.path.replace(oldParentPath, newParentPath);
                
                if (child.children) {
                  updateChildrenPaths(child, oldParentPath, newParentPath);
                }
              }
            };
            
            if (item.children) {
              const oldItemPath = item.path.split('/').slice(0, -1).join('/') + '/' + item.name;
              updateChildrenPaths(item, oldItemPath, newPath);
            }
            
            return true;
          }
          
          if (item.children) {
            const updated = updateItem(item.children);
            if (updated) return true;
          }
        }
        
        return false;
      };
      
      updateItem(newFiles);
      return newFiles;
    });
  };

  // Delete a file or folder
  const deleteFile = (id: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const removeItem = (items: FileSystemItem[]) => {
        for (let i = 0; i < items.length; i++) {
          if (items[i].id === id) {
            items.splice(i, 1);
            return true;
          }
          
          if (items[i].children) {
            const removed = removeItem(items[i].children!);
            if (removed) return true;
          }
        }
        
        return false;
      };
      
      // Don't allow deleting the root folder
      if (id !== 'root') {
        removeItem(newFiles);
      }
      
      return newFiles;
    });
    
    if (selectedFile === id) {
      setSelectedFile(null);
    }
  };

  // Update file content
  const updateFileContent = (id: string, content: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const updateItem = (items: FileSystemItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.id === id && item.type === 'file') {
            const isContentChanged = item.content !== content;
            
            item.content = content;
            item.isModified = isContentChanged;
            
            return true;
          }
          
          if (item.children) {
            const updated = updateItem(item.children);
            if (updated) return true;
          }
        }
        
        return false;
      };
      
      updateItem(newFiles);
      return newFiles;
    });
  };

  // Select a file
  const selectFile = (id: string) => {
    setSelectedFile(id);
  };

  // Toggle folder open/closed
  const toggleFolder = (id: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const toggleItem = (items: FileSystemItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.id === id && item.type === 'folder') {
            item.isOpen = !item.isOpen;
            return true;
          }
          
          if (item.children) {
            const toggled = toggleItem(item.children);
            if (toggled) return true;
          }
        }
        
        return false;
      };
      
      toggleItem(newFiles);
      return newFiles;
    });
  };

  // Search files by name
  const searchFiles = (query: string) => {
    if (!query.trim()) return [];
    
    const results: FileSystemItem[] = [];
    const searchQuery = query.toLowerCase();
    
    const searchInItems = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(searchQuery)) {
          results.push(item);
        }
        
        if (item.type === 'folder' && item.children) {
          searchInItems(item.children);
        }
      }
    };
    
    searchInItems(files);
    return results;
  };

  // Move a file or folder to a new parent
  const moveFile = (fileId: string, newParentId: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      // Find the item to move
      const fileToMove = findItemById(newFiles, fileId);
      if (!fileToMove) return prevFiles;
      
      // Find the new parent
      const newParent = findItemById(newFiles, newParentId);
      if (!newParent || newParent.type !== 'folder') return prevFiles;
      
      // Find the current parent
      const currentParent = findParentById(newFiles, fileId);
      if (!currentParent) return prevFiles;
      
      // Remove from current parent
      currentParent.children = currentParent.children!.filter(child => child.id !== fileId);
      
      // Update path and parentId
      const oldPath = fileToMove.path;
      fileToMove.path = `${newParent.path}/${fileToMove.name}`;
      fileToMove.parentId = newParentId;
      
      // Update paths of all children
      const updateChildPaths = (item: FileSystemItem, oldBasePath: string, newBasePath: string) => {
        if (item.children) {
          for (const child of item.children) {
            child.path = child.path.replace(oldBasePath, newBasePath);
            updateChildPaths(child, oldBasePath, newBasePath);
          }
        }
      };
      
      updateChildPaths(fileToMove, oldPath, fileToMove.path);
      
      // Add to new parent
      newParent.children = [...(newParent.children || []), fileToMove];
      
      return newFiles;
    });
  };

  // Add a log message
  const addLogMessage = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    const newLog: Log = {
      id: generateId(),
      type,
      message,
      timestamp: new Date()
    };
    
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  // Clear all logs
  const clearLogs = () => {
    setLogs([]);
  };

  // Remove a specific log
  const removeLog = (id: string) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
  };

  // Reset file system to default empty state
  const resetFileSystem = () => {
    setFiles(createEmptyFileSystem());
    setSelectedFile(null);
    addLogMessage('info', 'File system reset to default empty state');
  };

  // Replace file system with a completely new one (for imports)
  const replaceFileSystem = (newRootName: string) => {
    setFiles(createEmptyFileSystem(newRootName));
    setSelectedFile(null);
    addLogMessage('info', `Prepared new file system for ${newRootName}`);
  };

  // Helper function to find a file by path
  const findFileByPath = (path: string): FileSystemItem | undefined => {
    const searchInItems = (items: FileSystemItem[]): FileSystemItem | undefined => {
      for (const item of items) {
        if (item.path === path) return item;
        if (item.children) {
          const found = searchInItems(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    return searchInItems(files);
  };

  // Helper function to get all file paths
  const getAllFilePaths = (): string[] => {
    const paths: string[] = [];
    
    const collectPaths = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.type === 'file') {
          paths.push(item.path);
        }
        if (item.children) {
          collectPaths(item.children);
        }
      }
    };
    
    collectPaths(files);
    return paths;
  };

  // New function to read file content by path
  const readFile = async (path: string): Promise<string[]> => {
    if (path === '.') {
      // Return all file paths when path is '.'
      return getAllFilePaths();
    }
    
    const file = findFileByPath(path);
    if (!file || file.type !== 'file') {
      throw new Error(`File not found: ${path}`);
    }
    
    return file.content ? [file.content] : [''];
  };

  // New function to write file content by path
  const writeFile = async (path: string, content: string): Promise<void> => {
    const file = findFileByPath(path);
    if (file) {
      // Update existing file
      updateFileContent(file.id, content);
    } else {
      // Create new file
      const pathParts = path.split('/');
      const fileName = pathParts.pop() || '';
      const parentPath = pathParts.join('/');
      
      if (!fileName) {
        throw new Error('Invalid file path');
      }
      
      createFile(parentPath, fileName, 'file');
      const newFile = findFileByPath(path);
      if (newFile) {
        updateFileContent(newFile.id, content);
      }
    }
  };

  // New function to open file by path
  const openFile = async (path: string): Promise<void> => {
    const file = findFileByPath(path);
    if (file) {
      selectFile(file.id);
    } else {
      throw new Error(`File not found: ${path}`);
    }
  };

  return (
    <FileSystemContext.Provider
      value={{
        files,
        selectedFile,
        logs,
        createFile,
        renameFile,
        deleteFile,
        updateFileContent,
        selectFile,
        getFileById,
        toggleFolder,
        searchFiles,
        moveFile,
        addLogMessage,
        clearLogs,
        removeLog,
        resetFileSystem,
        replaceFileSystem,
        readFile,
        writeFile,
        openFile,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};
