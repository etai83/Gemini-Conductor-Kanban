# Gemini Conductor Kanban

A high-fidelity, real-time Kanban visualization tool designed to work alongside the **Gemini Conductor** CLI extension. This application provides a futuristic, developer-centric interface to monitor autonomous AI agents as they plan, code, and test software tasks.

## Features

*   **AI-Powered Planning**: Uses Gemini models (via `@google/genai`) to break down high-level project goals into granular, actionable technical tasks.
*   **Real-Time Visualization**: Connects via WebSocket to live Conductor instances to visualize task status changes, file modifications, and progress updates instantly.
*   **Live Terminal Logs**: A distinct terminal panel showing the raw output and "thought process" of the AI agent.
*   **Simulation Mode**: Includes a built-in demo mode to visualize the UI capabilities without a live backend.

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   A Google Gemini API Key (obtained from Google AI Studio)

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set your API Key. Ensure `process.env.API_KEY` is accessible to the application build.
4.  Start the development server:
    ```bash
    npm start
    ```

## Usage

### 1. Planning Mode (Standalone)
If you don't have a running Conductor instance, you can use the app to generate project plans using Gemini directly.
1.  Select **"New Project Plan"** in the header.
2.  Enter a project goal (e.g., "Build a React To-Do app with Redux").
3.  Click **Generate Plan**. The AI will create a structured backlog of tasks with priorities and descriptions.

### 2. Live Connection (Companion Mode)
Use this mode to visualize a running CLI Conductor session.
1.  Ensure your CLI Conductor tool is running and exposing a WebSocket server (default: `ws://localhost:8080`).
2.  Select **"Connect to Session"** in the header.
3.  Enter the WebSocket URL.
4.  Click **Connect**. The board will sync with the CLI state, moving tasks across columns and streaming logs as the agent works.

### 3. Demo Mode
To see the UI in action without an API key or a backend server:
1.  Click the **View Demo** link (eye icon) in the header.
2.  This runs a local simulation of a "Legacy API Refactor" project.

## Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Icons**: Lucide React
