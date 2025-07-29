# AI Task Board - Project Configuration

## Project Overview
A personal task management web app with AI-powered task categorization and suggestions using Google Gemini API.

## Technical Stack

### Frontend
- **Next.js 15.4.4**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript 5**: Type safety
- **TailwindCSS v4**: Utility-first CSS framework
- **Material UI v7.2.0**: Component library
- **React DnD v16.0.1**: Drag and drop functionality
- **date-fns**: Date manipulation utilities

### Backend & Database
- **Supabase**: Database and Authentication
- **PostgreSQL**: Primary database
- **Row Level Security (RLS)**: Data isolation
- **Real-time subscriptions**: Live updates

### AI Integration
- **Google Gemini API**: AI-powered task categorization and suggestions
- **Function calling**: Structured AI responses
- **System instructions**: Context-aware AI behavior

### Timezone Management
- **EST (Eastern Standard Time)**: All times stored and displayed in EST timezone
- **Consistent timezone handling**: Utility functions ensure EST consistency across the app
- **User-friendly display**: Clear EST timezone indicators in UI

## Core Features

### 1. Authentication System
- **User Registration**: Email/password signup with email confirmation
- **User Login**: Secure authentication with Supabase Auth
- **Session Management**: Automatic session persistence and renewal
- **Protected Routes**: All task operations require authentication

### 2. Kanban Board (4 Columns)
- **Today**: Tasks scheduled for today
- **This Week**: Tasks for current week
- **Upcoming task**: High-priority tasks (gray text color)
- **Overdue**: Unscheduled tasks (red text color)

### 3. Task Management
- **Task Input Card**: Title, description, deadline, duration, priority, label
- **Add Task Modal**: Comprehensive form with validation and smart categorization
- **Drag & Drop**: Move tasks between columns
- **Task Priority**: High, Medium, Low with color coding
- **Task Labels**: General, Work, Study, or Custom labels

### 4. Add Task Modal System

### Form Fields
- **Task Title** (required): Text input for task name
- **Description** (optional): Textarea for detailed task description
- **Duration** (optional): Hours and minutes inputs for task duration
- **Priority** (required): Dropdown with options "High", "Medium", "Low"
- **Label** (required): Dropdown with options "General", "Work", "Study", "Custom"
- **Custom Label** (conditional): Text input shown when "Custom" label is selected
- **Recurrence** (required): Dropdown with options "Once", "Every Day", "Every Week"
- **Deadline** (conditional): Date and time inputs for "Once" tasks and high priority tasks
- **Deadline Time** (conditional): Time input in EST timezone for "Once" tasks
- **Scheduled Date/Time** (optional): For "Once" tasks, when user wants to do it
- **Daily Time** (required): Time input for "Every Day" tasks
- **Weekly Day/Time** (required): Day and time inputs for "Every Week" tasks

### Validation Rules
- Task title is mandatory
- Duration is optional (no longer mandatory)
- For "Once" tasks: Deadline date and time are mandatory
- For "Every Day" tasks: Daily time is mandatory
- For "Every Week" tasks: Day and time are mandatory
- For high priority tasks: Deadline is shown but not mandatory for recurring tasks
- Custom label is required when "Custom" label type is selected

### Timezone Support
- All time inputs are in EST (Eastern Standard Time) timezone
- Deadline times are automatically converted to EST when saved
- Time display shows EST timezone indicator

### Recurrence Options
- **Once**: Optional scheduled date/time + mandatory deadline
- **Every Day**: Mandatory time selection
- **Every Week**: Mandatory day selection + mandatory time

### Task Categorization Logic
- **High Priority Tasks**: Automatically assigned to "Upcoming task" column
- **Medium/Low Priority Tasks**: Assigned based on deadline:
  - Today → "Today" column
  - This week → "This Week" column
  - Future → "Overdue" column
  - Past → "Overdue" column (overdue tasks remain in Overdue)

