# Personal Productivity Assistant

A full-stack productivity application for managing tasks, planning available time, tracking progress, handling recurring tasks, and creating tasks from natural language using an LLM.

The project began as a Python command-line task manager and evolved into a full-stack application with a React frontend, FastAPI backend, SQLite persistence, and AI-assisted task creation.

## Features

### Task Management

- Create tasks
- Edit existing tasks
- Mark tasks as complete
- Delete tasks
- Persist tasks using SQLite

Each task can contain:

- Title
- Priority
- Category
- Due date
- Estimated duration
- Recurrence
- Completion status

### Task Priorities

Supported priorities:

- High
- Medium
- Low

### Categories

Supported categories:

- Work
- Study
- Personal
- Other

### Recurring Tasks

Tasks can repeat:

- Daily
- Weekly
- Monthly

When a recurring task is completed, the application automatically creates its next occurrence.

### Overdue Task Tracking

The dashboard automatically identifies incomplete tasks whose due dates have passed and displays them in a dedicated overdue section.

### Productivity Statistics

The application calculates:

- Total tasks
- Completed tasks
- Incomplete tasks
- Overdue tasks
- Completion percentage
- Remaining estimated work time

### Daily Planner

The Daily Planner creates a suggested schedule using:

- A selected planning date
- The user's available time
- Task due dates
- Task priorities
- Estimated task durations

The planner prioritizes eligible tasks and attempts to fit as much useful work as possible into the available time.

Tasks that cannot fit are displayed separately.

### AI Task Assistant

The application includes an AI-assisted natural-language task parser powered by Groq.

For example:

```text
Finish my cybersecurity report tomorrow, high priority, study, 90 minutes
```

can be converted into:

```json
{
  "title": "Finish my cybersecurity report",
  "priority": "High",
  "due_date": "2026-10-27",
  "category": "Study",
  "estimated_duration": 90,
  "recurrence": "None"
}
```

The AI does not automatically save tasks.

Instead:

```text
Natural-language description
        ↓
LLM interpretation
        ↓
Pydantic validation
        ↓
Existing Create Task form
        ↓
User reviews or edits the result
        ↓
Task is saved
```

This keeps deterministic application logic in control while using the LLM only for natural-language interpretation.

## Architecture

```text
React + TypeScript
        ↓
     FastAPI
        ↓
 ┌──────┴───────────┐
 │                  │
Services        AI Service
 │                  │
 │               Groq LLM
 │                  │
 └──────┬───────────┘
        ↓
      SQLite
```

### Frontend

Built with:

- React
- TypeScript
- Vite
- CSS

The frontend is responsible for:

- Dashboard rendering
- Task forms
- Task editing
- Statistics display
- Daily planning interface
- AI Task Assistant interface
- Loading and error states
- Responsive layout

### Backend

Built with:

- Python
- FastAPI
- Pydantic
- SQLite

The backend handles:

- REST API routes
- Task validation
- Database operations
- Task planning
- Statistics
- Overdue detection
- Recurring-task generation
- AI requests

### AI Layer

AI functionality is separated into:

```text
backend/ai_service.py
```

The AI layer uses:

- Groq API
- Structured Outputs
- JSON Schema
- Pydantic validation

The current model used by the application is:

```text
openai/gpt-oss-20b
```

## Project Structure

```text
personal-productivity-assistant/
│
├── backend/
│   ├── ai_service.py
│   ├── api.py
│   ├── database.py
│   ├── services.py
│   ├── task.py
│   └── tasks.db
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
├── .gitignore
├── requirements.txt
└── README.md
```

`tasks.db` is a local SQLite database and is excluded from Git.

## Backend Validation

The backend validates incoming data independently of the frontend.

Examples include:

### Allowed priority values

```python
Literal["High", "Medium", "Low"]
```

### Positive task durations

```python
Field(gt=0)
```

### Allowed recurrence values

```python
Literal[
    "None",
    "Daily",
    "Weekly",
    "Monthly"
]
```

### Date validation

Dates must use:

```text
YYYY-MM-DD
```

Invalid API requests are rejected before reaching the database.

## AI Output Validation

LLM-generated data is not trusted automatically.

The application defines a Pydantic schema describing exactly what the AI is allowed to return.

