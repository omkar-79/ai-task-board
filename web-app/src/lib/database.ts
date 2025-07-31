import { supabase } from './supabase'
import { Task, UserProfile } from './types'
import type { Database } from './supabase'
import { getUserTimezone, getTimezoneOffset, convertToTimezone } from './time';
import { toZonedTime } from 'date-fns-tz';

// Database service layer for tasks and user profiles
// All deadline timestamps are stored in EST timezone

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Convert database row to Task interface
const mapTaskRowToTask = (row: TaskRow): Task => {
  let recurrenceDay: string | undefined;
  let recurrenceTimeUTC: string | undefined;

  if (row.recurrence_time) {
    if (row.recurrence === 'everyweek') {
      // For weekly tasks, use the stored recurrence_day and recurrence_time
      recurrenceDay = row.recurrence_day || undefined;
      recurrenceTimeUTC = row.recurrence_time;
    } else {
      // For daily tasks, just store UTC timestamp
      recurrenceTimeUTC = row.recurrence_time;
    }
  }

  // Handle scheduled time for all task types
  let scheduledDate: string | undefined = undefined;
  let scheduledTime: string | undefined = undefined;
  
  if (row.scheduled_time) {
    // Treat scheduled_time like deadline - convert UTC to user's timezone
    const userTimezone = getUserTimezone();
    const localDateTime = toZonedTime(new Date(row.scheduled_time), userTimezone);
    
    if (row.recurrence === 'once') {
      // For "once" tasks, extract date and time from converted timestamp
      scheduledDate = localDateTime.toISOString().slice(0, 10); // Extract YYYY-MM-DD
      scheduledTime = localDateTime.toISOString().slice(11, 16); // Extract HH:MM
    } else if (row.recurrence === 'everyday' || row.recurrence === 'everyweek') {
      // For recurring tasks, extract only the time from converted timestamp
      scheduledTime = localDateTime.toISOString().slice(11, 16); // Extract HH:MM
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    deadline: row.deadline ? new Date(row.deadline) : undefined, // Database now stores timezone-aware timestamps
    duration: row.duration || undefined,
    priority: row.priority,
    label: row.label,
    customLabel: row.custom_label || undefined,
    status: row.status,
    column: row.task_column,
    createdAt: new Date(row.created_at),
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    order: row.order_num,
    recurrence: row.recurrence || undefined,
    recurrenceDay: recurrenceDay || row.recurrence_day || undefined,
    recurrenceTimeUTC: recurrenceTimeUTC,
    scheduledTime: row.scheduled_time ? new Date(row.scheduled_time) : undefined, // Same simple approach as deadline
    scheduledDate: scheduledDate
  };
};

// Convert Task interface to database insert
const mapTaskToInsert = (task: Omit<Task, 'id' | 'createdAt' | 'order'>, userId: string): TaskInsert => {
  // Helper function to convert date to ISO string in user's timezone
  const dateToISOString = (date: Date): string => {
    // The date should already be in the correct timezone, so just use toISOString()
    return date.toISOString();
  };

  // Helper function to convert date string to ISO string (for scheduled_date)
  const dateStringToISO = (dateString: string): string => {
    return `${dateString}T00:00:00.000Z`;
  };

  // Handle scheduled time for all task types
  let scheduledTime: string | null = null;
  
  if (task.recurrence === 'once' && task.scheduledDate && task.scheduledTime) {
    // For "once" tasks, scheduledTime is now a Date
    scheduledTime = task.scheduledTime.toISOString();
  } else if ((task.recurrence === 'everyday' || task.recurrence === 'everyweek') && task.scheduledTime) {
    // For recurring tasks, scheduledTime is now a Date
    scheduledTime = task.scheduledTime.toISOString();
  }

  const result = {
    title: task.title,
    description: task.description || null,
    deadline: task.deadline ? dateToISOString(task.deadline) : null,
    duration: task.duration || null,
    priority: task.priority,
    label: task.label,
    custom_label: task.customLabel || null,
    status: task.status,
    task_column: task.column,
    completed_at: task.completedAt ? dateToISOString(task.completedAt) : null,
    recurrence: task.recurrence || null,
    recurrence_day: task.recurrenceDay || null,
    recurrence_time: task.recurrenceTimeUTC || null,
    scheduled_time: scheduledTime,
    user_id: userId
  };

  return result;
};

// Helper function to convert day name to day number
const getDayNumber = (dayName: string): number => {
  const days = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
  return days[dayName as keyof typeof days] || 1;
}

// Task operations
export const taskService = {
  // Get all tasks for a user
  async getTasks(userId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('order_num', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(`Failed to fetch tasks: ${error.message}`)
      }

      return data.map(mapTaskRowToTask)
    } catch (err) {
      console.error('Exception in getTasks:', err)
      throw err
    }
  },

  // Get tasks by column
  async getTasksByColumn(userId: string, column: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('task_column', column)
        .order('order_num', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks by column:', error)
        throw new Error(`Failed to fetch tasks by column: ${error.message}`)
      }

      return data.map(mapTaskRowToTask)
    } catch (err) {
      console.error('Exception in getTasksByColumn:', err)
      throw err
    }
  },

  // Create a new task
  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'order'>, userId: string): Promise<Task> {
    try {
      const insertData = mapTaskToInsert(task, userId);
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        throw new Error(`Failed to create task: ${error.message}`);
      }

      console.log('Successfully created task:', data.id);
      
      return mapTaskRowToTask(data);
    } catch (err) {
      console.error('Exception in createTask:', err);
      throw err;
    }
  },

  // Update a task
  async updateTask(taskId: string, updates: Partial<Task>, userId: string): Promise<Task> {
    console.log('Updating task:', taskId, 'for user:', userId)
    
    try {
      const updateData: TaskUpdate = {
        title: updates.title,
        description: updates.description || null,
        deadline: updates.deadline?.toISOString() || null,
        duration: updates.duration || null,
        priority: updates.priority,
        label: updates.label,
        custom_label: updates.customLabel || null,
        status: updates.status,
        task_column: updates.column,
        completed_at: updates.completedAt?.toISOString() || null,
        recurrence: updates.recurrence || null,
        recurrence_day: updates.recurrenceDay || null,
        recurrence_time: updates.recurrenceTimeUTC || null,
        scheduled_time: updates.scheduledTime ? new Date(`2000-01-01T${updates.scheduledTime}:00`).toISOString() : null
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating task:', error)
        throw new Error(`Failed to update task: ${error.message}`)
      }

      return mapTaskRowToTask(data)
    } catch (err) {
      console.error('Exception in updateTask:', err)
      throw err
    }
  },

  // Delete a task
  async deleteTask(taskId: string, userId: string): Promise<void> {
    console.log('Deleting task:', taskId, 'for user:', userId)
    
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting task:', error)
        throw new Error(`Failed to delete task: ${error.message}`)
      }

      console.log('Successfully deleted task:', taskId)
    } catch (err) {
      console.error('Exception in deleteTask:', err)
      throw err
    }
  },

  // Update task order (for drag and drop)
  async updateTaskOrder(taskId: string, order: number, userId: string): Promise<void> {
    console.log('Updating task order:', taskId, 'order:', order)
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ order_num: order })
        .eq('id', taskId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating task order:', error)
        throw new Error(`Failed to update task order: ${error.message}`)
      }
    } catch (err) {
      console.error('Exception in updateTaskOrder:', err)
      throw err
    }
  },

  // Move task to different column
  async moveTask(taskId: string, column: string, userId: string): Promise<Task> {
    return this.updateTask(taskId, { column: column as any }, userId)
  },

  // Complete a task
  async completeTask(taskId: string, userId: string): Promise<Task> {
    return this.updateTask(taskId, { 
      status: 'completed', 
      completedAt: new Date() 
    }, userId)
  }
}

