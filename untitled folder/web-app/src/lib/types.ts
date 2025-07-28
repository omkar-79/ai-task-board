// Task Management Types
export interface Task {
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

export type TaskColumn = 'Today' | 'This Week' | 'Important' | 'Daily' | 'Pending' | 'Overdue';
export type TaskType = 'regular' | 'important';

// User Profile Types
export interface TimeBlock {
  start: string; // HH:mm format
  end: string;   // HH:mm format
}

export interface DaySchedule {
  workHours: TimeBlock[];
  sleepHours: TimeBlock;
  freeTime: TimeBlock[];
}

export interface UserProfile {
  id: string;
  schedule: {
    [day: string]: DaySchedule;
  };
}

// AI Integration Types
export interface GeminiCategorizationRequest {
  task: Task;
  userProfile: UserProfile;
  allTasks: Task[];
}

export interface GeminiCategorizationResponse {
  taskId: string;
  targetColumn: TaskColumn;
  reasoning: string;
}

export interface GeminiSuggestionRequest {
  freeTimeWindow: TimeBlock;
  availableTasks: Task[];
  userProfile: UserProfile;
}

export interface GeminiSuggestionResponse {
  suggestions: string[]; // task IDs
  freeTimeMinutes: number;
  reasoning: string;
}

// Gemini Function Calling Types
export interface GeminiFunctionCall {
  name: 'categorize_task' | 'suggest_task';
  arguments: {
    taskId?: string;
    targetColumn?: TaskColumn;
    reasoning?: string;
    suggestions?: string[];
    freeTimeMinutes?: number;
  };
}

// UI State Types
export interface DragItem {
  id: string;
  type: 'task';
  column: TaskColumn;
}

export interface ColumnState {
  id: TaskColumn;
  title: string;
  tasks: Task[];
}

// Form Types
export interface TaskFormData {
  title: string;
  description: string;
  deadline?: Date;
  duration: number;
  type: TaskType;
}

export interface ProfileFormData {
  schedule: {
    [day: string]: DaySchedule;
  };
}

// Utility Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  loading: boolean;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  duration: number; // minutes
} 