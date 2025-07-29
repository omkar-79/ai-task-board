import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('tasks').select('count').limit(1)
    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
    console.log('Supabase connection successful')
    return true
  } catch (err) {
    console.error('Supabase connection test error:', err)
    return false
  }
}

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          deadline: string | null
          duration: number | null
          priority: 'high' | 'medium' | 'low'
          label: 'general' | 'work' | 'study' | 'custom'
          custom_label: string | null
          status: 'not_complete' | 'in_progress' | 'completed'
          task_column: 'Today' | 'This Week' | 'Upcoming task' | 'Overdue'
          created_at: string
          completed_at: string | null
          order_num: number
          recurrence: 'once' | 'everyday' | 'everyweek' | null
          recurrence_day: string | null
          recurrence_time: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          user_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          deadline?: string | null
          duration?: number | null
          priority: 'high' | 'medium' | 'low'
          label: 'general' | 'work' | 'study' | 'custom'
          custom_label?: string | null
          status?: 'not_complete' | 'in_progress' | 'completed'
          task_column?: 'Today' | 'This Week' | 'Upcoming task' | 'Overdue'
          created_at?: string
          completed_at?: string | null
          order_num?: number
          recurrence?: 'once' | 'everyday' | 'everyweek' | null
          recurrence_day?: string | null
          recurrence_time?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          user_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          deadline?: string | null
          duration?: number | null
          priority?: 'high' | 'medium' | 'low'
          label?: 'general' | 'work' | 'study' | 'custom'
          custom_label?: string | null
          status?: 'not_complete' | 'in_progress' | 'completed'
          task_column?: 'Today' | 'This Week' | 'Upcoming task' | 'Overdue'
          created_at?: string
          completed_at?: string | null
          order_num?: number
          recurrence?: 'once' | 'everyday' | 'everyweek' | null
          recurrence_day?: string | null
          recurrence_time?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          user_id?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          schedule: any
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          schedule: any
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          schedule?: any
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 