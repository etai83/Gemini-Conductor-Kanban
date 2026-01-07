import React from 'react';
import { Task, TaskStatus, COLUMN_CONFIG } from '../types';
import TaskCard from './TaskCard';

interface ConductorBoardProps {
  tasks: Task[];
  activeTaskId: string | null;
}

const ConductorBoard: React.FC<ConductorBoardProps> = ({ tasks, activeTaskId }) => {
  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="h-full flex gap-4 px-6 pb-6 min-w-[1000px]">
        {COLUMN_CONFIG.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          
          return (
            <div key={col.id} className="flex-1 min-w-[280px] flex flex-col h-full">
              {/* Column Header */}
              <div className={`
                flex items-center justify-between mb-4 pb-2 border-b-2 ${col.color}
              `}>
                <h2 className="font-semibold text-gray-300 text-sm tracking-wide uppercase">
                  {col.title}
                </h2>
                <span className="bg-gray-800 text-gray-400 text-xs font-mono py-0.5 px-2 rounded-full">
                  {colTasks.length}
                </span>
              </div>

              {/* Drop Zone / List */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {colTasks.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-xs italic">
                    No tasks
                  </div>
                )}
                
                {colTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    isActive={task.id === activeTaskId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConductorBoard;