import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin işlemleri için service role client
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'conditioner' | 'player';
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          role: 'conditioner' | 'player';
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          role?: 'conditioner' | 'player';
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          name: string;
          avatar_url: string;
          position: string;
          phone?: string;
          email?: string;
          birth_date?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          avatar_url: string;
          position: string;
          phone?: string;
          email?: string;
          birth_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string;
          position?: string;
          phone?: string;
          email?: string;
          birth_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      metrics: {
        Row: {
          id: string;
          name: string;
          unit: string;
          input_type: 'manual' | 'calculated' | 'survey' | 'percentage_change';
          formula?: string;
          survey_question_key?: string;
          is_active: boolean;
          show_in_radar: boolean;
          base_metric_id?: string;
          percentage_change_period?: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: string;
          input_type: 'manual' | 'calculated' | 'survey' | 'percentage_change';
          formula?: string;
          survey_question_key?: string;
          is_active?: boolean;
          show_in_radar?: boolean;
          base_metric_id?: string;
          percentage_change_period?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          unit?: string;
          input_type?: 'manual' | 'calculated' | 'survey' | 'percentage_change';
          formula?: string;
          survey_question_key?: string;
          is_active?: boolean;
          show_in_radar?: boolean;
          base_metric_id?: string;
          percentage_change_period?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      measurements: {
        Row: {
          id: string;
          player_id: string;
          metric_id: string;
          value: number;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          metric_id: string;
          value: number;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          metric_id?: string;
          value?: number;
          date?: string;
          created_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          player_id: string;
          text: string;
          date: string;
          is_public: boolean;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          text: string;
          date: string;
          is_public: boolean;
          author_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          text?: string;
          date?: string;
          is_public?: boolean;
          author_id?: string;
          created_at?: string;
        };
      };
      injuries: {
        Row: {
          id: string;
          player_id: string;
          description: string;
          estimated_recovery: string;
          date: string;
          recovery_date?: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          description: string;
          estimated_recovery: string;
          date: string;
          recovery_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          description?: string;
          estimated_recovery?: string;
          date?: string;
          recovery_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      daily_surveys: {
        Row: {
          id: string;
          player_id: string;
          date: string;
          sleep_hours?: number;
          sleep_quality?: number;
          soreness?: number;
          pain_details?: string;
          survey_data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          date: string;
          sleep_hours?: number;
          sleep_quality?: number;
          soreness?: number;
          pain_details?: string;
          survey_data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          date?: string;
          sleep_hours?: number;
          sleep_quality?: number;
          soreness?: number;
          pain_details?: string;
          survey_data?: any;
          created_at?: string;
        };
      };
      survey_questions: {
        Row: {
          id: string;
          label: string;
          key: string;
          is_active: boolean;
          type: 'number' | 'range' | 'textarea';
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          key: string;
          is_active?: boolean;
          type: 'number' | 'range' | 'textarea';
          created_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          key?: string;
          is_active?: boolean;
          type?: 'number' | 'range' | 'textarea';
          created_at?: string;
        };
      };
      schedule_events: {
        Row: {
          id: string;
          date: string;
          time?: string;
          title: string;
          description?: string;
          is_team_event: boolean;
          player_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          time?: string;
          title: string;
          description?: string;
          is_team_event: boolean;
          player_ids: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          time?: string;
          title?: string;
          description?: string;
          is_team_event?: boolean;
          player_ids?: string[];
          created_at?: string;
        };
      };
    };
  };
}
