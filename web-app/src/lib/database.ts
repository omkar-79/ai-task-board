import { supabase } from './supabase'
import { Task, UserProfile } from './types'
import type { Database } from './supabase'
import { getUserTimezone } from './timezone'

// Database service layer for tasks and user profiles
// All deadline timestamps are stored in EST timezone

type TaskRow = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

// Convert database row to Task interface
const mapTaskRowToTask = (row: TaskRow): Task => {
  let recurrenceTime: string | undefined;
  let recurrenceDay: string | undefined;

  if (row.recurrence_time) {
    const timestamp = new Date(row.recurrence_time);
    const timeString = timestamp.toISOString().slice(11, 16); // Extract HH:MM
    
    if (row.recurrence === 'everyweek') {
      // For weekly tasks, extract day from timestamp
      const dayNumber = timestamp.getDay();
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      recurrenceDay = dayNames[dayNumber];
      recurrenceTime = timeString;
    } else {
      // For daily tasks, just use time
      recurrenceTime = timeString;
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
    recurrenceTime: recurrenceTime,
    scheduledDate: row.scheduled_date ? new Date(row.scheduled_date).toISOString().slice(0, 10) : undefined, // Extract YYYY-MM-DD
    scheduledTime: row.scheduled_time ? new Date(row.scheduled_time).toISOString().slice(11, 16) : undefined // Extract HH:MM
  };
};

// Convert Task interface to database insert
const mapTaskToInsert = (task: Omit<Task, 'id' | 'createdAt' | 'order'>, userId: string): TaskInsert => {
  // Helper function to convert date to ISO string in user's timezone
  const dateToISOString = (date: Date): string => {
    // Create the date string in the user's timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Get timezone offset in minutes
    const offsetMinutes = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offsetMinutes / 60));
    const offsetMinutesRemaining = Math.abs(offsetMinutes % 60);
    const offsetSign = offsetMinutes <= 0 ? '+' : '-';
    const offsetString = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutesRemaining).padStart(2, '0')}`;
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetString}`;
  };

  // Helper function to convert date string to ISO string (for scheduled_date)
  const dateStringToISO = (dateString: string): string => {
    return `${dateString}T00:00:00.000Z`;
  };

  return {
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
    recurrence_time: task.recurrenceTime ? 
      (task.recurrence === 'everyweek' && task.recurrenceDay ? 
        // For weekly tasks, combine day and time into timestamp
        new Date(`2000-01-${getDayNumber(task.recurrenceDay)}T${task.recurrenceTime}:00`).toISOString() :
        // For daily tasks, just use time
        new Date(`2000-01-01T${task.recurrenceTime}:00`).toISOString()
      ) : null,
    scheduled_date: task.scheduledDate ? dateStringToISO(task.scheduledDate) : null, // Convert date string to timestamp
    scheduled_time: task.scheduledTime ? new Date(`2000-01-01T${task.scheduledTime}:00`).toISOString() : null, // Convert time string to timestamp
    user_id: userId
  };
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
    console.log('Fetching tasks for user:', userId)
    
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

      console.log('Successfully fetched tasks:', data?.length || 0)
      return data.map(mapTaskRowToTask)
    } catch (err) {
      console.error('Exception in getTasks:', err)
      throw err
    }
  },

  // Get tasks by column
  async getTasksByColumn(userId: string, column: string): Promise<Task[]> {
    console.log('Fetching tasks for column:', column, 'user:', userId)
    
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
    console.log('Creating task for user:', userId)
    console.log('Task data received:', task)
    console.log('Task deadline:', task.deadline?.toISOString())
    console.log('Task deadline local:', task.deadline?.toLocaleDateString())
    
    try {
      const insertData = mapTaskToInsert(task, userId)
      console.log('Insert data:', insertData)
      console.log('Insert deadline:', insertData.deadline)
      
      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating task:', error)
        throw new Error(`Failed to create task: ${error.message}`)
      }

      console.log('Successfully created task:', data.id)
      console.log('Database deadline:', data.deadline)
      const mappedTask = mapTaskRowToTask(data)
      console.log('Mapped task deadline:', mappedTask.deadline?.toISOString())
      console.log('Mapped task deadline local:', mappedTask.deadline?.toLocaleDateString())
      return mappedTask
    } catch (err) {
      console.error('Exception in createTask:', err)
      throw err
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
        recurrence_time: updates.recurrenceTime ? new Date(`2000-01-01T${updates.recurrenceTime}:00`).toISOString() : null, // Convert HH:MM to timestamp
        scheduled_date: updates.scheduledDate ? new Date(`${updates.scheduledDate}T00:00:00`).toISOString() : null, // Convert date string to timestamp
        scheduled_time: updates.scheduledTime ? new Date(`2000-01-01T${updates.scheduledTime}:00`).toISOString() : null // Convert time string to timestamp
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
        timezone: data.timezone || getUserTimezone()
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
        timezone: data.timezone || getUserTimezone()
      }
    } catch (err) {
      console.error('Exception in upsertUserProfile:', err)
      throw err
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, schedule: any): Promise<UserProfile> {
    console.log('Updating profile for user:', userId)
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ schedule })
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
        timezone: data.timezone || getUserTimezone()
      }
    } catch (err) {
      console.error('Exception in updateUserProfile:', err)
      throw err
    }
  }
} 