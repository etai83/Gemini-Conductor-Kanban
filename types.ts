export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
}

export interface LogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  logs: LogEntry[];
  progress: number; // 0 to 100
  fileChanges?: string[];
}

export interface ConductorState {
  tasks: Task[];
  isRunning: boolean;
  activeTaskId: string | null;
  projectGoal: string;
}

export const COLUMN_CONFIG = [
  { id: TaskStatus.PENDING, title: 'Backlog', color: 'border-slate-600' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'border-blue-500' },
  { id: TaskStatus.REVIEW, title: 'Review / QA', color: 'border-purple-500' },
  { id: TaskStatus.COMPLETED, title: 'Done', color: 'border-green-500' },
];