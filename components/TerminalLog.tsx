import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Terminal, XCircle, Check, Info } from 'lucide-react';

interface TerminalLogProps {
  logs: LogEntry[];
  isVisible: boolean;
}

const TerminalLog: React.FC<TerminalLogProps> = ({ logs, isVisible }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isVisible]);

  if (!isVisible) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle size={12} className="text-red-500" />;
      case 'success': return <Check size={12} className="text-green-500" />;
      default: return <Info size={12} className="text-blue-500" />;
    }
  };

  return (
    <div className="h-48 bg-gray-900 border-t border-gray-700 flex flex-col font-mono text-xs">
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-950 border-b border-gray-800 text-gray-400">
        <Terminal size={14} />
        <span className="font-semibold">Conductor Output</span>
        <div className="ml-auto flex gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {logs.length === 0 && <span className="text-gray-600">Waiting for conductor...</span>}
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-3 items-start opacity-90 hover:opacity-100 transition-opacity">
            <span className="text-gray-600 min-w-[60px]">
              {new Date(log.timestamp).toLocaleTimeString([], {hour12: false, hour: "2-digit", minute:"2-digit", second:"2-digit"})}
            </span>
            <span className="mt-0.5">{getIcon(log.type)}</span>
            <span className={`
              ${log.type === 'error' ? 'text-red-400' : ''}
              ${log.type === 'success' ? 'text-green-400' : ''}
              ${log.type === 'info' ? 'text-gray-300' : ''}
            `}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default TerminalLog;