import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  Task, 
  UserProfile, 
  GeminiCategorizationRequest, 
  GeminiCategorizationResponse,
  GeminiSuggestionRequest,
  GeminiSuggestionResponse,
  GeminiFunctionCall,
  TaskColumn,
  TimeBlock
} from './types';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Function declarations for Gemini
const categorizeTaskFunction = {
  functionDeclarations: [{
    name: 'categorize_task',
    description: 'Assigns a single task to the correct column based on deadline, importance, and current date',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'Unique identifier of the task'
        },
        targetColumn: {
          type: 'string',
          enum: ['Today', 'This Week', 'Important', 'Daily', 'Pending', 'Overdue'],
          description: 'Target column for the task'
        },
        reasoning: {
          type: 'string',
          description: 'Brief explanation for the categorization'
        }
      },
      required: ['taskId', 'targetColumn', 'reasoning']
    }
  }]
};

const suggestTaskFunction = {
  functionDeclarations: [{
    name: 'suggest_task',
    description: 'Recommends tasks that fit within a free time block',
    parameters: {
      type: 'object',
      properties: {
        suggestions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of task IDs recommended for the free time slot'
        },
        freeTimeMinutes: {
          type: 'number',
          description: 'Available minutes in the time slot'
        },
        reasoning: {
          type: 'string',
          description: 'Explanation for the suggestions'
        }
      },
      required: ['suggestions', 'freeTimeMinutes', 'reasoning']
    }
  }]
};

// System instructions for Gemini
const systemInstructions = `
You are an AI assistant that categorizes tasks and recommends next tasks for a personal task management system. 

Your responsibilities:
1. Categorize new tasks into the appropriate column based on deadline, importance, and current date
2. Suggest tasks that fit within available free time blocks

When categorizing tasks:
- "Today": Tasks due today
- "This Week": Tasks due within the current week
- "Important": High-priority tasks regardless of deadline
- "Daily": Recurring daily tasks
- "Pending": Unscheduled tasks
- "Overdue": Tasks past their deadline

When suggesting tasks:
- Consider task duration vs available free time
- Prioritize important tasks
- Consider task deadlines and urgency
- Suggest tasks that can realistically be completed in the time slot

Always return valid JSON function calls using the provided functions.
`;

export class GeminiService {
  private model: any;

  constructor() {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      console.warn('Gemini API key not found. AI features will be disabled.');
      return;
    }

    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro'
    });
  }

  private async callGemini(prompt: string): Promise<any> {
    if (!this.model) {
      throw new Error('Gemini API not configured');
    }

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 1024,
        },
        systemInstruction: systemInstructions
      });

      const response = await result.response;
      return response;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  async categorizeTask(request: GeminiCategorizationRequest): Promise<GeminiCategorizationResponse> {
    const prompt = `
Please categorize the following task into the appropriate column.

Task Details:
- ID: ${request.task.id}
- Title: ${request.task.title}
- Description: ${request.task.description || 'No description'}
- Deadline: ${request.task.deadline ? new Date(request.task.deadline).toLocaleDateString() : 'No deadline'}
- Duration: ${request.task.duration} minutes
- Type: ${request.task.type}

Current Date: ${new Date().toLocaleDateString()}

User Profile:
- Work Schedule: ${JSON.stringify(request.userProfile.schedule, null, 2)}

Available Columns: Today, This Week, Important, Daily, Pending, Overdue

Please use the categorize_task function to assign this task to the correct column.
`;

    const response = await this.callGemini(prompt);
    
    // Parse function call from response
    const functionCall = this.parseFunctionCall(response);
    
    if (functionCall?.name === 'categorize_task') {
      return {
        taskId: functionCall.arguments.taskId || request.task.id,
        targetColumn: functionCall.arguments.targetColumn as TaskColumn,
        reasoning: functionCall.arguments.reasoning || 'AI categorization'
      };
    }

    throw new Error('Invalid response format from Gemini');
  }

  async suggestTasks(request: GeminiSuggestionRequest): Promise<GeminiSuggestionResponse> {
    const availableTasks = request.availableTasks
      .map(task => `- ${task.id}: ${task.title} (${task.duration} min, ${task.type})`)
      .join('\n');

    const prompt = `
Please suggest tasks that fit within the available free time.

Free Time Window: ${request.freeTimeWindow.start} - ${request.freeTimeWindow.end}
Available Minutes: ${this.calculateTimeBlockDuration(request.freeTimeWindow)}

Available Tasks:
${availableTasks}

User Profile:
- Schedule: ${JSON.stringify(request.userProfile.schedule, null, 2)}

Please use the suggest_task function to recommend tasks that can be completed in this time slot.
Consider task duration, importance, and deadlines when making suggestions.
`;

    const response = await this.callGemini(prompt);
    
    // Parse function call from response
    const functionCall = this.parseFunctionCall(response);
    
    if (functionCall?.name === 'suggest_task') {
      return {
        suggestions: functionCall.arguments.suggestions || [],
        freeTimeMinutes: functionCall.arguments.freeTimeMinutes || 0,
        reasoning: functionCall.arguments.reasoning || 'AI suggestions'
      };
    }

    throw new Error('Invalid response format from Gemini');
  }

  private parseFunctionCall(response: any): GeminiFunctionCall | null {
    try {
      // Extract function call from response
      const candidates = response.candidates?.[0]?.content?.parts || [];
      
      for (const part of candidates) {
        if (part.functionCall) {
          return {
            name: part.functionCall.name as 'categorize_task' | 'suggest_task',
            arguments: part.functionCall.args || {}
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing function call:', error);
      return null;
    }
  }

  private calculateTimeBlockDuration(timeBlock: TimeBlock): number {
    const startMinutes = this.timeStringToMinutes(timeBlock.start);
    const endMinutes = this.timeStringToMinutes(timeBlock.end);
    return endMinutes - startMinutes;
  }

  private timeStringToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Fallback categorization when AI is not available
  categorizeTaskFallback(task: Task): TaskColumn {
    const now = new Date();
    
    if (task.deadline && task.deadline < now) {
      return 'Overdue';
    }
    
    if (task.deadline && this.isToday(task.deadline)) {
      return 'Today';
    }
    
    if (task.deadline && this.isThisWeek(task.deadline)) {
      return 'This Week';
    }
    
    if (task.type === 'important') {
      return 'Important';
    }
    
    return 'Pending';
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isThisWeek(date: Date): boolean {
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
    return date >= startOfWeek && date <= endOfWeek;
  }
}

// Export singleton instance
export const geminiService = new GeminiService(); 