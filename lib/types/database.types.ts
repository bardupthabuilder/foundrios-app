export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_modules: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_modules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_sessions: {
        Row: {
          agent_id: string | null
          company_id: string | null
          created_at: string | null
          id: string
          messages: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          module_id: string | null
          name: string
          role: string | null
          status: string | null
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          name: string
          role?: string | null
          status?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          name?: string
          role?: string | null
          status?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "agent_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_read: boolean
          linked_client_id: string | null
          linked_employee_id: string | null
          linked_equipment_id: string | null
          linked_kpi_id: string | null
          linked_lead_id: string | null
          linked_material_id: string | null
          linked_project_id: string | null
          linked_session_id: string | null
          message: string | null
          severity: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          linked_client_id?: string | null
          linked_employee_id?: string | null
          linked_equipment_id?: string | null
          linked_kpi_id?: string | null
          linked_lead_id?: string | null
          linked_material_id?: string | null
          linked_project_id?: string | null
          linked_session_id?: string | null
          message?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          linked_client_id?: string | null
          linked_employee_id?: string | null
          linked_equipment_id?: string | null
          linked_kpi_id?: string | null
          linked_lead_id?: string | null
          linked_material_id?: string | null
          linked_project_id?: string | null
          linked_session_id?: string | null
          message?: string | null
          severity?: Database["public"]["Enums"]["alert_severity"]
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_client_id_fkey"
            columns: ["linked_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_employee_id_fkey"
            columns: ["linked_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_equipment_id_fkey"
            columns: ["linked_equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_kpi_id_fkey"
            columns: ["linked_kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_lead_id_fkey"
            columns: ["linked_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_material_id_fkey"
            columns: ["linked_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "alerts_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_linked_session_id_fkey"
            columns: ["linked_session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bard_tasks: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          owner_type: string | null
          priority: string | null
          source: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_type?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          owner_type?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bard_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_assets: {
        Row: {
          colors: string | null
          company_id: string
          created_at: string | null
          do_rules: string | null
          dont_rules: string | null
          fonts: string | null
          id: string
          name: string
          rules: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          colors?: string | null
          company_id?: string
          created_at?: string | null
          do_rules?: string | null
          dont_rules?: string | null
          fonts?: string | null
          id?: string
          name: string
          rules?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          colors?: string | null
          company_id?: string
          created_at?: string | null
          do_rules?: string | null
          dont_rules?: string | null
          fonts?: string | null
          id?: string
          name?: string
          rules?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      calls: {
        Row: {
          action_items: Json | null
          call_date: string | null
          call_type: string | null
          client_id: string | null
          company_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          summary: string | null
          transcript: string | null
        }
        Insert: {
          action_items?: Json | null
          call_date?: string | null
          call_type?: string | null
          client_id?: string | null
          company_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          summary?: string | null
          transcript?: string | null
        }
        Update: {
          action_items?: Json | null
          call_date?: string | null
          call_type?: string | null
          client_id?: string | null
          company_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          summary?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calls_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      change_orders: {
        Row: {
          cost_impact: number
          created_by: string | null
          decided_at: string | null
          description: string | null
          id: string
          project_id: string
          requested_at: string
          status: Database["public"]["Enums"]["change_order_status"]
          title: string
        }
        Insert: {
          cost_impact?: number
          created_by?: string | null
          decided_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          requested_at?: string
          status?: Database["public"]["Enums"]["change_order_status"]
          title: string
        }
        Update: {
          cost_impact?: number
          created_by?: string | null
          decided_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          requested_at?: string
          status?: Database["public"]["Enums"]["change_order_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_entries: {
        Row: {
          category: string | null
          company_id: string | null
          created_at: string | null
          date: string
          decisions: Json | null
          id: string
          impact_score: number | null
          next_actions: string | null
          updated_at: string | null
          what_didnt: string | null
          what_worked: string | null
        }
        Insert: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          date?: string
          decisions?: Json | null
          id?: string
          impact_score?: number | null
          next_actions?: string | null
          updated_at?: string | null
          what_didnt?: string | null
          what_worked?: string | null
        }
        Update: {
          category?: string | null
          company_id?: string | null
          created_at?: string | null
          date?: string
          decisions?: Json | null
          id?: string
          impact_score?: number | null
          next_actions?: string | null
          updated_at?: string | null
          what_didnt?: string | null
          what_worked?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "changelog_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company_id: string | null
          company_name: string
          contact_name: string | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          customer_type: Database["public"]["Enums"]["customer_type"] | null
          delivery_phase: string | null
          email: string | null
          ghl_contact_id: string | null
          id: string
          lead_id: string | null
          lifetime_value: number | null
          monthly_fee: number | null
          name: string | null
          niche: string | null
          notes: string | null
          offer: string | null
          phone: string | null
          status: string | null
          tenant_id: string | null
          total_sessions: number | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          company_name: string
          contact_name?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          delivery_phase?: string | null
          email?: string | null
          ghl_contact_id?: string | null
          id?: string
          lead_id?: string | null
          lifetime_value?: number | null
          monthly_fee?: number | null
          name?: string | null
          niche?: string | null
          notes?: string | null
          offer?: string | null
          phone?: string | null
          status?: string | null
          tenant_id?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string
          contact_name?: string | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"] | null
          delivery_phase?: string | null
          email?: string | null
          ghl_contact_id?: string | null
          id?: string
          lead_id?: string | null
          lifetime_value?: number | null
          monthly_fee?: number | null
          name?: string | null
          niche?: string | null
          notes?: string | null
          offer?: string | null
          phone?: string | null
          status?: string | null
          tenant_id?: string | null
          total_sessions?: number | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          kvk: string | null
          name: string
          tier: Database["public"]["Enums"]["tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kvk?: string | null
          name: string
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kvk?: string | null
          name?: string
          tier?: Database["public"]["Enums"]["tier"]
          updated_at?: string
        }
        Relationships: []
      }
      content_assets: {
        Row: {
          asset_type: string
          content_item_id: string
          created_at: string
          file_name: string | null
          id: string
          sort_order: number
          tenant_id: string
          url: string | null
        }
        Insert: {
          asset_type?: string
          content_item_id: string
          created_at?: string
          file_name?: string | null
          id?: string
          sort_order?: number
          tenant_id: string
          url?: string | null
        }
        Update: {
          asset_type?: string
          content_item_id?: string
          created_at?: string
          file_name?: string | null
          id?: string
          sort_order?: number
          tenant_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_assets_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_cadence: {
        Row: {
          company_id: string
          content_type: string
          created_at: string | null
          frequency_per_week: number
          id: string
          is_active: boolean | null
          notes: string | null
          subtypes: string[] | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string
          content_type: string
          created_at?: string | null
          frequency_per_week?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          subtypes?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content_type?: string
          created_at?: string | null
          frequency_per_week?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          subtypes?: string[] | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_cadence_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_cadence_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_distributions: {
        Row: {
          content_item_id: string
          created_at: string
          id: string
          notes: string | null
          platform: string
          post_url: string | null
          published_at: string | null
          scheduled_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          content_item_id: string
          created_at?: string
          id?: string
          notes?: string | null
          platform: string
          post_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          content_item_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          platform?: string
          post_url?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_distributions_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_distributions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_feedback: {
        Row: {
          company_id: string
          content_item_id: string
          created_at: string | null
          feedback_text: string | null
          id: string
          rating: string
          tenant_id: string | null
        }
        Insert: {
          company_id?: string
          content_item_id: string
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating: string
          tenant_id?: string | null
        }
        Update: {
          company_id?: string
          content_item_id?: string
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_feedback_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_feedback_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          ai_generated: boolean | null
          angle: string | null
          batch_id: string | null
          body: string | null
          clarity_score: number | null
          company_id: string | null
          content_template: string | null
          created_at: string | null
          cta: string | null
          cta_strength: number | null
          day_of_week: number | null
          funnel_stage: string | null
          hook: string | null
          hook_score: number | null
          id: string
          metrics: Json | null
          platform: string | null
          platforms: string[] | null
          primary_topic: string | null
          published_date: string | null
          scheduled_date: string | null
          script: string | null
          status: string | null
          tags: string[] | null
          tenant_id: string | null
          title: string
          type: string | null
          updated_at: string | null
          vakman_academy_ref: string | null
          visual_prompt: string | null
          visual_type: string | null
          week_number: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          angle?: string | null
          batch_id?: string | null
          body?: string | null
          clarity_score?: number | null
          company_id?: string | null
          content_template?: string | null
          created_at?: string | null
          cta?: string | null
          cta_strength?: number | null
          day_of_week?: number | null
          funnel_stage?: string | null
          hook?: string | null
          hook_score?: number | null
          id?: string
          metrics?: Json | null
          platform?: string | null
          platforms?: string[] | null
          primary_topic?: string | null
          published_date?: string | null
          scheduled_date?: string | null
          script?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          vakman_academy_ref?: string | null
          visual_prompt?: string | null
          visual_type?: string | null
          week_number?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          angle?: string | null
          batch_id?: string | null
          body?: string | null
          clarity_score?: number | null
          company_id?: string | null
          content_template?: string | null
          created_at?: string | null
          cta?: string | null
          cta_strength?: number | null
          day_of_week?: number | null
          funnel_stage?: string | null
          hook?: string | null
          hook_score?: number | null
          id?: string
          metrics?: Json | null
          platform?: string | null
          platforms?: string[] | null
          primary_topic?: string | null
          published_date?: string | null
          scheduled_date?: string | null
          script?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          vakman_academy_ref?: string | null
          visual_prompt?: string | null
          visual_type?: string | null
          week_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      content_strategies: {
        Row: {
          company_id: string
          created_at: string | null
          do_rules: string | null
          dont_rules: string | null
          funnel_mapping: string | null
          id: string
          name: string
          pillars: string[] | null
          platform: string | null
          posting_frequency: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string
          created_at?: string | null
          do_rules?: string | null
          dont_rules?: string | null
          funnel_mapping?: string | null
          id?: string
          name: string
          pillars?: string[] | null
          platform?: string | null
          posting_frequency?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          do_rules?: string | null
          dont_rules?: string | null
          funnel_mapping?: string | null
          id?: string
          name?: string
          pillars?: string[] | null
          platform?: string | null
          posting_frequency?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_strategies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_strategies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          client_id: string
          company_id: string
          created_at: string
          end_date: string | null
          frequency: Database["public"]["Enums"]["contract_frequency"]
          id: string
          monthly_price: number
          notes: string | null
          service_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          company_id?: string
          created_at?: string
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["contract_frequency"]
          id?: string
          monthly_price: number
          notes?: string | null
          service_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          company_id?: string
          created_at?: string
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["contract_frequency"]
          id?: string
          monthly_price?: number
          notes?: string | null
          service_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          auto_context: boolean | null
          company_id: string | null
          context_config: Json | null
          created_at: string | null
          id: string
          messages: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_context?: boolean | null
          company_id?: string | null
          context_config?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_context?: boolean | null
          company_id?: string | null
          context_config?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      costs: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["cost_category"] | null
          company_id: string
          created_at: string
          created_by: string | null
          date: string
          description: string
          id: string
          project_id: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["cost_category"] | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          date: string
          description: string
          id?: string
          project_id: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["cost_category"] | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "costs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_kpis: {
        Row: {
          company_id: string | null
          created_at: string | null
          date: string
          id: string
          metrics: Json | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          metrics?: Json | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          metrics?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_kpis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_logs: {
        Row: {
          created_at: string
          hours_worked: number | null
          id: string
          log_date: string
          logged_by: string | null
          notes: string | null
          project_id: string
        }
        Insert: {
          created_at?: string
          hours_worked?: number | null
          id?: string
          log_date: string
          logged_by?: string | null
          notes?: string | null
          project_id: string
        }
        Update: {
          created_at?: string
          hours_worked?: number | null
          id?: string
          log_date?: string
          logged_by?: string | null
          notes?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string | null
          id: string
          summary_short: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          summary_short?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          summary_short?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          email: string | null
          full_name: string
          hourly_cost_cents: number | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          name: string | null
          phone: string | null
          role: string | null
          role_id: string | null
          role_name: string | null
          start_date: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          full_name: string
          hourly_cost_cents?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          name?: string | null
          phone?: string | null
          role?: string | null
          role_id?: string | null
          role_name?: string | null
          start_date?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          hourly_cost_cents?: number | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          name?: string | null
          phone?: string | null
          role?: string | null
          role_id?: string | null
          role_name?: string | null
          start_date?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          company_id: string
          created_at: string
          id: string
          last_maintenance: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          last_maintenance?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          last_maintenance?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          company_id: string | null
          created_at: string | null
          hypothesis: string | null
          id: string
          results: Json | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          hypothesis?: string | null
          id?: string
          results?: Json | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          hypothesis?: string | null
          id?: string
          results?: Json | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      icps: {
        Row: {
          buy_triggers: string | null
          company_id: string | null
          created_at: string | null
          id: string
          name: string
          niche: string | null
          objections: string | null
          region: string | null
          revenue_range: string | null
          team_size: string | null
          updated_at: string | null
        }
        Insert: {
          buy_triggers?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          niche?: string | null
          objections?: string | null
          region?: string | null
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string | null
        }
        Update: {
          buy_triggers?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          niche?: string | null
          objections?: string | null
          region?: string | null
          revenue_range?: string | null
          team_size?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "icps_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string | null
          id: string
          source: string | null
          strategic_relevance_score: number | null
          title: string | null
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          strategic_relevance_score?: number | null
          title?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          source?: string | null
          strategic_relevance_score?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_tokens: {
        Row: {
          access_token: string | null
          company_id: string
          config: Json | null
          created_at: string | null
          email: string | null
          id: string
          refresh_token: string | null
          scopes: string[] | null
          service: string
          token_expiry: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          company_id?: string
          config?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          service: string
          token_expiry?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          company_id?: string
          config?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          service?: string
          token_expiry?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_tokens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id: string
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          total_cents: number
          unit: string | null
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_excl_vat: number
          client_id: string | null
          client_name: string | null
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          notes: string | null
          paid_at: string | null
          project_id: string | null
          quote_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string | null
          title: string | null
          vat_pct: number
        }
        Insert: {
          amount_excl_vat: number
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string | null
          title?: string | null
          vat_pct?: number
        }
        Update: {
          amount_excl_vat?: number
          client_id?: string | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_at?: string | null
          project_id?: string | null
          quote_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string | null
          title?: string | null
          vat_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          analysis: Json | null
          analysis_summary: string | null
          company_id: string | null
          created_at: string | null
          id: string
          source_type: string | null
          title: string | null
          updated_at: string | null
          url: string | null
        }
        Insert: {
          analysis?: Json | null
          analysis_summary?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          source_type?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          analysis?: Json | null
          analysis_summary?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          source_type?: string | null
          title?: string | null
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_definitions: {
        Row: {
          alert_threshold_pct: number | null
          category: Database["public"]["Enums"]["kpi_category"] | null
          company_id: string
          created_at: string
          id: string
          name: string
          target_value: number | null
          unit: string | null
        }
        Insert: {
          alert_threshold_pct?: number | null
          category?: Database["public"]["Enums"]["kpi_category"] | null
          company_id?: string
          created_at?: string
          id?: string
          name: string
          target_value?: number | null
          unit?: string | null
        }
        Update: {
          alert_threshold_pct?: number | null
          category?: Database["public"]["Enums"]["kpi_category"] | null
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          target_value?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_definitions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_snapshots: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          kpi_id: string
          project_id: string | null
          snapshot_date: string
          value: number
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id?: string
          kpi_id: string
          project_id?: string | null
          snapshot_date: string
          value: number
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          kpi_id?: string
          project_id?: string | null
          snapshot_date?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshots_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpi_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "kpi_snapshots_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_id: string
          payload: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          payload?: Json | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_messages: {
        Row: {
          channel: string
          content: string
          direction: string
          id: string
          lead_id: string
          metadata: Json | null
          sent_at: string
          tenant_id: string
        }
        Insert: {
          channel?: string
          content: string
          direction: string
          id?: string
          lead_id: string
          metadata?: Json | null
          sent_at?: string
          tenant_id: string
        }
        Update: {
          channel?: string
          content?: string
          direction?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          sent_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          ai_label: string | null
          ai_score: number | null
          ai_summary: string | null
          appointment_probability: number | null
          budget_estimate: string | null
          channel: string | null
          city: string | null
          client_id: string | null
          company_id: string
          contact_name: string | null
          content_item_id: string | null
          conversation_summary: string | null
          created_at: string
          created_by: string | null
          email: string | null
          estimated_value: number | null
          id: string
          intent: string | null
          intent_status: string | null
          last_activity: string | null
          lead_intelligence: Json | null
          lead_memory: Json | null
          linkedin_url: string | null
          name: string
          neighbor_action_possible: boolean | null
          next_best_reply: string | null
          niche: string | null
          notes: string | null
          parent_lead_id: string | null
          phone: string | null
          pipeline_stage: string | null
          reasoning: string | null
          service_id: string | null
          service_type: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tenant_id: string | null
          updated_at: string
          urgency: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          ai_label?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          appointment_probability?: number | null
          budget_estimate?: string | null
          channel?: string | null
          city?: string | null
          client_id?: string | null
          company_id?: string
          contact_name?: string | null
          content_item_id?: string | null
          conversation_summary?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          intent?: string | null
          intent_status?: string | null
          last_activity?: string | null
          lead_intelligence?: Json | null
          lead_memory?: Json | null
          linkedin_url?: string | null
          name: string
          neighbor_action_possible?: boolean | null
          next_best_reply?: string | null
          niche?: string | null
          notes?: string | null
          parent_lead_id?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          reasoning?: string | null
          service_id?: string | null
          service_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id?: string | null
          updated_at?: string
          urgency?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          ai_label?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          appointment_probability?: number | null
          budget_estimate?: string | null
          channel?: string | null
          city?: string | null
          client_id?: string | null
          company_id?: string
          contact_name?: string | null
          content_item_id?: string | null
          conversation_summary?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          id?: string
          intent?: string | null
          intent_status?: string | null
          last_activity?: string | null
          lead_intelligence?: Json | null
          lead_memory?: Json | null
          linkedin_url?: string | null
          name?: string
          neighbor_action_possible?: boolean | null
          next_best_reply?: string | null
          niche?: string | null
          notes?: string | null
          parent_lead_id?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          reasoning?: string | null
          service_id?: string | null
          service_type?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id?: string | null
          updated_at?: string
          urgency?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_content_item_id_fkey"
            columns: ["content_item_id"]
            isOneToOne: false
            referencedRelation: "content_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_parent_lead_id_fkey"
            columns: ["parent_lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      material_entries: {
        Row: {
          created_at: string
          description: string
          employee_id: string | null
          entry_date: string
          id: string
          notes: string | null
          project_id: string
          quantity: number
          tenant_id: string
          total_cents: number | null
          unit: string | null
          unit_price_cents: number | null
        }
        Insert: {
          created_at?: string
          description: string
          employee_id?: string | null
          entry_date: string
          id?: string
          notes?: string | null
          project_id: string
          quantity?: number
          tenant_id: string
          total_cents?: number | null
          unit?: string | null
          unit_price_cents?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          employee_id?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          project_id?: string
          quantity?: number
          tenant_id?: string
          total_cents?: number | null
          unit?: string | null
          unit_price_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "material_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          company_id: string
          created_at: string
          id: string
          min_stock: number | null
          name: string
          stock_quantity: number | null
          supplier: string | null
          unit: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          min_stock?: number | null
          name: string
          stock_quantity?: number | null
          supplier?: string | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          min_stock?: number | null
          name?: string
          stock_quantity?: number | null
          supplier?: string | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          employee_id: string
          id: string
          is_completed: boolean
          order_index: number
          role_id: string | null
          task: string
        }
        Insert: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          employee_id: string
          id?: string
          is_completed?: boolean
          order_index?: number
          role_id?: string | null
          task: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          is_completed?: boolean
          order_index?: number
          role_id?: string | null
          task?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          company_id: string
          created_at: string
          id: string
          lead_id: string | null
          margin_target_pct: number | null
          name: string
          proposal_sent_at: string | null
          status: Database["public"]["Enums"]["opportunity_status"]
          updated_at: string
          value: number | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          margin_target_pct?: number | null
          name: string
          proposal_sent_at?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          updated_at?: string
          value?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          margin_target_pct?: number | null
          name?: string
          proposal_sent_at?: string | null
          status?: Database["public"]["Enums"]["opportunity_status"]
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_entries: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          end_time: string | null
          id: string
          notes: string | null
          planned_date: string
          planned_hours: number | null
          project_id: string
          start_time: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          planned_date: string
          planned_hours?: number | null
          project_id: string
          start_time?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          planned_date?: string
          planned_hours?: number | null
          project_id?: string
          start_time?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "planning_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planning_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      positioning: {
        Row: {
          company_id: string
          core_problem: string | null
          core_promise: string | null
          created_at: string
          differentiation: string | null
          id: string
          ideal_customer: string | null
          proof: Json | null
          updated_at: string
        }
        Insert: {
          company_id?: string
          core_problem?: string | null
          core_promise?: string | null
          created_at?: string
          differentiation?: string | null
          id?: string
          ideal_customer?: string | null
          proof?: Json | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          core_problem?: string | null
          core_promise?: string | null
          created_at?: string
          differentiation?: string | null
          id?: string
          ideal_customer?: string | null
          proof?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positioning_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          project_id: string
          status: Database["public"]["Enums"]["phase_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          project_id: string
          status?: Database["public"]["Enums"]["phase_status"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          project_id?: string
          status?: Database["public"]["Enums"]["phase_status"]
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          address: string | null
          budget: number | null
          budget_cents: number | null
          city: string | null
          client_id: string | null
          company_id: string
          created_at: string
          description: string | null
          end_date: string | null
          hourly_rate_cents: number | null
          id: string
          lead_id: string | null
          margin_target_pct: number | null
          name: string
          notes: string | null
          opportunity_id: string | null
          project_type: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          budget?: number | null
          budget_cents?: number | null
          city?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          hourly_rate_cents?: number | null
          id?: string
          lead_id?: string | null
          margin_target_pct?: number | null
          name: string
          notes?: string | null
          opportunity_id?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          budget?: number | null
          budget_cents?: number | null
          city?: string | null
          client_id?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          hourly_rate_cents?: number | null
          id?: string
          lead_id?: string | null
          margin_target_pct?: number | null
          name?: string
          notes?: string | null
          opportunity_id?: string | null
          project_type?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          quote_id: string
          sort_order: number
          total_cents: number
          unit: string | null
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          quote_id: string
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          quote_id?: string
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          accepted_at: string | null
          amount_excl_vat: number
          amount_incl_vat: number
          client_id: string | null
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          project_id: string | null
          quote_number: string | null
          rejected_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          tenant_id: string | null
          title: string
          updated_at: string
          valid_until: string | null
          vat_pct: number
        }
        Insert: {
          accepted_at?: string | null
          amount_excl_vat?: number
          amount_incl_vat?: number
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_number?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tenant_id?: string | null
          title: string
          updated_at?: string
          valid_until?: string | null
          vat_pct?: number
        }
        Update: {
          accepted_at?: string | null
          amount_excl_vat?: number
          amount_incl_vat?: number
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string | null
          quote_number?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          tenant_id?: string | null
          title?: string
          updated_at?: string
          valid_until?: string | null
          vat_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          company_id: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_shared: boolean | null
          share_token: string | null
          storage_path: string
          title: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_shared?: boolean | null
          share_token?: string | null
          storage_path: string
          title?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_shared?: boolean | null
          share_token?: string | null
          storage_path?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          not_my_job: string[] | null
          responsibilities: string[] | null
        }
        Insert: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          not_my_job?: string[] | null
          responsibilities?: string[] | null
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          not_my_job?: string[] | null
          responsibilities?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          company_id: string | null
          created_at: string | null
          criteria: Json | null
          description: string | null
          id: string
          name: string
          segment_score: number | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          name: string
          segment_score?: number | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          criteria?: Json | null
          description?: string | null
          id?: string
          name?: string
          segment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "segments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          avg_duration_hours: number | null
          avg_revenue: number | null
          base_price: number | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          pricing_model: Database["public"]["Enums"]["pricing_model"]
          target_margin_pct: number | null
          updated_at: string
        }
        Insert: {
          avg_duration_hours?: number | null
          avg_revenue?: number | null
          base_price?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          target_margin_pct?: number | null
          updated_at?: string
        }
        Update: {
          avg_duration_hours?: number | null
          avg_revenue?: number | null
          base_price?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pricing_model?: Database["public"]["Enums"]["pricing_model"]
          target_margin_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      session_employees: {
        Row: {
          employee_id: string
          hours_worked: number | null
          id: string
          session_id: string
        }
        Insert: {
          employee_id: string
          hours_worked?: number | null
          id?: string
          session_id: string
        }
        Update: {
          employee_id?: string
          hours_worked?: number | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_employees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_materials: {
        Row: {
          cost: number
          id: string
          material_id: string
          quantity: number
          session_id: string
        }
        Insert: {
          cost?: number
          id?: string
          material_id: string
          quantity?: number
          session_id: string
        }
        Update: {
          cost?: number
          id?: string
          material_id?: string
          quantity?: number
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_upsells: {
        Row: {
          accepted: boolean
          actual_value: number | null
          id: string
          offered: boolean
          session_id: string
          upsell_id: string
        }
        Insert: {
          accepted?: boolean
          actual_value?: number | null
          id?: string
          offered?: boolean
          session_id: string
          upsell_id: string
        }
        Update: {
          accepted?: boolean
          actual_value?: number | null
          id?: string
          offered?: boolean
          session_id?: string
          upsell_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_upsells_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "work_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_upsells_upsell_id_fkey"
            columns: ["upsell_id"]
            isOneToOne: false
            referencedRelation: "upsells"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_entries: {
        Row: {
          body: string | null
          company_id: string | null
          created_at: string | null
          id: string
          relevance_score: number | null
          signal_type: string | null
          source: string | null
          title: string | null
        }
        Insert: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          relevance_score?: number | null
          signal_type?: string | null
          source?: string | null
          title?: string | null
        }
        Update: {
          body?: string | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          relevance_score?: number | null
          signal_type?: string | null
          source?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      sop_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          sop_id: string
          step_number: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          sop_id: string
          step_number: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          sop_id?: string
          step_number?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "sop_steps_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      sops: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          role_id: string | null
          task_type: string | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          role_id?: string | null
          task_type?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          role_id?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sops_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sops_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          company_id: string
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          phase_id: string | null
          project_id: string
          sop_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          phase_id?: string | null
          project_id: string
          sop_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          phase_id?: string | null
          project_id?: string
          sop_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "sops"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          properties: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          properties?: Json | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          created_at: string
          id: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          mollie_customer_id: string | null
          name: string
          slug: string | null
          subscription_status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mollie_customer_id?: string | null
          name: string
          slug?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mollie_customer_id?: string | null
          name?: string
          slug?: string | null
          subscription_status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          approved_by: string | null
          created_at: string
          description: string | null
          employee_id: string
          end_time: string | null
          entry_date: string
          hours: number
          id: string
          is_billable: boolean
          project_id: string
          start_time: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          description?: string | null
          employee_id: string
          end_time?: string | null
          entry_date: string
          hours: number
          id?: string
          is_billable?: boolean
          project_id: string
          start_time?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          description?: string | null
          employee_id?: string
          end_time?: string | null
          entry_date?: string
          hours?: number
          id?: string
          is_billable?: boolean
          project_id?: string
          start_time?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          company_id: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          language: string | null
          original_filename: string | null
          status: string | null
          storage_path: string | null
          title: string
          transcript: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          original_filename?: string | null
          status?: string | null
          storage_path?: string | null
          title: string
          transcript?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          original_filename?: string | null
          status?: string | null
          storage_path?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      upsells: {
        Row: {
          avg_value: number | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          service_id: string | null
          take_rate_pct: number | null
          updated_at: string
        }
        Insert: {
          avg_value?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          service_id?: string | null
          take_rate_pct?: number | null
          updated_at?: string
        }
        Update: {
          avg_value?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service_id?: string | null
          take_rate_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsells_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsells_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_owner: boolean
          role: string | null
          role_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_owner?: boolean
          role?: string | null
          role_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_owner?: boolean
          role?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_content_metrics: {
        Row: {
          company_id: string | null
          created_at: string | null
          id: string
          metrics: Json | null
          updated_at: string | null
          week_start_date: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          updated_at?: string | null
          week_start_date: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          updated_at?: string | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_content_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_hours: {
        Row: {
          created_at: string
          description: string | null
          employee_id: string | null
          employee_name: string | null
          hourly_rate_cents: number
          hours: number
          id: string
          sort_order: number
          total_cents: number
          work_order_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          hourly_rate_cents?: number
          hours: number
          id?: string
          sort_order?: number
          total_cents?: number
          work_order_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_id?: string | null
          employee_name?: string | null
          hourly_rate_cents?: number
          hours?: number
          id?: string
          sort_order?: number
          total_cents?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_hours_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_hours_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_materials: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          sort_order: number
          total_cents: number
          unit: string | null
          unit_price_cents: number
          work_order_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
          work_order_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          sort_order?: number
          total_cents?: number
          unit?: string | null
          unit_price_cents?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_materials_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          client_id: string | null
          company_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          notes: string | null
          project_id: string
          signed_at: string | null
          signed_by: string | null
          status: Database["public"]["Enums"]["work_order_status"]
          tenant_id: string | null
          title: string
          updated_at: string
          work_order_number: string | null
        }
        Insert: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id: string
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          tenant_id?: string | null
          title: string
          updated_at?: string
          work_order_number?: string | null
        }
        Update: {
          client_id?: string | null
          company_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          signed_at?: string | null
          signed_by?: string | null
          status?: Database["public"]["Enums"]["work_order_status"]
          tenant_id?: string | null
          title?: string
          updated_at?: string
          work_order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_margin"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      work_sessions: {
        Row: {
          client_id: string | null
          company_id: string
          created_at: string
          date: string
          duration_hours: number | null
          end_time: string | null
          id: string
          labor_cost: number | null
          lead_id: string | null
          material_cost: number | null
          notes: string | null
          profit: number | null
          revenue: number | null
          revenue_per_hour: number | null
          service_id: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["session_status"]
          transport_cost: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          date?: string
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          labor_cost?: number | null
          lead_id?: string | null
          material_cost?: number | null
          notes?: string | null
          profit?: number | null
          revenue?: number | null
          revenue_per_hour?: number | null
          service_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          transport_cost?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          company_id?: string
          created_at?: string
          date?: string
          duration_hours?: number | null
          end_time?: string | null
          id?: string
          labor_cost?: number | null
          lead_id?: string | null
          material_cost?: number | null
          notes?: string | null
          profit?: number | null
          revenue?: number | null
          revenue_per_hour?: number | null
          service_id?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          transport_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_sessions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      lead_conversion: {
        Row: {
          company_id: string | null
          conversion_pct: number | null
          lost_leads: number | null
          total_leads: number | null
          won_leads: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      project_margin: {
        Row: {
          budget: number | null
          company_id: string | null
          gross_margin: number | null
          margin_pct: number | null
          margin_target_pct: number | null
          name: string | null
          project_id: string | null
          total_costs: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_content_roi: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          content_platform: string
          content_title: string
          leads_generated: number
          revenue_attributed: number
        }[]
      }
      get_dashboard_stats: { Args: { p_company_id: string }; Returns: Json }
      get_employee_performance: {
        Args: { p_employee_id: string }
        Returns: {
          avg_session_duration: number
          employee_name: string
          revenue_per_hour: number
          total_hours: number
          total_revenue: number
          total_sessions: number
          upsells_accepted: number
          upsells_offered: number
        }[]
      }
      get_mrr_breakdown: {
        Args: { p_company_id: string }
        Returns: {
          client_name: string
          frequency: string
          monthly_price: number
          service_name: string
          start_date: string
        }[]
      }
      get_my_company_id: { Args: never; Returns: string }
      get_pipeline_summary: {
        Args: { p_company_id: string }
        Returns: {
          lead_count: number
          stage: string
          total_value: number
        }[]
      }
      get_revenue_by_service: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          avg_revenue_per_hour: number
          service_name: string
          session_count: number
          total_profit: number
          total_revenue: number
        }[]
      }
      get_revenue_per_hour: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          profit_per_hour: number
          revenue_per_hour: number
          session_count: number
          total_hours: number
          total_profit: number
          total_revenue: number
        }[]
      }
      get_upsell_rate: {
        Args: {
          p_company_id: string
          p_end_date?: string
          p_start_date?: string
        }
        Returns: {
          total_accepted: number
          total_offered: number
          upsell_rate: number
          upsell_revenue: number
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      is_agency_admin: { Args: never; Returns: boolean }
      user_company_id: { Args: never; Returns: string }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      alert_type:
        | "margin_low"
        | "hours_over"
        | "kpi_below"
        | "conversion_low"
        | "invoice_overdue"
        | "low_leads"
        | "upsell_rate_low"
        | "stock_low"
        | "equipment_maintenance"
        | "lead_stale"
        | "contract_opportunity"
        | "neighbor_action"
        | "review_request"
      change_order_status: "pending" | "approved" | "rejected"
      contract_frequency:
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      contract_status: "active" | "paused" | "cancelled"
      cost_category:
        | "materials"
        | "labor"
        | "subcontractor"
        | "equipment"
        | "other"
      customer_type: "one_time" | "recurring" | "contract"
      equipment_status: "operational" | "maintenance" | "broken"
      invoice_status: "draft" | "sent" | "paid" | "overdue"
      kpi_category: "growth" | "delivery" | "finance" | "people"
      lead_status:
        | "new"
        | "qualified"
        | "proposal"
        | "won"
        | "lost"
        | "contacted"
        | "quote_sent"
        | "scheduled"
        | "completed"
        | "upsell"
        | "contract"
        | "hot"
        | "warm"
        | "cold"
      opportunity_status: "open" | "won" | "lost"
      phase_status: "pending" | "in_progress" | "completed"
      pricing_model: "fixed" | "hourly" | "m2" | "custom"
      project_status:
        | "planning"
        | "active"
        | "on_hold"
        | "completed"
        | "cancelled"
        | "gepland"
        | "actief"
        | "pauze"
        | "opgeleverd"
        | "gefactureerd"
        | "gearchiveerd"
      quote_status:
        | "concept"
        | "verstuurd"
        | "akkoord"
        | "afgewezen"
        | "verlopen"
      service_status: "active" | "inactive"
      session_status: "planned" | "in_progress" | "completed" | "cancelled"
      task_status: "open" | "in_progress" | "done" | "blocked"
      tier: "free" | "pro" | "pro_plus"
      work_order_status: "concept" | "actief" | "afgerond" | "gefactureerd"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_severity: ["info", "warning", "critical"],
      alert_type: [
        "margin_low",
        "hours_over",
        "kpi_below",
        "conversion_low",
        "invoice_overdue",
        "low_leads",
        "upsell_rate_low",
        "stock_low",
        "equipment_maintenance",
        "lead_stale",
        "contract_opportunity",
        "neighbor_action",
        "review_request",
      ],
      change_order_status: ["pending", "approved", "rejected"],
      contract_frequency: [
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      contract_status: ["active", "paused", "cancelled"],
      cost_category: [
        "materials",
        "labor",
        "subcontractor",
        "equipment",
        "other",
      ],
      customer_type: ["one_time", "recurring", "contract"],
      equipment_status: ["operational", "maintenance", "broken"],
      invoice_status: ["draft", "sent", "paid", "overdue"],
      kpi_category: ["growth", "delivery", "finance", "people"],
      lead_status: [
        "new",
        "qualified",
        "proposal",
        "won",
        "lost",
        "contacted",
        "quote_sent",
        "scheduled",
        "completed",
        "upsell",
        "contract",
        "hot",
        "warm",
        "cold",
      ],
      opportunity_status: ["open", "won", "lost"],
      phase_status: ["pending", "in_progress", "completed"],
      pricing_model: ["fixed", "hourly", "m2", "custom"],
      project_status: [
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
        "gepland",
        "actief",
        "pauze",
        "opgeleverd",
        "gefactureerd",
        "gearchiveerd",
      ],
      quote_status: [
        "concept",
        "verstuurd",
        "akkoord",
        "afgewezen",
        "verlopen",
      ],
      service_status: ["active", "inactive"],
      session_status: ["planned", "in_progress", "completed", "cancelled"],
      task_status: ["open", "in_progress", "done", "blocked"],
      tier: ["free", "pro", "pro_plus"],
      work_order_status: ["concept", "actief", "afgerond", "gefactureerd"],
    },
  },
} as const
