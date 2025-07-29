// Task Management Types
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskRecurrence = 'once' | 'everyday' | 'everyweek';
export type TaskStatus = 'not_complete' | 'in_progress' | 'completed';
export type TaskLabel = 'general' | 'work' | 'study' | 'custom';

export type ColumnId = 'Today' | 'This Week' | 'Upcoming task' | 'Overdue';

export interface Task {
  id: string;
  title: string;
  description?: string;
  deadline?: Date;
  duration?: number; // minutes - now optional
  priority: TaskPriority;
  label: TaskLabel;
  customLabel?: string; // for custom labels
  status: TaskStatus;
  column: ColumnId;
  createdAt: Date;
  completedAt?: Date;
  order: number; // for drag and drop ordering
  recurrence?: TaskRecurrence;
  recurrenceDay?: string; // for weekly tasks
  recurrenceTime?: string; // for weekly tasks
  scheduledDate?: string; // for "Once" tasks - when user wants to do it
  scheduledTime?: string; // for "Once" tasks - when user wants to do it
}

export interface Column {
  id: ColumnId;
  title: string;
  tasks: Task[];
  color: string;
}

// User Profile Types
export interface TimeBlock {
  start: string; // HH:MM format
  end: string;   // HH:MM format
}

export interface DaySchedule {
  workHours: TimeBlock[];
  sleepHours: TimeBlock;
  freeTime?: TimeBlock[]; // calculated automatically
}

export interface UserProfile {
  id: string;
  name?: string;
  schedule: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
  timezone: string;
}

// Gemini AI Types
export interface TaskCategorizationRequest {
  action: 'categorize_task';
  task: Omit<Task, 'column' | 'order'>;
  currentDate: string;
  userProfile: UserProfile;
}

export interface TaskSuggestionRequest {
  action: 'suggest_task';
  availableTimeMinutes: number;
  currentDate: string;
  currentTime: string;
  userProfile: UserProfile;
  pendingTasks: Task[];
  completedTasksToday: Task[];
}

export interface GeminiTaskCategorizationResponse {
  name: 'categorize_task';
  args: {
    taskId: string;
    targetColumn: ColumnId;
    reasoning: string;
  };
}

export interface GeminiTaskSuggestionResponse {
  name: 'suggest_task';
  args: {
    suggestions: string[]; // task IDs
    freeTimeMinutes: number;
    reasoning: string;
  };
}

// Component Props Types
export interface KanbanBoardProps {
  columns: Column[];
  onTaskMove: (taskId: string, targetColumn: ColumnId, targetIndex: number) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  userTimezone?: string;
}

export interface TaskInputProps {
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'column' | 'order'>) => void;
  onAICategorizationRequest?: (task: Omit<Task, 'id' | 'createdAt' | 'column' | 'order'>) => void;
}

export interface ProfileSectionProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onFreeTimeRequest?: () => void;
}

// Hook Types
export interface UseTasksReturn {
  tasks: Task[];
  columns: Column[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, targetColumn: ColumnId, targetIndex: number) => Promise<void>;
  getTasksByColumn: (columnId: ColumnId) => Task[];
  loading: boolean;
  error: string | null;
}

export interface UseProfileReturn {
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  calculateFreeTime: (day: keyof UserProfile['schedule']) => TimeBlock[];
  getCurrentFreeTime: () => { available: boolean; duration: number; timeBlock?: TimeBlock };
  loading: boolean;
  error: string | null;
}

export interface UseGeminiReturn {
  categorizeTask: (task: Omit<Task, 'column' | 'order'>) => Promise<GeminiTaskCategorizationResponse>;
  suggestTasks: (availableMinutes: number, pendingTasks: Task[]) => Promise<GeminiTaskSuggestionResponse>;
  loading: boolean;
  error: string | null;
}

// Utility Types
export interface DragItem {
  type: 'TASK';
  id: string;
  sourceColumn: ColumnId;
  index: number;
}

export interface DropResult {
  targetColumn: ColumnId;
  targetIndex: number;
}

// API Configuration
export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-2.0-flash-exp' | 'gemini-1.5-pro' | 'gemini-1.5-flash';
  maxTokens?: number;
  temperature?: number;
} 