
import React, { useState } from 'react';
import { Github, Search, Loader, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';

// Types for GitHub API responses
interface GithubFile {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size?: number;
  download_url?: string;
  url: string;
}

interface GithubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  default_branch: string;
}

interface GithubRepoLoaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubRepoLoader: React.FC<GithubRepoLoaderProps> = ({ isOpen, onClose }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { replaceFileSystem, createFile, updateFileContent, addLogMessage } = useFileSystem();

  const parseGithubUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com') {
        return null;
      }
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        return null;
      }
      
      return {
        owner: pathParts[0],
        repo: pathParts[1],
        branch: pathParts[3] || 'main' // Default to 'main' if no branch specified
      };
    } catch (e) {
      return null;
    }
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    setProgress('Validating repository URL...');
    
    const repoInfo = parseGithubUrl(repoUrl);
    if (!repoInfo) {
      setError('Invalid GitHub URL. Please enter a valid GitHub repository URL.');
      setLoading(false);
      return;
    }
    
    try {
      // First, get repo information
      setProgress('Fetching repository information...');
      const repoResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`);
      
      if (!repoResponse.ok) {
        throw new Error('Repository not found or not accessible');
      }
      
      const repoData: GithubRepo = await repoResponse.json();
      
      // Setup new empty file system with the repo name
      setProgress('Setting up file system...');
      replaceFileSystem(repoData.name);
      
      // Fetch contents of the repository
      setProgress('Fetching repository contents...');
      const contentsResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents?ref=${repoData.default_branch}`);
      
      if (!contentsResponse.ok) {
        throw new Error('Failed to fetch repository contents');
      }
      
      const contents: GithubFile[] = await contentsResponse.json();
      
      // Process repository contents
      setProgress('Processing repository files...');
      await processGithubContents(contents, `/${repoData.name}`);
      
      toast.success(`Repository ${repoData.name} imported successfully!`);
      setLoading(false);
      addLogMessage('success', `Imported GitHub repository: ${repoData.full_name}`);
      onClose();
    } catch (error) {
      console.error('Error importing repository:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoading(false);
      addLogMessage('error', `Failed to import repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processGithubContents = async (
    contents: GithubFile[],
    parentPath: string
  ) => {
    for (const item of contents) {
      setProgress(`Processing ${item.name}...`);
      
      if (item.type === 'dir') {
        // Create folder
        const folderId = createFile(parentPath, item.name, 'folder');
        
        // Fetch and process subdirectory contents
        const response = await fetch(item.url);
        if (response.ok) {
          const subContents = await response.json();
          await processGithubContents(subContents, `${parentPath}/${item.name}`);
        }
      } else if (item.type === 'file') {
        // Skip large files (>500KB) to prevent performance issues
        if (item.size && item.size > 500000) {
          toast.warning(`Skipped large file: ${item.name}`);
          continue;
        }
        
        // Fetch file content
        if (item.download_url) {
          try {
            const fileResponse = await fetch(item.download_url);
            if (fileResponse.ok) {
              const content = await fileResponse.text();
              
              // Create file with content
              const fileId = createFile(parentPath, item.name, 'file');
              if (fileId) {
                updateFileContent(fileId, content);
                addLogMessage('info', `Loaded file: ${item.name}`);
              }
            }
          } catch (error) {
            console.error(`Failed to load file content for ${item.name}`, error);
            addLogMessage('warning', `Failed to load file: ${item.name}`);
          }
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="text-sidebar-foreground flex items-center gap-2">
            <Github className="h-5 w-5" /> Import from GitHub
          </DialogTitle>
          <DialogDescription className="text-sidebar-foreground opacity-70">
            Enter the URL of a public GitHub repository to import
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="bg-terminal text-terminal-foreground border-border flex-grow"
              disabled={loading}
            />
            <Button 
              type="submit" 
              onClick={handleImport}
              disabled={loading || !repoUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Loader size={16} className="animate-spin mr-2" /> : <Search size={16} className="mr-2" />}
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded text-red-400 text-sm">
              <div className="flex items-start">
                <X size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex flex-col items-center justify-center space-y-4 p-6 bg-terminal border border-border rounded">
              <div className="flex flex-col items-center">
                <Loader size={48} className="text-blue-500 animate-spin mb-4" />
                <div className="text-terminal-foreground font-medium">{progress}</div>
                <div className="text-sm text-slate-400 mt-1">Please wait while we import your repository...</div>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400">
            <p>Note: Only public repositories are supported. Large files and binary files may be skipped.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
