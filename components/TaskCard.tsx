import React from 'react';
import { Task, TaskStatus } from '../types';
import { Clock, AlertCircle, CheckCircle, Terminal, FileCode } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isActive: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isActive }) => {
  const priorityColors = {
    low: 'text-blue-400 bg-blue-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    high: 'text-red-400 bg-red-400/10',
  };

  const statusBorder = isActive 
    ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
    : task.status === TaskStatus.COMPLETED 
      ? 'border-green-900/50 opacity-75' 
      : 'border-gray-700 hover:border-gray-500';

  const lastLog = task.logs.length > 0 ? task.logs[task.logs.length - 1] : null;

  return (
    <div className={`
      relative group p-4 mb-3 rounded-lg border bg-gray-800 transition-all duration-300
      ${statusBorder}
    `}>
      {/* Active Indicator Pulse */}
      {isActive && (
        <div className="absolute top-0 right-0 -mt-1 -mr-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${priorityColors[task.priority]}`}>
          {task.priority.toUpperCase()}
        </span>
        {task.status === TaskStatus.COMPLETED && <CheckCircle size={16} className="text-green-500" />}
      </div>

      {/* Content */}
      <h3 className="text-sm font-semibold text-gray-100 mb-1 leading-tight">
        {task.title}
      </h3>
      <p className="text-xs text-gray-400 line-clamp-2 mb-3">
        {task.description}
      </p>

      {/* Progress Bar (Visible if started) */}
      {task.status !== TaskStatus.PENDING && (
        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-3 overflow-hidden">
          <div 
            className={`h-1.5 rounded-full transition-all duration-500 ${
              task.status === TaskStatus.COMPLETED ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      {/* Mini Terminal / Last Log */}
      {isActive && lastLog && (
        <div className="mt-2 p-2 bg-gray-950 rounded border border-gray-800 font-mono text-[10px] text-green-400 truncate flex items-center gap-2">
          <Terminal size={10} className="text-gray-500" />
          <span className="animate-pulse">&gt; {lastLog.message}</span>
        </div>
      )}

      {/* Footer Meta */}
      <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-700/50">
         <div className="flex items-center gap-1 text-gray-500 text-[10px]">
           <Clock size={12} />
           <span>{task.id.slice(0,4)}</span>
         </div>
         {task.fileChanges && task.fileChanges.length > 0 && (
           <div className="flex items-center gap-1 text-gray-500 text-[10px]">
             <FileCode size={12} />
             <span>{task.fileChanges.length} files</span>
           </div>
         )}
      </div>
    </div>
  );
};

export default TaskCard;