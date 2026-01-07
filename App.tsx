import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskStatus, LogEntry } from './types';
import ConductorBoard from './components/ConductorBoard';
import TerminalLog from './components/TerminalLog';
import { generatePlan, generateTaskLog, getDemoState, connectToSocket } from './services/geminiService';
import { Play, Square, Cpu, Sparkles, Layout, Terminal as TerminalIcon, Link, Wifi, Eye } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [mode, setMode] = useState<'plan' | 'connect'>('plan');
  const [goal, setGoal] = useState('');
  const [connectionUrl, setConnectionUrl] = useState('ws://localhost:8080');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Used for both planning and connecting
  const [isRealtime, setIsRealtime] = useState(false); // True if connected via WS
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [globalLogs, setGlobalLogs] = useState<LogEntry[]>([]);
  const [showTerminal, setShowTerminal] = useState(true);

  const processingRef = useRef<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Helper to add logs
  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const entry: LogEntry = { timestamp: Date.now(), message, type };
    setGlobalLogs(prev => [...prev.slice(-99), entry]); // Keep last 100
  }, []);

  // Planning Handler
  const handlePlan = async () => {
    if (!goal.trim()) return;
    setIsProcessing(true);
    addLog(`Connecting to Gemini Conductor... analyzing goal: "${goal}"`, 'info');
    
    try {
      const plan = await generatePlan(goal);
      setTasks(plan);
      addLog(`Plan generated with ${plan.length} tasks. Ready to execute.`, 'success');
    } catch (e) {
      addLog('Failed to generate plan. Please check API Key.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Connect Handler (Strict Realtime)
  const handleConnect = () => {
    if (!connectionUrl.trim()) return;
    setIsProcessing(true);
    addLog(`Initiating handshake with conductor at ${connectionUrl}...`, 'info');

    // Close existing socket if any
    if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
    }

    const ws = connectToSocket(
        connectionUrl,
        (data) => {
            // Handle incoming Realtime Messages
            if (data.tasks) {
                setTasks(data.tasks);
                // Auto-detect active task if provided or infer from status
                const active = data.tasks.find((t: Task) => t.status === TaskStatus.IN_PROGRESS);
                setActiveTaskId(active ? active.id : null);
            }
            if (data.log) {
                addLog(data.log.message, data.log.type || 'info');
            }
            if (data.logs && Array.isArray(data.logs)) {
                data.logs.forEach((l: any) => addLog(l.message, l.type));
            }
            if (data.projectGoal) {
                setGoal(data.projectGoal);
            }
        },
        (event) => {
            // Error Handler
            // We use 'event.type' or just a static message to avoid [object Object] logging
            console.error("WebSocket connection error occurred.");
            
            if (!isRealtime) {
                 // Initial connection failed - DO NOT FALLBACK
                 addLog(`Connection failed to ${connectionUrl}.`, 'error');
                 addLog('Make sure the Conductor is running and exposing a WebSocket server.', 'warning');
                 setIsProcessing(false);
            }
        },
        () => {
            // On Open
            setIsProcessing(false);
            setIsRealtime(true);
            setIsRunning(true);
            addLog(`Successfully connected to live session at ${connectionUrl}`, 'success');
        },
        (event) => {
            // On Close
            if (isRealtime) {
                addLog(`Connection closed by server (Code: ${event.code}).`, 'warning');
                setIsRealtime(false);
                setIsRunning(false);
            }
        }
    );

    socketRef.current = ws;
  };

  // Explicit Demo Mode (Separate Action)
  const loadDemoMode = async () => {
    setIsProcessing(true);
    addLog('Loading Demo Simulation...', 'info');
    try {
        const { tasks: recoveredTasks, goal: recoveredGoal } = await getDemoState();
        setTasks(recoveredTasks);
        setGoal(recoveredGoal);
        
        const active = recoveredTasks.find(t => t.status === TaskStatus.IN_PROGRESS);
        if (active) {
            setActiveTaskId(active.id);
        }
        setIsRealtime(false); // Enable local simulation loop
        setIsRunning(true);
        addLog('Demo loaded. This is a simulation, not real data.', 'warning');
    } finally {
        setIsProcessing(false);
    }
  };

  const stopConductor = () => {
    setIsRunning(false);
    setIsRealtime(false);
    if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
        addLog('Disconnected from Conductor.', 'info');
    }
  };

  // Execution Simulation Loop (Only runs if NOT in Realtime mode)
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isRunning && !isRealtime) {
      if (tasks.every(t => t.status === TaskStatus.COMPLETED) && tasks.length > 0) {
          setIsRunning(false);
          return;
      }

      // Only log "actively monitoring" once
      if (!processingRef.current) addLog('Conductor simulation engine started.', 'success');
      
      intervalId = setInterval(async () => {
        if (processingRef.current) return;
        processingRef.current = true;

        setTasks(prevTasks => {
          const newTasks = [...prevTasks];
          let activeIndex = newTasks.findIndex(t => t.status === TaskStatus.IN_PROGRESS);
          
          if (activeIndex === -1) {
            activeIndex = newTasks.findIndex(t => t.status === TaskStatus.PENDING);
            if (activeIndex !== -1) {
              newTasks[activeIndex] = {
                ...newTasks[activeIndex],
                status: TaskStatus.IN_PROGRESS,
                progress: 5
              };
              setActiveTaskId(newTasks[activeIndex].id);
            } else {
              const allDone = newTasks.every(t => t.status === TaskStatus.COMPLETED);
              if (allDone && isRunning) {
                // Defer stop to effect cleanup or next render to avoid state update loops
                setTimeout(() => setIsRunning(false), 0);
                setActiveTaskId(null);
                addLog('All tasks completed successfully.', 'success');
              }
            }
          } 
          else {
            const currentTask = newTasks[activeIndex];
            const increment = Math.floor(Math.random() * 15) + 5;
            const newProgress = Math.min(currentTask.progress + increment, 100);
            
            newTasks[activeIndex] = { ...currentTask, progress: newProgress };

            if (newProgress >= 100) {
                 newTasks[activeIndex].status = TaskStatus.COMPLETED;
                 setActiveTaskId(null);
            }
          }
          return newTasks;
        });

        // Generate AI Logs for the active task (Side effect outside set state)
        if (activeTaskId) {
             const currentTask = tasks.find(t => t.id === activeTaskId);
             if (currentTask && currentTask.status === TaskStatus.IN_PROGRESS) {
                const logData = await generateTaskLog(currentTask);
                setTasks(current => current.map(t => {
                    if (t.id === activeTaskId) {
                        return { ...t, logs: [...t.logs, { timestamp: Date.now(), ...logData }]};
                    }
                    return t;
                }));
                addLog(`[${currentTask.title}] ${logData.message}`, logData.type);
             }
        }

        processingRef.current = false;
      }, 2000); // Tick every 2 seconds
    } else if (!isRunning) {
        if (activeTaskId) setActiveTaskId(null);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, isRealtime, activeTaskId, tasks, addLog]);


  // Cleanup Socket on Unmount
  useEffect(() => {
    return () => {
        if (socketRef.current) socketRef.current.close();
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
      
      {/* Header / Control Panel */}
      <header className="flex-none border-b border-gray-700 bg-gray-800 px-6 py-4 shadow-xl z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Cpu className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Gemini Conductor Kanban
                <span className="text-xs font-mono font-normal bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-700/50">
                   v2.5-preview
                </span>
                {isRealtime && (
                    <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30 animate-pulse">
                        <Wifi size={10} /> LIVE
                    </span>
                )}
              </h1>
              <p className="text-xs text-gray-400">Autonomous Task Orchestration & Visualization</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Stats */}
             <div className="flex gap-6 mr-6 text-sm">
                <div className="text-center">
                    <span className="block text-gray-500 text-xs uppercase">Pending</span>
                    <span className="font-mono font-bold text-gray-300">
                        {tasks.filter(t => t.status === TaskStatus.PENDING).length}
                    </span>
                </div>
                <div className="text-center">
                    <span className="block text-gray-500 text-xs uppercase">Active</span>
                    <span className="font-mono font-bold text-blue-400">
                        {tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
                    </span>
                </div>
                <div className="text-center">
                    <span className="block text-gray-500 text-xs uppercase">Done</span>
                    <span className="font-mono font-bold text-green-400">
                        {tasks.filter(t => t.status === TaskStatus.COMPLETED).length}
                    </span>
                </div>
             </div>

             <button 
                onClick={() => setShowTerminal(!showTerminal)}
                className={`p-2 rounded hover:bg-gray-700 transition ${showTerminal ? 'text-blue-400' : 'text-gray-500'}`}
                title="Toggle Terminal"
             >
                <TerminalIcon size={20} />
             </button>
          </div>
        </div>

        {/* Mode Switch & Inputs */}
        <div className="flex flex-col gap-2">
            {!tasks.length && (
                <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-sm font-medium">
                        <button 
                            onClick={() => setMode('plan')}
                            className={`pb-1 border-b-2 transition-colors ${mode === 'plan' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            New Project Plan
                        </button>
                        <button 
                            onClick={() => setMode('connect')}
                            className={`pb-1 border-b-2 transition-colors flex items-center gap-2 ${mode === 'connect' ? 'border-green-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                        >
                            <Wifi size={14} /> Connect to Session
                        </button>
                    </div>
                    
                    {/* Explicit Demo Link */}
                    <button onClick={loadDemoMode} className="text-xs text-gray-600 hover:text-gray-400 flex items-center gap-1 transition-colors">
                        <Eye size={12} /> View Demo
                    </button>
                </div>
            )}

            <div className="flex gap-4">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {mode === 'plan' ? (
                     <Sparkles size={16} className="text-purple-400" />
                ) : (
                     <Link size={16} className="text-green-400" />
                )}
                </div>
                <input 
                type="text" 
                value={mode === 'plan' ? goal : connectionUrl}
                onChange={(e) => mode === 'plan' ? setGoal(e.target.value) : setConnectionUrl(e.target.value)}
                placeholder={mode === 'plan' ? "Describe your project goal..." : "Enter Conductor URL (e.g. ws://localhost:8080)"}
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                disabled={isRunning || isProcessing || (tasks.length > 0 && mode === 'plan')} 
                />
            </div>

            {!tasks.length ? (
                <button 
                    onClick={mode === 'plan' ? handlePlan : handleConnect}
                    disabled={isProcessing || (mode === 'plan' ? !goal : !connectionUrl)}
                    className={`
                        flex items-center gap-2 text-white px-6 py-2.5 rounded-md font-medium text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
                        ${mode === 'plan' 
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/20' 
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20'
                        }
                    `}
                >
                    {isProcessing ? (
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    ) : (
                        mode === 'plan' ? <Layout size={16} /> : <Wifi size={16} />
                    )}
                    {isProcessing ? (mode === 'plan' ? 'Analyzing...' : 'Connecting...') : (mode === 'plan' ? 'Generate Plan' : 'Connect')}
                </button>
            ) : (
                <button 
                    onClick={stopConductor}
                    className={`
                        flex items-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm transition-all shadow-lg
                        ${isRunning 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' 
                            : 'bg-green-600 hover:bg-green-500 text-white'
                        }
                    `}
                >
                    {isRunning ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    {isRunning ? 'Disconnect' : 'Resume'}
                </button>
            )}
            </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="flex-1 flex overflow-hidden bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none" />
        <ConductorBoard tasks={tasks} activeTaskId={activeTaskId} />
      </main>

      {/* Terminal Footer */}
      <TerminalLog logs={globalLogs} isVisible={showTerminal} />
    </div>
  );
};

export default App;