### UI/UX Features
- **Responsive Design**: Desktop (concise) and mobile (scrollable) layouts
- **Blur Background**: Modern modal with backdrop blur effect
- **Form Reset**: Clears all fields when modal opens
- **Event Handling**: Proper click propagation and form submission
- **Optimized Layout**: 3:2 column ratio for desktop, reduced overall width

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
  "description": "Assigns a single task to the correct column based on deadline, priority, and current date",
  "parameters": {
    "type": "object",
    "properties": {
      "taskId": {"type": "string", "description": "Unique identifier of the task"},
      "targetColumn": {
        "type": "string", 
        "enum": ["Today", "This Week", "Upcoming task", "Overdue"],
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
  duration?: number; // minutes - now optional
  priority: 'high' | 'medium' | 'low';
  label: 'general' | 'work' | 'study' | 'custom';
  customLabel?: string; // for custom labels
  status: 'not_complete' | 'in_progress' | 'completed';
  column: 'Today' | 'This Week' | 'Upcoming task' | 'Overdue';
  createdAt: Date;
  completedAt?: Date;
  order: number; // for drag and drop ordering
  recurrence?: 'once' | 'everyday' | 'everyweek';
  recurrenceDay?: string; // for weekly tasks
  recurrenceTime?: string; // for daily and weekly tasks
}
```

### User Profile Interface
```typescript
interface UserProfile {
  id: string;
  schedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
}
```

### Task Tags (UI/DB Mapping)
- **Priority Tags**: Color-coded based on priority (High: red, Medium: yellow, Low: blue)
- **Label Tags**: Display task label (General, Work, Study, or Custom label)
- **Overdue**: Displayed if `deadline` is set and is in the past (compared to current date)

### Data Migration
- **Backward Compatibility**: Automatic migration of old task data (with `type` field) to new structure
- **Migration Logic**: 
  - `type: 'important'` → `priority: 'high'`
  - `type: 'regular'` → `priority: 'medium'`
  - Sets default `label: 'general'` for migrated tasks
  - Removes old `type` field

## File Structure
```
web-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx (with AuthProvider)
│   │   ├── page.tsx (main dashboard with auth)
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthContainer.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignUpForm.tsx
│   │   ├── KanbanBoard/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── ColumnComponent.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TaskModal.tsx
│   │   │   └── AddTaskModal.tsx
│   │   ├── Providers/
│   │   │   └── Providers.tsx
│   │   └── common/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── supabase.ts (client configuration)
│   │   ├── database.ts (service layer)
│   │   ├── gemini.ts (API integration)
│   │   ├── types.ts (TypeScript interfaces)
│   │   └── utils.ts
│   └── hooks/
│       ├── useTasks.ts (database integration)
│       ├── useProfile.ts
│       └── useGemini.ts
├── supabase-schema.sql
└── SETUP.md
```

## Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini API (optional)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

## Recent Updates

### Database Integration
- **Supabase Setup**: Complete database schema with RLS policies
- **Authentication System**: User registration, login, and session management
- **Service Layer**: Database operations with proper error handling
- **Data Persistence**: All tasks and user profiles stored in PostgreSQL
- **Real-time Features**: Ready for real-time subscriptions (future enhancement)

### Authentication Features
- **User Registration**: Email/password signup with validation
- **User Login**: Secure authentication with Supabase Auth
- **Session Management**: Automatic session persistence
- **Protected Routes**: All operations require authentication
- **User Interface**: Clean login/signup forms with error handling

### Backend Architecture
- **Service Layer**: Clean separation between UI and database operations
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Type Safety**: Full TypeScript integration with database types
- **Security**: Row Level Security ensures data isolation
- **Performance**: Optimized queries with proper indexing

### UI/UX Improvements
- **Modal Conciseness**: Reduced Add Task modal width from 80vw to 60vw
- **Layout Optimization**: Changed column ratio from 2:1 to 3:2 for better balance
- **Spacing Reduction**: Reduced padding, margins, and font sizes for more compact design
- **Responsive Design**: Improved desktop layout with better space utilization

### Task Data Model Evolution
- **Priority System**: Replaced simple `type` field with granular `priority` (High/Medium/Low)
- **Label System**: Added `label` field with options (General/Work/Study/Custom)
- **Optional Duration**: Made task duration optional instead of mandatory
- **Custom Labels**: Support for user-defined custom labels

### Recurrence Enhancements
- **Daily Time Selection**: Added mandatory time selection for "Every Day" tasks
- **Validation Logic**: Updated validation to require time for daily tasks
- **Consistent UI**: Time selection follows same pattern as weekly tasks

### Column Updates
- **Column Renaming**: "Pending" → "Overdue", "Important" → "Upcoming task"
- **Color Coding**: "Overdue" (red), "Upcoming task" (gray)
- **Text Colors**: Applied consistent color scheme across the application

## Development Phases
1. **Setup & Configuration**: Dependencies, providers, types, database schema
2. **Authentication**: User registration, login, session management
3. **Core UI Components**: Kanban board, task input, profile section
4. **Database Integration**: Service layer, CRUD operations, error handling
5. **Drag & Drop**: React DnD implementation with database persistence
6. **AI Integration**: Gemini API with function calling
7. **Testing & Polish**: Complete functionality review

#TODO
1) Sort task in columns depending upon time and importance.
2) In today's column, have sections, morning, afternoon, evening, midnight.
3) Maintain the system to record every detail so that we can track our work progress to check our productivity and visualize it into charts.
4) Create a page for completed tasks.
5) Have logic set that in this week column, the tasks should be shown for the day after today to Sunday.
6) Check if the session state is changed only when a user updates anything or creates a new task.
7) Add real-time subscriptions for collaborative features.
8) Implement user profile management with schedule settings.
9) Add task completion analytics and productivity tracking.
10) Create admin dashboard for user management (if needed).
 