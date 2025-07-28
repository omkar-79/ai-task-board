# AI Task Board - Project Configuration

## Project Overview
A personal task management web app with AI-powered task categorization and suggestions using Google Gemini API.

## Technical Stack
- **Frontend**: Next.js 15.4.4, React 19.1.0, TypeScript 5
- **UI Libraries**: Chakra UI v3.23.0, Material UI v7.2.0, TailwindCSS v4
- **Drag & Drop**: React DnD v16.0.1
- **AI Integration**: Google Gemini API (gemini-2.5-pro or gemini-2.5-flash)

## Core Features

### 1. Kanban Board (6 Columns)
- **Today**: Tasks scheduled for today
- **This Week**: Tasks for current week
- **Important**: High-priority tasks
- **Daily**: Recurring daily tasks
- **Pending**: Unscheduled tasks
- **Overdue**: Past-due tasks

### 2. Task Management
- **Task Input Card**: Title, description, deadline, duration, task type (Regular/Important)
- **Drag & Drop**: Move tasks between columns
- **Task Types**: Regular tasks vs Important tasks

### 3. User Profile System
- **Schedule Management**: Work/sleep/free hours by day (7-day week)
- **CRUD Operations**: Create, read, update, delete time blocks
- **Free Time Calculation**: Automatic detection of available time slots

### 4. AI Integration (Gemini API)
- **Function Calling**: Use Gemini's function calling for structured responses
- **Task Categorization**: Auto-assign new tasks to correct columns
- **Task Suggestions**: Recommend tasks during free time based on:
  - Task importance level
  - Pending status
  - Time requirements vs available time

## Gemini Integration Specifications

### System Instructions
```
You are an AI assistant that categorizes tasks and recommends next tasks for a personal task management system. Use the provided functions to return structured responses. Always return valid JSON function calls.
```

### Function Declarations

#### 1. Task Categorization Function
```json
{
  "name": "categorize_task",
  "description": "Assigns a single task to the correct column based on deadline, importance, and current date",
  "parameters": {
    "type": "object",
    "properties": {
      "taskId": {"type": "string", "description": "Unique identifier of the task"},
      "targetColumn": {
        "type": "string", 
        "enum": ["Today", "This Week", "Important", "Daily", "Pending", "Overdue"],
        "description": "Target column for the task"
      },
      "reasoning": {"type": "string", "description": "Brief explanation for the categorization"}
    },
    "required": ["taskId", "targetColumn", "reasoning"]
  }
}
```

#### 2. Task Suggestion Function
```json
{
  "name": "suggest_task",
  "description": "Recommends tasks that fit within a free time block",
  "parameters": {
    "type": "object",
    "properties": {
      "suggestions": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Array of task IDs recommended for the free time slot"
      },
      "freeTimeMinutes": {"type": "number", "description": "Available minutes in the time slot"},
      "reasoning": {"type": "string", "description": "Explanation for the suggestions"}
    },
    "required": ["suggestions", "freeTimeMinutes", "reasoning"]
  }
}
```

### Context Data Structure
When calling Gemini API, include:
- User's weekly schedule profile
- List of all pending tasks with metadata
- Newly created task (for categorization)
- Available free time window (for suggestions)

## Data Models

### Task Interface
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  duration: number; // minutes
  type: 'regular' | 'important';
  column: 'Today' | 'This Week' | 'Important' | 'Daily' | 'Pending' | 'Overdue';
  createdAt: Date;
  completedAt?: Date;
}
```

### User Profile Interface
```typescript
interface UserProfile {
  id: string;
  schedule: {
    [day: string]: {
      workHours: { start: string; end: string }[];
      sleepHours: { start: string; end: string };
      freeTime: { start: string; end: string }[];
    };
  };
}
```

## File Structure
```
web-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx (with providers)
│   │   ├── page.tsx (main dashboard)
│   │   └── globals.css
│   ├── components/
│   │   ├── KanbanBoard/
│   │   ├── TaskInput/
│   │   ├── ProfileSection/
│   │   └── common/
│   ├── lib/
│   │   ├── gemini.ts (API integration)
│   │   ├── types.ts (TypeScript interfaces)
│   │   └── utils.ts
│   └── hooks/
│       ├── useTasks.ts
│       ├── useProfile.ts
│       └── useGemini.ts
```

## Development Phases
1. **Setup & Configuration**: Dependencies, providers, types
2. **Core UI Components**: Kanban board, task input, profile section
3. **Drag & Drop**: React DnD implementation
4. **AI Integration**: Gemini API with function calling
5. **Testing & Polish**: Complete functionality review 