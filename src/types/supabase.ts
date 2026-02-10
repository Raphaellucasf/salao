export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      units: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          image_url: string | null
          opening_hours: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          image_url?: string | null
          opening_hours?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          image_url?: string | null
          opening_hours?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: 'admin' | 'professional' | 'client'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          phone?: string | null
          role?: 'admin' | 'professional' | 'client'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: 'admin' | 'professional' | 'client'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      professionals: {
        Row: {
          id: string
          user_id: string
          unit_id: string
          bio: string | null
          rating: number
          commission_percentage: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          unit_id: string
          bio?: string | null
          rating?: number
          commission_percentage?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          unit_id?: string
          bio?: string | null
          rating?: number
          commission_percentage?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          unit_id: string
          name: string
          description: string | null
          duration_minutes: number
          price: number
          default_commission_percentage: number
          is_active: boolean
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          name: string
          description?: string | null
          duration_minutes: number
          price: number
          default_commission_percentage?: number
          is_active?: boolean
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          name?: string
          description?: string | null
          duration_minutes?: number
          price?: number
          default_commission_percentage?: number
          is_active?: boolean
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          unit_id: string
          client_id: string
          professional_id: string
          service_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          client_name: string
          client_phone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          client_id?: string
          professional_id: string
          service_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          client_name: string
          client_phone: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          client_id?: string
          professional_id?: string
          service_id?: string
          appointment_date?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          client_name?: string
          client_phone?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          unit_id: string
          appointment_id: string | null
          professional_id: string | null
          type: 'income' | 'expense' | 'commission'
          amount: number
          description: string
          payment_method: 'cash' | 'card' | 'pix' | 'other'
          transaction_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          appointment_id?: string | null
          professional_id?: string | null
          type: 'income' | 'expense' | 'commission'
          amount: number
          description: string
          payment_method: 'cash' | 'card' | 'pix' | 'other'
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          appointment_id?: string | null
          professional_id?: string | null
          type?: 'income' | 'expense' | 'commission'
          amount?: number
          description?: string
          payment_method?: 'cash' | 'card' | 'pix' | 'other'
          transaction_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      inventory: {
        Row: {
          id: string
          unit_id: string
          name: string
          description: string | null
          quantity: number
          unit_type: string
          min_quantity: number
          cost_price: number
          sale_price: number | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          name: string
          description?: string | null
          quantity?: number
          unit_type: string
          min_quantity?: number
          cost_price: number
          sale_price?: number | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          name?: string
          description?: string | null
          quantity?: number
          unit_type?: string
          min_quantity?: number
          cost_price?: number
          sale_price?: number | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          unit_id: string
          name: string
          description: string | null
          service_id: string
          sessions_count: number
          total_price: number
          discount_percentage: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          name: string
          description?: string | null
          service_id: string
          sessions_count: number
          total_price: number
          discount_percentage?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          name?: string
          description?: string | null
          service_id?: string
          sessions_count?: number
          total_price?: number
          discount_percentage?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      blocked_times: {
        Row: {
          id: string
          professional_id: string
          start_datetime: string
          end_datetime: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          professional_id: string
          start_datetime: string
          end_datetime: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          professional_id?: string
          start_datetime?: string
          end_datetime?: string
          reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