Unexpected properties are rejected using:

```python
ConfigDict(extra="forbid")
```

The overall design principle is:

```text
LLM = interpretation
Python = authority
```

## API Endpoints

The FastAPI backend includes endpoints such as:

```text
GET    /tasks
POST   /tasks
PATCH  /tasks/{task_id}
PATCH  /tasks/{task_id}/complete
DELETE /tasks/{task_id}

GET    /statistics
GET    /tasks/overdue

POST   /plan
POST   /ai/parse-task
```

Interactive API documentation is automatically available through FastAPI at:

```text
http://127.0.0.1:8000/docs
```

## Installation

### Prerequisites

Install:

- Python
- Node.js
- npm

A Groq API key is required for the AI Task Assistant.

## Backend Setup

Clone the repository and enter the project directory.

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

Set your Groq API key.

For Windows:

```powershell
setx GROQ_API_KEY "YOUR_GROQ_API_KEY"
```

Open a new terminal after setting the environment variable.

Move into the backend:

```powershell
cd backend
```

Start FastAPI:

```powershell
uvicorn api:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

## Frontend Setup

Open another terminal and move into:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Then open:

```text
http://localhost:5173
```

## Example AI Workflow

Input:

```text
Review cybersecurity notes every week for 30 minutes, medium priority, study
```

The AI can interpret this as:

```text
Title: Review cybersecurity notes
Priority: Medium
Category: Study
Duration: 30 minutes
Recurrence: Weekly
```

The generated values populate the normal task form so the user can review them before saving.

## Daily Planner Example

Suppose the user has:

```text
50 min — High priority
30 min — Medium priority
40 min — Medium priority
20 min — Low priority
90 min — Low priority
```

and provides:

```text
Available time: 120 minutes
```

The planner can select:

```text
50 + 30 + 40 = 120 minutes
```

and place tasks that do not fit into a separate unscheduled section.

## Testing

The final application was manually tested for:

- Task creation
- Task editing
- Task completion
- Task deletion
- SQLite persistence
- Overdue detection
- Statistics
- Daily planning
- Recurring tasks
- AI task parsing
- Relative-date interpretation
- AI recurrence interpretation
- Invalid API input
- Backend validation
- Responsive frontend behavior

## Development Journey

The project was developed incrementally.

```text
CLI Task Manager
      ↓
JSON Persistence
      ↓
Task Class
      ↓
SQLite
      ↓
Categories & Durations
      ↓
Planning Logic
      ↓
Services Layer
      ↓
Recurring Tasks
      ↓
FastAPI REST API
      ↓
React + TypeScript
      ↓
Responsive Dashboard
      ↓
Daily Planner UI
      ↓
LLM Integration
      ↓
Validation & Portfolio Cleanup
```

This progression was intentional and helped separate concerns as the project grew.

## What I Learned

Building this project provided hands-on experience with:

- Python application design
- Object-oriented programming
- SQLite
- SQL CRUD operations
- Business-logic separation
- REST APIs
- FastAPI
- Pydantic
- Data validation
- React
- TypeScript
- React state management
- Controlled forms
- Async HTTP requests
- Frontend/backend integration
- Responsive UI design
- LLM APIs
- Structured Outputs
- JSON Schema
- Prompt design
- AI output validation
- Environment variables
- Virtual environments
- Debugging full-stack applications

## Future Improvements

Potential future additions include:

- User authentication
- Multiple user accounts
- Cloud database deployment
- Task search and advanced filters
- Calendar integration
- Drag-and-drop scheduling
- Notifications
- Task history
- AI-generated daily plans
- Natural-language task editing
- Deployment
- RAG-based productivity history and contextual memory

## Security

API keys and local environment files must never be committed to source control.

The repository excludes sensitive/local files such as:

```text
.env
.env.*
.venv/
*.db
node_modules/
```

The Groq API key is loaded through an environment variable rather than being hard-coded into the application.

## Status

The core application is complete and fully functional.

It currently supports:

```text
Task Management
+ Planning
+ Statistics
+ Recurrence
+ Persistence
+ AI-assisted Task Creation
```

The project was built as a learning and portfolio project focused on full-stack development and practical AI integration.