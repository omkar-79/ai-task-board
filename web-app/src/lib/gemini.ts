import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Task, UserProfile, GeminiTaskCategorizationResponse, GeminiTaskSuggestionResponse, ColumnId } from './types';
import { formatDate, formatTime } from './utils';

// Initialize Gemini AI
const initializeGemini = (apiKey: string) => {
  return new GoogleGenerativeAI(apiKey);
};

// System instruction for Gemini
const SYSTEM_INSTRUCTION = `You are an AI assistant that categorizes tasks and recommends next tasks for a personal task management system. 

TASK CATEGORIZATION RULES:
- "Today": Tasks with deadline today or urgent tasks that should be done today
- "This Week": Tasks with deadline within current week 
- "Important": Tasks marked as important type, regardless of deadline
- "Daily": Recurring daily tasks or routine activities
- "Pending": Tasks without specific deadline or low priority
- "Overdue": Tasks with deadline in the past

TASK SUGGESTION RULES:
- Prioritize important tasks first
- Consider available time vs task duration
- Factor in deadline proximity
- Suggest tasks that fit well in the available time slot
- Maximum 3 task suggestions per request

Use the provided functions to return structured responses. Always return valid JSON function calls with clear reasoning.`;

// Function declarations for Gemini
const FUNCTION_DECLARATIONS = [
  {
    name: 'categorize_task',
    description: 'Assigns a single task to the correct column based on deadline, importance, and current date',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        taskId: {
          type: SchemaType.STRING,
          description: 'Unique identifier of the task'
        },
        targetColumn: {
          type: SchemaType.STRING,
          enum: ['Today', 'This Week', 'Important', 'Daily', 'Pending', 'Overdue'],
          description: 'Target column for the task'
        },
        reasoning: {
          type: SchemaType.STRING,
          description: 'Brief explanation for the categorization decision'
        }
      },
      required: ['taskId', 'targetColumn', 'reasoning']
    }
  },
  {
    name: 'suggest_task',
    description: 'Recommends tasks that fit within a free time block',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        suggestions: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Array of task IDs recommended for the free time slot (max 3)'
        },
        freeTimeMinutes: {
          type: SchemaType.NUMBER,
          description: 'Available minutes in the time slot'
        },
        reasoning: {
          type: SchemaType.STRING,
          description: 'Explanation for the task suggestions'
        }
      },
      required: ['suggestions', 'freeTimeMinutes', 'reasoning']
    }
  }
];

// Build context for Gemini API calls
const buildTaskCategorizationContext = (
  task: Omit<Task, 'column' | 'order'>,
  userProfile: UserProfile,
  currentDate: Date
): string => {
  const today = formatDate(currentDate);
  const now = formatTime(currentDate);

  return `
CURRENT CONTEXT:
- Date: ${today}
- Time: ${now}
- User timezone: ${userProfile.timezone || 'UTC'}

TASK TO CATEGORIZE:
- ID: ${task.id}
- Title: ${task.title}
- Description: ${task.description || 'No description'}
- Type: ${task.type}
- Duration: ${task.duration} minutes
- Deadline: ${task.deadline ? formatDate(task.deadline) : 'No deadline'}
- Created: ${formatDate(task.createdAt)}

Please categorize this task into the appropriate column using the categorize_task function.
  `.trim();
};

const buildTaskSuggestionContext = (
  availableTimeMinutes: number,
  pendingTasks: Task[],
  userProfile: UserProfile,
  currentDate: Date
): string => {
  const today = formatDate(currentDate);
  const now = formatTime(currentDate);

  const tasksList = pendingTasks.map(task => 
    `- ${task.id}: "${task.title}" (${task.type}, ${task.duration}min, deadline: ${task.deadline ? formatDate(task.deadline) : 'none'})`
  ).join('\n');

  return `
CURRENT CONTEXT:
- Date: ${today}
- Time: ${now}
- Available time: ${availableTimeMinutes} minutes
- User timezone: ${userProfile.timezone || 'UTC'}

PENDING TASKS TO CONSIDER:
${tasksList || 'No pending tasks available'}

Please suggest up to 3 tasks that would fit well in the available ${availableTimeMinutes}-minute time slot using the suggest_task function. Consider task importance, duration, and deadlines.
  `.trim();
};

// Main Gemini service class
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string, modelName: string = 'gemini-2.0-flash-exp') {
    this.genAI = initializeGemini(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }]
    });
  }

  async categorizeTask(
    task: Omit<Task, 'column' | 'order'>,
    userProfile: UserProfile,
    currentDate: Date = new Date()
  ): Promise<GeminiTaskCategorizationResponse> {
    try {
      const context = buildTaskCategorizationContext(task, userProfile, currentDate);
      
      const result = await this.model.generateContent(context);
      const response = await result.response;
      
      if (response.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
        const functionCall = response.candidates[0].content.parts[0].functionCall;
        
        if (functionCall.name === 'categorize_task') {
          return {
            name: 'categorize_task',
            args: {
              taskId: functionCall.args.taskId,
              targetColumn: functionCall.args.targetColumn as ColumnId,
              reasoning: functionCall.args.reasoning
            }
          };
        }
      }

      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      console.error('Error calling Gemini API for task categorization:', error);
      throw error;
    }
  }

  async suggestTasks(
    availableTimeMinutes: number,
    pendingTasks: Task[],
    userProfile: UserProfile,
    currentDate: Date = new Date()
  ): Promise<GeminiTaskSuggestionResponse> {
    try {
      const context = buildTaskSuggestionContext(availableTimeMinutes, pendingTasks, userProfile, currentDate);
      
      const result = await this.model.generateContent(context);
      const response = await result.response;
      
      if (response.candidates?.[0]?.content?.parts?.[0]?.functionCall) {
        const functionCall = response.candidates[0].content.parts[0].functionCall;
        
        if (functionCall.name === 'suggest_task') {
          return {
            name: 'suggest_task',
            args: {
              suggestions: functionCall.args.suggestions,
              freeTimeMinutes: functionCall.args.freeTimeMinutes,
              reasoning: functionCall.args.reasoning
            }
          };
        }
      }

      throw new Error('Invalid response format from Gemini API');
    } catch (error) {
      console.error('Error calling Gemini API for task suggestions:', error);
      throw error;
    }
  }
}

// Factory function to create Gemini service instance
export const createGeminiService = (apiKey: string, modelName?: string): GeminiService => {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }
  return new GeminiService(apiKey, modelName);
};

// Environment variable helper
export const getGeminiApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('NEXT_PUBLIC_GEMINI_API_KEY not found in environment variables');
    return '';
  }
  return apiKey;
}; 