// User profile operations
export const profileService = {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('Fetching profile for user:', userId)
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found
          console.log('No profile found for user:', userId)
          return null
        }
        console.error('Error fetching user profile:', error)
        throw new Error(`Failed to fetch user profile: ${error.message}`)
      }

      return {
        id: data.id,
        schedule: data.schedule,
        timezone: data.timezone || getUserTimezone(),
        backgroundImage: data.background_image || undefined
      }
    } catch (err) {
      console.error('Exception in getUserProfile:', err)
      throw err
    }
  },

  // Create or update user profile
  async upsertUserProfile(userId: string, schedule: any): Promise<UserProfile> {
    console.log('Upserting profile for user:', userId)
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          schedule,
          timezone: getUserTimezone()
        })
        .select()
        .single()

      if (error) {
        console.error('Error upserting user profile:', error)
        throw new Error(`Failed to save user profile: ${error.message}`)
      }

      return {
        id: data.id,
        schedule: data.schedule,
        timezone: data.timezone || getUserTimezone(),
        backgroundImage: data.background_image || undefined
      }
    } catch (err) {
      console.error('Exception in upsertUserProfile:', err)
      throw err
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, schedule: any): Promise<UserProfile> {
    console.log('Updating profile for user:', userId)
    console.log('Schedule data:', schedule)
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          schedule,
          background_image: schedule.backgroundImage || 'default'
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        throw new Error(`Failed to update user profile: ${error.message}`)
      }

      return {
        id: data.id,
        schedule: data.schedule,
        timezone: data.timezone || getUserTimezone(),
        backgroundImage: data.background_image || undefined
      }
    } catch (err) {
      console.error('Exception in updateUserProfile:', err)
      throw err
    }
  }
} 