
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, Trash, Maximize2, Minimize2 } from 'lucide-react';
import { useFileSystem } from '@/contexts/FileSystemContext';

interface LogsPanelProps {
  maximizePanel?: () => void;
  minimizePanel?: () => void;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ maximizePanel, minimizePanel }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { logs, clearLogs, removeLog } = useFileSystem();

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      if (maximizePanel) maximizePanel();
    } else {
      if (minimizePanel) minimizePanel();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info size={16} className="text-blue-400" />;
      case 'success':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'error':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      default:
        return <Info size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-terminal">
      {/* Logs Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-sidebar border-b border-border">
        <div className="flex items-center">
          <span className="text-sm font-medium text-sidebar-foreground opacity-90">Logs</span>
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-sidebar-foreground bg-opacity-20 text-sidebar-foreground">
            {logs.length}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-[#cccccc29] rounded transition-colors"
            onClick={clearLogs}
            title="Clear all logs"
          >
            <Trash size={14} />
          </button>
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-[#cccccc29] rounded transition-colors"
            onClick={toggleMaximize}
            title={isMaximized ? "Restore Panel" : "Maximize Panel"}
          >
            {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No logs to display
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map(log => (
              <div key={log.id} className="px-3 py-2 hover:bg-[#cccccc29] group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getLogIcon(log.type)}
                    <span className={`text-xs px-1.5 py-0.5 rounded-sm ${
                      log.type === 'info' ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                      log.type === 'success' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                      log.type === 'error' ? 'bg-red-500 bg-opacity-20 text-red-400' :
                      'bg-yellow-500 bg-opacity-20 text-yellow-400'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-400">{formatTimestamp(log.timestamp)}</span>
                  </div>
                  <button 
                    className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity"
                    onClick={() => removeLog(log.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="mt-1 text-sm text-terminal-foreground opacity-90">
                  {log.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsPanel;
