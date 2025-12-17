// Database types for Supabase
// Generated based on the schema defined in the migration

export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      folders: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'task' | 'journal'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'task' | 'journal'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'task' | 'journal'
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          completed: boolean
          due_date: string | null
          folder_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          folder_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          completed?: boolean
          due_date?: string | null
          folder_id?: string | null
          created_at?: string
        }
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          title: string | null
          content: string
          mood: string | null
          folder_id: string | null
          status: 'active' | 'archived' | 'deleted'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string | null
          content: string
          mood?: string | null
          folder_id?: string | null
          status?: 'active' | 'archived' | 'deleted'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string | null
          content?: string
          mood?: string | null
          folder_id?: string | null
          status?: 'active' | 'archived' | 'deleted'
          created_at?: string
        }
      }
      pomodoro_sessions: {
        Row: {
          id: string
          user_id: string
          duration_minutes: number
          task_id: string | null
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          duration_minutes: number
          task_id?: string | null
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          duration_minutes?: number
          task_id?: string | null
          completed_at?: string
        }
      }
      water_logs: {
        Row: {
          id: string
          user_id: string
          amount_ml: number
          logged_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount_ml: number
          logged_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount_ml?: number
          logged_at?: string
        }
      }
      breathing_sessions: {
        Row: {
          id: string
          user_id: string
          exercise_type: string | null
          duration_seconds: number | null
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_type?: string | null
          duration_seconds?: number | null
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_type?: string | null
          duration_seconds?: number | null
          completed_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read_by: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read_by?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read_by?: string[] | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      agreements: {
        Row: {
          id: string
          pizza: boolean
          cake: boolean
          movies: boolean
          stardew: boolean
          created_at: string
        }
        Insert: {
          id?: string
          pizza?: boolean
          cake?: boolean
          movies?: boolean
          stardew?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          pizza?: boolean
          cake?: boolean
          movies?: boolean
          stardew?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          nickname: string
          username: string
          avatar_url: string | null
          bio: string | null
          highlights: any[] | null
          created_at: string
        }
        Insert: {
          id?: string
          nickname: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          highlights?: any[] | null
          created_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          highlights?: any[] | null
          created_at?: string
        }
      }
      profile_posts: {
        Row: {
          id: string
          user_id: string
          profile_nickname: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_nickname: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_nickname?: string
          url?: string
          created_at?: string
        }
      }
    }
  }
}

// Helper types for easier access
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
