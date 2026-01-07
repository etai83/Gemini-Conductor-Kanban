import { GoogleGenAI, Type } from "@google/genai";
import { Task, TaskStatus, LogEntry } from "../types";

// Helper to create client safely
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in process.env");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a list of tasks based on a high-level user goal.
 */
export const generatePlan = async (goal: string): Promise<Task[]> => {
  const client = getClient();
  if (!client) throw new Error("API Key missing");

  const prompt = `
    You are the Gemini Conductor, an advanced AI software architect.
    Break down the following project goal into granular, actionable technical tasks for a developer.
    Goal: "${goal}"
    
    Return a list of 4-8 tasks. 
    Prioritize logical flow (Setup -> Core Logic -> UI -> Testing).
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            },
            required: ['title', 'description', 'priority'],
          },
        },
      },
    });

    const rawTasks = JSON.parse(response.text || "[]");
    
    return rawTasks.map((t: any) => ({
      id: crypto.randomUUID(),
      title: t.title,
      description: t.description,
      priority: t.priority,
      status: TaskStatus.PENDING,
      logs: [],
      progress: 0,
      fileChanges: []
    }));

  } catch (error) {
    console.error("Gemini Planning Error:", error);
    throw error;
  }
};

/**
 * Simulates the "Conductor" performing work on a task. 
 * In a real scenario, this would interpret CLI output.
 * Here, we ask Gemini to generate "logs" for a simulated action.
 */
export const generateTaskLog = async (task: Task): Promise<{ message: string, type: 'info' | 'success' | 'error' }> => {
  const client = getClient();
  if (!client) return { message: "Simulated local execution...", type: 'info' };

  const prompt = `
    You are simulating a CLI terminal output for a task runner.
    Task: ${task.title}
    Current Progress: ${task.progress}%
    Context: The task is currently running.
    
    Generate ONE single line of technical terminal log output that represents what is happening right now.
    Examples: "Compiling src/utils.ts...", "Running unit tests...", "Fetching dependency...", "Optimizing assets..."
    Keep it short and technical. Do not include timestamps.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 20,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    return {
      message: response.text?.trim() || "Processing...",
      type: 'info'
    };
  } catch (e) {
    return { message: "Executing internal process...", type: 'info' };
  }
};

/**
 * Establish a real WebSocket connection to a running Conductor instance.
 */
export const connectToSocket = (
    url: string, 
    onMessage: (data: any) => void, 
    onError: (e: Event) => void,
    onOpen: () => void,
    onClose: (e: CloseEvent) => void
): WebSocket => {
    const ws = new WebSocket(url);
    ws.onopen = onOpen;
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            console.error("Failed to parse WebSocket message", e);
        }
    };
    ws.onerror = onError;
    ws.onclose = onClose;
    return ws;
};

/**
 * Returns a Mock state for DEMO purposes only.
 */
export const getDemoState = async (): Promise<{ tasks: Task[], goal: string }> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency

  // Mock data representing an ongoing session
  const mockTasks: Task[] = [
    {
      id: crypto.randomUUID(),
      title: "Initialize Repository & Config",
      description: "Setup git, tsconfig, and linting rules",
      priority: "high",
      status: TaskStatus.COMPLETED,
      progress: 100,
      logs: [{ timestamp: Date.now() - 120000, message: "Initialized git repository", type: "success" }],
      fileChanges: ["tsconfig.json", ".gitignore"]
    },
    {
      id: crypto.randomUUID(),
      title: "Core Service Architecture",
      description: "Implement base service classes and DI container",
      priority: "high",
      status: TaskStatus.COMPLETED,
      progress: 100,
      logs: [{ timestamp: Date.now() - 60000, message: "Service container registered", type: "success" }],
      fileChanges: ["src/services/base.ts"]
    },
    {
      id: crypto.randomUUID(),
      title: "Implement API Routes",
      description: "Create RESTful endpoints for the main resource",
      priority: "high",
      status: TaskStatus.IN_PROGRESS,
      progress: 42,
      logs: [{ timestamp: Date.now(), message: "Compiling route handlers...", type: "info" }],
      fileChanges: ["src/routes/api.ts"]
    },
    {
      id: crypto.randomUUID(),
      title: "Frontend Integration",
      description: "Connect React frontend to the new API",
      priority: "medium",
      status: TaskStatus.PENDING,
      progress: 0,
      logs: [],
      fileChanges: []
    },
    {
      id: crypto.randomUUID(),
      title: "E2E Testing",
      description: "Run full suite of Cypress tests",
      priority: "medium",
      status: TaskStatus.PENDING,
      progress: 0,
      logs: [],
      fileChanges: []
    }
  ];

  return {
    tasks: mockTasks,
    goal: "DEMO: Refactor Legacy API (Simulation)"
  };
};