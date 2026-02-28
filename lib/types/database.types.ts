// Gegenereerd door Supabase CLI: npx supabase gen types typescript --project-id YOUR_ID > lib/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: { id: string; name: string; slug: string; subscription_status: string; trial_ends_at: string | null; mollie_customer_id: string | null; created_at: string }
        Insert: { id?: string; name: string; slug: string; subscription_status?: string; trial_ends_at?: string | null; mollie_customer_id?: string | null; created_at?: string }
        Update: { id?: string; name?: string; slug?: string; subscription_status?: string; trial_ends_at?: string | null; mollie_customer_id?: string | null; created_at?: string }
        Relationships: []
      }
      tenant_users: {
        Row: { id: string; tenant_id: string; user_id: string; role: string; created_at: string }
        Insert: { id?: string; tenant_id: string; user_id: string; role?: string; created_at?: string }
        Update: { id?: string; tenant_id?: string; user_id?: string; role?: string; created_at?: string }
        Relationships: [{ foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }]
      }
      leads: {
        Row: { id: string; tenant_id: string; name: string; email: string | null; phone: string | null; source: string; status: string; ai_score: number | null; ai_label: string | null; ai_summary: string | null; budget_estimate: string | null; urgency: string | null; intent: string | null; assigned_to: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; tenant_id: string; name: string; email?: string | null; phone?: string | null; source: string; status?: string; ai_score?: number | null; ai_label?: string | null; ai_summary?: string | null; budget_estimate?: string | null; urgency?: string | null; intent?: string | null; assigned_to?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; tenant_id?: string; name?: string; email?: string | null; phone?: string | null; source?: string; status?: string; ai_score?: number | null; ai_label?: string | null; ai_summary?: string | null; budget_estimate?: string | null; urgency?: string | null; intent?: string | null; assigned_to?: string | null; created_at?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }]
      }
      lead_messages: {
        Row: { id: string; lead_id: string; tenant_id: string; direction: string; channel: string; content: string; metadata: Json; sent_at: string }
        Insert: { id?: string; lead_id: string; tenant_id: string; direction: string; channel: string; content: string; metadata?: Json; sent_at?: string }
        Update: { id?: string; lead_id?: string; tenant_id?: string; direction?: string; channel?: string; content?: string; metadata?: Json; sent_at?: string }
        Relationships: [{ foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }]
      }
      lead_events: {
        Row: { id: string; lead_id: string; tenant_id: string; user_id: string | null; event_type: string; payload: Json; created_at: string }
        Insert: { id?: string; lead_id: string; tenant_id: string; user_id?: string | null; event_type: string; payload?: Json; created_at?: string }
        Update: { id?: string; lead_id?: string; tenant_id?: string; user_id?: string | null; event_type?: string; payload?: Json; created_at?: string }
        Relationships: [{ foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }]
      }
      integrations: {
        Row: { id: string; tenant_id: string; type: string; config: Json; is_active: boolean; created_at: string }
        Insert: { id?: string; tenant_id: string; type: string; config?: Json; is_active?: boolean; created_at?: string }
        Update: { id?: string; tenant_id?: string; type?: string; config?: Json; is_active?: boolean; created_at?: string }
        Relationships: [{ foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }]
      }
      telemetry_events: {
        Row: { id: string; tenant_id: string; user_id: string | null; event_name: string; properties: Json; created_at: string }
        Insert: { id?: string; tenant_id: string; user_id?: string | null; event_name: string; properties?: Json; created_at?: string }
        Update: { id?: string; tenant_id?: string; user_id?: string | null; event_name?: string; properties?: Json; created_at?: string }
        Relationships: [{ foreignKeyName: string; columns: string[]; isOneToOne: boolean; referencedRelation: string; referencedColumns: string[] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      get_user_tenant_id: { Args: Record<string, never>; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
