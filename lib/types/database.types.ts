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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      automation_log: {
        Row: {
          action_type: string
          details: Json | null
          executed_at: string
          id: string
          result: string | null
          rule_id: string | null
          target_id: string
          target_type: string
          tenant_id: string
          trigger_type: string
        }
        Insert: {
          action_type: string
          details?: Json | null
          executed_at?: string
          id?: string
          result?: string | null
          rule_id?: string | null
          target_id: string
          target_type: string
          tenant_id: string
          trigger_type: string
        }
        Update: {
          action_type?: string
          details?: Json | null
          executed_at?: string
          id?: string
          result?: string | null
          rule_id?: string | null
          target_id?: string
          target_type?: string
          tenant_id?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_type: string
          config: Json
          created_at: string
          delay_hours: number | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          tier: string
          trigger_type: string
        }
        Insert: {
          action_type: string
          config?: Json
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          tier?: string
          trigger_type: string
        }
        Update: {
          action_type?: string
          config?: Json
          created_at?: string
          delay_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          tier?: string
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_name: string | null
          category: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_min: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          word_count: number | null
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          word_count?: number | null
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          word_count?: number | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          area: string | null
          campaign_type: string | null
          created_at: string
          id: string
          project_id: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          campaign_type?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          campaign_type?: string | null
          created_at?: string
          id?: string
          project_id?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_demo: boolean
          lead_id: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
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
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      content_ai_tools: {
        Row: {
          brand_id: string | null
          created_at: string
          default_prompts: Json
          description: string | null
          id: string
          kind: string
          name: string
          notes: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          default_prompts?: Json
          description?: string | null
          id?: string
          kind: string
          name: string
          notes?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          default_prompts?: Json
          description?: string | null
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_ai_tools_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "content_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      content_brands: {
        Row: {
          brand_color: string | null
          created_at: string
          description: string | null
          do_not_use: string | null
          do_use: string | null
          id: string
          links: Json
          name: string
          positioning: string | null
          slug: string
          tonality: string | null
          updated_at: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          description?: string | null
          do_not_use?: string | null
          do_use?: string | null
          id?: string
          links?: Json
          name: string
          positioning?: string | null
          slug: string
          tonality?: string | null
          updated_at?: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          description?: string | null
          do_not_use?: string | null
          do_use?: string | null
          id?: string
          links?: Json
          name?: string
          positioning?: string | null
          slug?: string
          tonality?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      content_channels: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          platform: string
          profile_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          platform: string
          profile_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          platform?: string
          profile_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_channels_tenant_id_fkey"
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
          profile_type: string | null
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
          profile_type?: string | null
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
          profile_type?: string | null
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
      content_items: {
        Row: {
          ai_generated: boolean
          angle: string | null
          batch_id: string | null
          body: string | null
          clarity_score: number | null
          company_id: string | null
          content_template: string | null
          created_at: string
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
          status: string
          tags: string[] | null
          tenant_id: string
          title: string
          type: string | null
          updated_at: string
          vakman_academy_ref: string | null
          visual_prompt: string | null
          visual_type: string | null
          week_number: string | null
        }
        Insert: {
          ai_generated?: boolean
          angle?: string | null
          batch_id?: string | null
          body?: string | null
          clarity_score?: number | null
          company_id?: string | null
          content_template?: string | null
          created_at?: string
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
          status?: string
          tags?: string[] | null
          tenant_id: string
          title: string
          type?: string | null
          updated_at?: string
          vakman_academy_ref?: string | null
          visual_prompt?: string | null
          visual_type?: string | null
          week_number?: string | null
        }
        Update: {
          ai_generated?: boolean
          angle?: string | null
          batch_id?: string | null
          body?: string | null
          clarity_score?: number | null
          company_id?: string | null
          content_template?: string | null
          created_at?: string
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
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          type?: string | null
          updated_at?: string
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
      content_notes: {
        Row: {
          body: string | null
          brand_id: string | null
          created_at: string
          id: string
          tags: string[]
          title: string
          tool_id: string | null
        }
        Insert: {
          body?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          tags?: string[]
          title: string
          tool_id?: string | null
        }
        Update: {
          body?: string | null
          brand_id?: string | null
          created_at?: string
          id?: string
          tags?: string[]
          title?: string
          tool_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_notes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "content_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_notes_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "content_ai_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      content_weekly_metrics: {
        Row: {
          created_at: string
          dms: number
          id: string
          interactions: number
          platform: string
          posts_published: number
          profile_type: string
          reach: number
          tenant_id: string
          updated_at: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          dms?: number
          id?: string
          interactions?: number
          platform: string
          posts_published?: number
          profile_type: string
          reach?: number
          tenant_id: string
          updated_at?: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          dms?: number
          id?: string
          interactions?: number
          platform?: string
          posts_published?: number
          profile_type?: string
          reach?: number
          tenant_id?: string
          updated_at?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_weekly_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_log: {
        Row: {
          details: Json | null
          finished_at: string | null
          id: string
          job_name: string
          started_at: string
          status: string
        }
        Insert: {
          details?: Json | null
          finished_at?: string | null
          id?: string
          job_name: string
          started_at?: string
          status?: string
        }
        Update: {
          details?: Json | null
          finished_at?: string | null
          id?: string
          job_name?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          color: string
          created_at: string
          email: string | null
          full_name: string | null
          hourly_cost_cents: number | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_cost_cents?: number | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          hourly_cost_cents?: number | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature: string
          id: string
          tenant_id: string
          tier_required: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature: string
          id?: string
          tenant_id: string
          tier_required?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature?: string
          id?: string
          tenant_id?: string
          tier_required?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          message: string
          page: string | null
          priority: string | null
          status: string
          tenant_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message: string
          page?: string | null
          priority?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          message?: string
          page?: string | null
          priority?: string | null
          status?: string
          tenant_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_agent_config: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          metadata: Json
          niche_override: string | null
          services_override: Json | null
          tenant_id: string
          tone_override: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          metadata?: Json
          niche_override?: string | null
          services_override?: Json | null
          tenant_id: string
          tone_override?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          niche_override?: string | null
          services_override?: Json | null
          tenant_id?: string
          tone_override?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fw_agent_config_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "fw_agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fw_agent_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_agent_runs: {
        Row: {
          agent_name: string
          agent_version: string
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          input: Json
          lead_id: string | null
          model: string | null
          output: Json | null
          status: string
          tenant_id: string
          tokens_input: number | null
          tokens_output: number | null
          tools_called: Json
        }
        Insert: {
          agent_name: string
          agent_version?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          lead_id?: string | null
          model?: string | null
          output?: Json | null
          status?: string
          tenant_id: string
          tokens_input?: number | null
          tokens_output?: number | null
          tools_called?: Json
        }
        Update: {
          agent_name?: string
          agent_version?: string
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          input?: Json
          lead_id?: string | null
          model?: string | null
          output?: Json | null
          status?: string
          tenant_id?: string
          tokens_input?: number | null
          tokens_output?: number | null
          tools_called?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fw_agent_runs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "fw_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fw_agent_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_agents_catalog: {
        Row: {
          category: string
          created_at: string
          description: string
          features: Json
          id: string
          name: string
          pricing_monthly: number
          slug: string
          status: string
          tier: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          features?: Json
          id?: string
          name: string
          pricing_monthly?: number
          slug: string
          status?: string
          tier: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          features?: Json
          id?: string
          name?: string
          pricing_monthly?: number
          slug?: string
          status?: string
          tier?: string
        }
        Relationships: []
      }
      fw_conversations: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          messages: Json
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          messages?: Json
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          messages?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fw_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "fw_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fw_conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          metadata: Json
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fw_knowledge_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_leads: {
        Row: {
          budget: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          metadata: Json
          name: string | null
          notes: string | null
          phone: string | null
          qualification: string | null
          raw_data: Json | null
          region: string | null
          service: string | null
          source: string | null
          status: string
          tenant_id: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualification?: string | null
          raw_data?: Json | null
          region?: string | null
          service?: string | null
          source?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          metadata?: Json
          name?: string | null
          notes?: string | null
          phone?: string | null
          qualification?: string | null
          raw_data?: Json | null
          region?: string | null
          service?: string | null
          source?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fw_leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_quotes: {
        Row: {
          created_at: string
          id: string
          pdf_url: string | null
          prospect_id: string | null
          quote_data: Json
          status: string
          tenant_id: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pdf_url?: string | null
          prospect_id?: string | null
          quote_data: Json
          status?: string
          tenant_id: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pdf_url?: string | null
          prospect_id?: string | null
          quote_data?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fw_quotes_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "fw_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fw_quotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_tenant_agents: {
        Row: {
          activated_at: string | null
          active: boolean
          agent_id: string
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          active?: boolean
          agent_id: string
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          active?: boolean
          agent_id?: string
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fw_tenant_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "fw_agents_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fw_tenant_agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_tenant_users: {
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
            foreignKeyName: "fw_tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "fw_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fw_tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          niche: string | null
          region: string | null
          settings: Json
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          niche?: string | null
          region?: string | null
          settings?: Json
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          niche?: string | null
          region?: string | null
          settings?: Json
          slug?: string
        }
        Relationships: []
      }
      gt_blog_posts: {
        Row: {
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          description: string
          id: string
          is_published: boolean
          keywords: string[] | null
          published_at: string
          reading_time_minutes: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          description: string
          id?: string
          is_published?: boolean
          keywords?: string[] | null
          published_at: string
          reading_time_minutes?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          is_published?: boolean
          keywords?: string[] | null
          published_at?: string
          reading_time_minutes?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gt_lead_magnets: {
        Row: {
          created_at: string
          description: string
          downloads_count: number
          file_size_bytes: number | null
          file_url: string
          form_required: boolean
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          downloads_count?: number
          file_size_bytes?: number | null
          file_url: string
          form_required?: boolean
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          downloads_count?: number
          file_size_bytes?: number | null
          file_url?: string
          form_required?: boolean
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gt_portfolio: {
        Row: {
          after_image_url: string | null
          before_image_url: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_published: boolean
          location: string
          service_type: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          location: string
          service_type: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          after_image_url?: string | null
          before_image_url?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          location?: string
          service_type?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_tooltips: {
        Row: {
          created_at: string
          element: string
          id: string
          page: string
          text: string
        }
        Insert: {
          created_at?: string
          element: string
          id?: string
          page: string
          text: string
        }
        Update: {
          created_at?: string
          element?: string
          id?: string
          page?: string
          text?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_active: boolean
          tenant_id: string
          type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id: string
          type: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          type?: string
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
          quantity: number | null
          sort_order: number | null
          total_cents: number | null
          unit: string | null
          unit_price_cents: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          sort_order?: number | null
          total_cents?: number | null
          unit?: string | null
          unit_price_cents?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          sort_order?: number | null
          total_cents?: number | null
          unit?: string | null
          unit_price_cents?: number | null
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
          amount_excl_vat: number | null
          amount_incl_vat: number | null
          client_id: string | null
          client_name: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoice_type: string | null
          issue_date: string | null
          notes: string | null
          paid_at: string | null
          paid_date: string | null
          pdf_url: string | null
          project_id: string | null
          quote_id: string | null
          related_quote_id: string | null
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
          vat_pct: number | null
        }
        Insert: {
          amount_excl_vat?: number | null
          amount_incl_vat?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_date?: string | null
          pdf_url?: string | null
          project_id?: string | null
          quote_id?: string | null
          related_quote_id?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
          vat_pct?: number | null
        }
        Update: {
          amount_excl_vat?: number | null
          amount_incl_vat?: number | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_type?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_at?: string | null
          paid_date?: string | null
          pdf_url?: string | null
          project_id?: string | null
          quote_id?: string | null
          related_quote_id?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
          vat_pct?: number | null
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
            foreignKeyName: "invoices_related_quote_id_fkey"
            columns: ["related_quote_id"]
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
      jobs: {
        Row: {
          after_photos: string[] | null
          before_photos: string[] | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          invoice_amount: number | null
          invoice_number: string | null
          invoice_sent_at: string | null
          job_type: string
          lead_id: string
          partner_id: string
          payment_received_at: string | null
          scheduled_date: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          after_photos?: string[] | null
          before_photos?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_number?: string | null
          invoice_sent_at?: string | null
          job_type: string
          lead_id: string
          partner_id: string
          payment_received_at?: string | null
          scheduled_date?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          after_photos?: string[] | null
          before_photos?: string[] | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_amount?: number | null
          invoice_number?: string | null
          invoice_sent_at?: string | null
          job_type?: string
          lead_id?: string
          partner_id?: string
          payment_received_at?: string | null
          scheduled_date?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "gt_partner_roster_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          category: string
          content: string
          created_at: string
          icon: string | null
          id: string
          slug: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          icon?: string | null
          id?: string
          slug: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          icon?: string | null
          id?: string
          slug?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_assignments: {
        Row: {
          budget_indication_eur: number | null
          commission_amount_eur: number | null
          commission_pct: number | null
          completed_at: string | null
          decided_at: string | null
          feedback_notes: string | null
          feedback_quality: number | null
          id: string
          lead_id: string | null
          lead_type: string | null
          proposed_at: string
          regio: string | null
          source_tenant_id: string
          status: string
          target_tenant_id: string | null
          urgency: string | null
        }
        Insert: {
          budget_indication_eur?: number | null
          commission_amount_eur?: number | null
          commission_pct?: number | null
          completed_at?: string | null
          decided_at?: string | null
          feedback_notes?: string | null
          feedback_quality?: number | null
          id?: string
          lead_id?: string | null
          lead_type?: string | null
          proposed_at?: string
          regio?: string | null
          source_tenant_id: string
          status?: string
          target_tenant_id?: string | null
          urgency?: string | null
        }
        Update: {
          budget_indication_eur?: number | null
          commission_amount_eur?: number | null
          commission_pct?: number | null
          completed_at?: string | null
          decided_at?: string | null
          feedback_notes?: string | null
          feedback_quality?: number | null
          id?: string
          lead_id?: string | null
          lead_type?: string | null
          proposed_at?: string
          regio?: string | null
          source_tenant_id?: string
          status?: string
          target_tenant_id?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_source_tenant_id_fkey"
            columns: ["source_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_target_tenant_id_fkey"
            columns: ["target_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          payload: Json
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_id: string
          payload?: Json
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_id?: string
          payload?: Json
          tenant_id?: string
          user_id?: string | null
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
          metadata: Json
          sent_at: string
          tenant_id: string
        }
        Insert: {
          channel: string
          content: string
          direction: string
          id?: string
          lead_id: string
          metadata?: Json
          sent_at?: string
          tenant_id: string
        }
        Update: {
          channel?: string
          content?: string
          direction?: string
          id?: string
          lead_id?: string
          metadata?: Json
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
      lead_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          lead_id: string
          sort_order: number
          storage_path: string
          tenant_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          lead_id: string
          sort_order?: number
          storage_path: string
          tenant_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          sort_order?: number
          storage_path?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_photos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_photos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_label: string | null
          ai_score: number | null
          ai_summary: string | null
          appointment_at: string | null
          assessment_at: string | null
          assigned_to: string | null
          budget_amount_cents: number | null
          budget_estimate: string | null
          city: string | null
          client_id: string | null
          created_at: string
          description: string | null
          email: string | null
          expected_value_cents: number | null
          followed_up_at: string | null
          house_number: string | null
          id: string
          intent: string | null
          is_demo: boolean
          lead_contact_method: string | null
          lead_source_specific: string | null
          name: string
          next_action: string | null
          next_action_at: string | null
          notes: string | null
          outcome: string | null
          phone: string | null
          pipeline_stage: string | null
          pricing_route: string | null
          profile_type: string | null
          project_value_estimate: number | null
          qualified_at: string | null
          quote_sent_at: string | null
          referral_client_id: string | null
          service: string | null
          source: string
          stage: string
          status: string
          street: string | null
          tenant_id: string
          updated_at: string
          urgency: string | null
        }
        Insert: {
          ai_label?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          appointment_at?: string | null
          assessment_at?: string | null
          assigned_to?: string | null
          budget_amount_cents?: number | null
          budget_estimate?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          expected_value_cents?: number | null
          followed_up_at?: string | null
          house_number?: string | null
          id?: string
          intent?: string | null
          is_demo?: boolean
          lead_contact_method?: string | null
          lead_source_specific?: string | null
          name: string
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          outcome?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          pricing_route?: string | null
          profile_type?: string | null
          project_value_estimate?: number | null
          qualified_at?: string | null
          quote_sent_at?: string | null
          referral_client_id?: string | null
          service?: string | null
          source: string
          stage?: string
          status?: string
          street?: string | null
          tenant_id: string
          updated_at?: string
          urgency?: string | null
        }
        Update: {
          ai_label?: string | null
          ai_score?: number | null
          ai_summary?: string | null
          appointment_at?: string | null
          assessment_at?: string | null
          assigned_to?: string | null
          budget_amount_cents?: number | null
          budget_estimate?: string | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          expected_value_cents?: number | null
          followed_up_at?: string | null
          house_number?: string | null
          id?: string
          intent?: string | null
          is_demo?: boolean
          lead_contact_method?: string | null
          lead_source_specific?: string | null
          name?: string
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          outcome?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          pricing_route?: string | null
          profile_type?: string | null
          project_value_estimate?: number | null
          qualified_at?: string | null
          quote_sent_at?: string | null
          referral_client_id?: string | null
          service?: string | null
          source?: string
          stage?: string
          status?: string
          street?: string | null
          tenant_id?: string
          updated_at?: string
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "gt_partner_roster_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_referral_client_id_fkey"
            columns: ["referral_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      maintenance_contracts: {
        Row: {
          client_id: string
          contract_end: string | null
          contract_start: string | null
          created_at: string
          description: string | null
          frequency: string | null
          id: string
          last_visit: string | null
          mrr_cents: number | null
          next_date: string | null
          next_visit: string | null
          notes: string | null
          price_cents: number | null
          price_per_visit_cents: number | null
          project_id: string | null
          status: string | null
          tenant_id: string
          title: string | null
          updated_at: string | null
          visit_count: number | null
        }
        Insert: {
          client_id: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          last_visit?: string | null
          mrr_cents?: number | null
          next_date?: string | null
          next_visit?: string | null
          notes?: string | null
          price_cents?: number | null
          price_per_visit_cents?: number | null
          project_id?: string | null
          status?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Update: {
          client_id?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          description?: string | null
          frequency?: string | null
          id?: string
          last_visit?: string | null
          mrr_cents?: number | null
          next_date?: string | null
          next_visit?: string | null
          notes?: string | null
          price_cents?: number | null
          price_per_visit_cents?: number | null
          project_id?: string | null
          status?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
          visit_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_requests: {
        Row: {
          aantal_medewerkers: number | null
          assigned_to: string | null
          bedrijfsnaam: string
          budget_bereidheid: string | null
          capaciteit_extra_werk: string | null
          created_at: string
          gemiddelde_projectwaarde_eur: number | null
          gewenste_groei: string | null
          grootste_probleem: string | null
          huidige_leadbronnen: string[]
          id: string
          internal_notes: string | null
          omzet_maand_eur: number | null
          preferred_package: string
          regio: string | null
          requester_user_id: string
          socials: Json | null
          status: string
          tenant_id: string
          updated_at: string
          vakgebied: string | null
          website: string | null
        }
        Insert: {
          aantal_medewerkers?: number | null
          assigned_to?: string | null
          bedrijfsnaam: string
          budget_bereidheid?: string | null
          capaciteit_extra_werk?: string | null
          created_at?: string
          gemiddelde_projectwaarde_eur?: number | null
          gewenste_groei?: string | null
          grootste_probleem?: string | null
          huidige_leadbronnen?: string[]
          id?: string
          internal_notes?: string | null
          omzet_maand_eur?: number | null
          preferred_package?: string
          regio?: string | null
          requester_user_id: string
          socials?: Json | null
          status?: string
          tenant_id: string
          updated_at?: string
          vakgebied?: string | null
          website?: string | null
        }
        Update: {
          aantal_medewerkers?: number | null
          assigned_to?: string | null
          bedrijfsnaam?: string
          budget_bereidheid?: string | null
          capaciteit_extra_werk?: string | null
          created_at?: string
          gemiddelde_projectwaarde_eur?: number | null
          gewenste_groei?: string | null
          grootste_probleem?: string | null
          huidige_leadbronnen?: string[]
          id?: string
          internal_notes?: string | null
          omzet_maand_eur?: number | null
          preferred_package?: string
          regio?: string | null
          requester_user_id?: string
          socials?: Json | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vakgebied?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managed_requests_tenant_id_fkey"
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          is_read: boolean
          link: string | null
          message: string | null
          tenant_id: string
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          is_read?: boolean
          link?: string | null
          message?: string | null
          tenant_id: string
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          is_read?: boolean
          link?: string | null
          message?: string | null
          tenant_id?: string
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          id: string
          lead_id: string
          notes: string | null
          paid_at: string | null
          partner_id: string
          payment_method: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          payment_method?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          payment_method?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "gt_partner_roster_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          capacity_status: string
          created_at: string
          id: string
          max_project_value_eur: number | null
          min_project_value_eur: number | null
          notes: string | null
          quality_score: number
          regions: string[]
          services: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          capacity_status?: string
          created_at?: string
          id?: string
          max_project_value_eur?: number | null
          min_project_value_eur?: number | null
          notes?: string | null
          quality_score?: number
          regions?: string[]
          services?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          capacity_status?: string
          created_at?: string
          id?: string
          max_project_value_eur?: number | null
          min_project_value_eur?: number | null
          notes?: string | null
          quality_score?: number
          regions?: string[]
          services?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          bio: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string
          specialties: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone: string
          specialties?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string
          specialties?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          created_at: string
          id: string
          key: string
          kind: string
          label: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          kind: string
          label: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          kind?: string
          label?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      playbook_categories: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      playbook_usage: {
        Row: {
          completed_at: string | null
          feedback: string | null
          id: string
          playbook_id: string
          started_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          feedback?: string | null
          id?: string
          playbook_id: string
          started_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          feedback?: string | null
          id?: string
          playbook_id?: string
          started_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_usage_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      playbooks: {
        Row: {
          audience: string
          category_slug: string
          checklist: Json
          created_at: string
          id: string
          min_tier: string
          output_example: string | null
          prompts: Json
          purpose: string | null
          slug: string
          source_path: string | null
          status: string
          steps: Json
          subcategory: string | null
          tenant_id: string | null
          title: string
          tools_required: string[]
          updated_at: string
          when_to_use: string | null
        }
        Insert: {
          audience?: string
          category_slug: string
          checklist?: Json
          created_at?: string
          id?: string
          min_tier?: string
          output_example?: string | null
          prompts?: Json
          purpose?: string | null
          slug: string
          source_path?: string | null
          status?: string
          steps?: Json
          subcategory?: string | null
          tenant_id?: string | null
          title: string
          tools_required?: string[]
          updated_at?: string
          when_to_use?: string | null
        }
        Update: {
          audience?: string
          category_slug?: string
          checklist?: Json
          created_at?: string
          id?: string
          min_tier?: string
          output_example?: string | null
          prompts?: Json
          purpose?: string | null
          slug?: string
          source_path?: string | null
          status?: string
          steps?: Json
          subcategory?: string | null
          tenant_id?: string | null
          title?: string
          tools_required?: string[]
          updated_at?: string
          when_to_use?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbooks_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "playbook_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "playbooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_subcontractors: {
        Row: {
          actual_cost_cents: number | null
          agreed_cost_cents: number | null
          completed_at: string | null
          created_at: string
          handles_sales: boolean | null
          id: string
          issue_count: number
          notes: string | null
          on_time: boolean | null
          paid_cents: number
          planned_end_date: string | null
          project_id: string
          status: string
          subcontractor_id: string
          tenant_id: string
          updated_at: string
          work_order_id: string | null
          work_package: string | null
        }
        Insert: {
          actual_cost_cents?: number | null
          agreed_cost_cents?: number | null
          completed_at?: string | null
          created_at?: string
          handles_sales?: boolean | null
          id?: string
          issue_count?: number
          notes?: string | null
          on_time?: boolean | null
          paid_cents?: number
          planned_end_date?: string | null
          project_id: string
          status?: string
          subcontractor_id: string
          tenant_id: string
          updated_at?: string
          work_order_id?: string | null
          work_package?: string | null
        }
        Update: {
          actual_cost_cents?: number | null
          agreed_cost_cents?: number | null
          completed_at?: string | null
          created_at?: string
          handles_sales?: boolean | null
          id?: string
          issue_count?: number
          notes?: string | null
          on_time?: boolean | null
          paid_cents?: number
          planned_end_date?: string | null
          project_id?: string
          status?: string
          subcontractor_id?: string
          tenant_id?: string
          updated_at?: string
          work_order_id?: string | null
          work_package?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subcontractors_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subcontractors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subcontractors_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          created_at: string
          done: boolean
          id: string
          project_id: string
          sort_order: number
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          id?: string
          project_id: string
          sort_order?: number
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string
          done?: boolean
          id?: string
          project_id?: string
          sort_order?: number
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_hours: number | null
          actual_margin_pct: number | null
          actual_material_cost_cents: number | null
          actual_other_cost_cents: number | null
          actual_partner_cost_cents: number | null
          actual_profit_cents: number | null
          actual_revenue_cents: number | null
          address: string | null
          assigned_employee_id: string | null
          budget_cents: number | null
          city: string | null
          client_id: string | null
          created_at: string
          delivered_at: string | null
          description: string | null
          end_date: string | null
          estimated_cost_cents: number | null
          estimated_profit_cents: number | null
          hourly_rate_cents: number | null
          id: string
          is_demo: boolean
          lead_id: string | null
          name: string
          notes: string | null
          project_type: string | null
          referral_status: string | null
          review_received: boolean | null
          review_requested_at: string | null
          review_status: string | null
          review_url: string | null
          source: string | null
          start_date: string | null
          status: string
          tenant_id: string
          updated_at: string
          upsell_opportunity: string | null
          upsell_status: string | null
        }
        Insert: {
          actual_hours?: number | null
          actual_margin_pct?: number | null
          actual_material_cost_cents?: number | null
          actual_other_cost_cents?: number | null
          actual_partner_cost_cents?: number | null
          actual_profit_cents?: number | null
          actual_revenue_cents?: number | null
          address?: string | null
          assigned_employee_id?: string | null
          budget_cents?: number | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          description?: string | null
          end_date?: string | null
          estimated_cost_cents?: number | null
          estimated_profit_cents?: number | null
          hourly_rate_cents?: number | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          name: string
          notes?: string | null
          project_type?: string | null
          referral_status?: string | null
          review_received?: boolean | null
          review_requested_at?: string | null
          review_status?: string | null
          review_url?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          upsell_opportunity?: string | null
          upsell_status?: string | null
        }
        Update: {
          actual_hours?: number | null
          actual_margin_pct?: number | null
          actual_material_cost_cents?: number | null
          actual_other_cost_cents?: number | null
          actual_partner_cost_cents?: number | null
          actual_profit_cents?: number | null
          actual_revenue_cents?: number | null
          address?: string | null
          assigned_employee_id?: string | null
          budget_cents?: number | null
          city?: string | null
          client_id?: string | null
          created_at?: string
          delivered_at?: string | null
          description?: string | null
          end_date?: string | null
          estimated_cost_cents?: number | null
          estimated_profit_cents?: number | null
          hourly_rate_cents?: number | null
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          name?: string
          notes?: string | null
          project_type?: string | null
          referral_status?: string | null
          review_received?: boolean | null
          review_requested_at?: string | null
          review_status?: string | null
          review_url?: string | null
          source?: string | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          upsell_opportunity?: string | null
          upsell_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      quote_events: {
        Row: {
          actor_name: string | null
          created_at: string
          event_type: string
          id: string
          ip: string | null
          metadata: Json
          quote_id: string
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          actor_name?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip?: string | null
          metadata?: Json
          quote_id: string
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          actor_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip?: string | null
          metadata?: Json
          quote_id?: string
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_events_tenant_id_fkey"
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
          quantity: number | null
          quote_id: string
          sort_order: number | null
          total_cents: number | null
          unit: string | null
          unit_price_cents: number | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number | null
          quote_id: string
          sort_order?: number | null
          total_cents?: number | null
          unit?: string | null
          unit_price_cents?: number | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number | null
          quote_id?: string
          sort_order?: number | null
          total_cents?: number | null
          unit?: string | null
          unit_price_cents?: number | null
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
          advance_pct: number | null
          amount_excl_vat: number | null
          amount_incl_vat: number | null
          client_id: string | null
          created_at: string
          description: string | null
          estimated_gross_profit_cents: number
          estimated_hours: number
          estimated_margin_pct: number | null
          estimated_material_cost_cents: number
          estimated_other_cost_cents: number
          estimated_partner_cost_cents: number
          final_pct: number | null
          follow_up_at: string | null
          id: string
          lead_id: string | null
          milestone_pct: number | null
          notes: string | null
          parent_quote_id: string | null
          payment_note: string | null
          pdf_url: string | null
          project_id: string | null
          quote_number: string | null
          rejected_at: string | null
          sent_at: string | null
          sign_token: string
          signature_ip: string | null
          signature_name: string | null
          signed_at: string | null
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
          valid_until: string | null
          vat_pct: number | null
        }
        Insert: {
          accepted_at?: string | null
          advance_pct?: number | null
          amount_excl_vat?: number | null
          amount_incl_vat?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          estimated_gross_profit_cents?: number
          estimated_hours?: number
          estimated_margin_pct?: number | null
          estimated_material_cost_cents?: number
          estimated_other_cost_cents?: number
          estimated_partner_cost_cents?: number
          final_pct?: number | null
          follow_up_at?: string | null
          id?: string
          lead_id?: string | null
          milestone_pct?: number | null
          notes?: string | null
          parent_quote_id?: string | null
          payment_note?: string | null
          pdf_url?: string | null
          project_id?: string | null
          quote_number?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          sign_token?: string
          signature_ip?: string | null
          signature_name?: string | null
          signed_at?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
          valid_until?: string | null
          vat_pct?: number | null
        }
        Update: {
          accepted_at?: string | null
          advance_pct?: number | null
          amount_excl_vat?: number | null
          amount_incl_vat?: number | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          estimated_gross_profit_cents?: number
          estimated_hours?: number
          estimated_margin_pct?: number | null
          estimated_material_cost_cents?: number
          estimated_other_cost_cents?: number
          estimated_partner_cost_cents?: number
          final_pct?: number | null
          follow_up_at?: string | null
          id?: string
          lead_id?: string | null
          milestone_pct?: number | null
          notes?: string | null
          parent_quote_id?: string | null
          payment_note?: string | null
          pdf_url?: string | null
          project_id?: string | null
          quote_number?: string | null
          rejected_at?: string | null
          sent_at?: string | null
          sign_token?: string
          signature_ip?: string | null
          signature_name?: string | null
          signed_at?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
          valid_until?: string | null
          vat_pct?: number | null
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
            foreignKeyName: "quotes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
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
      recurring_contracts: {
        Row: {
          annual_ltv: number | null
          contract_type: string
          created_at: string | null
          cycle_count: number | null
          id: string
          is_active: boolean | null
          lead_id: string
          monthly_value: number | null
          next_scheduled_date: string | null
          partner_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          annual_ltv?: number | null
          contract_type: string
          created_at?: string | null
          cycle_count?: number | null
          id?: string
          is_active?: boolean | null
          lead_id: string
          monthly_value?: number | null
          next_scheduled_date?: string | null
          partner_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          annual_ltv?: number | null
          contract_type?: string
          created_at?: string | null
          cycle_count?: number | null
          id?: string
          is_active?: boolean | null
          lead_id?: string
          monthly_value?: number | null
          next_scheduled_date?: string | null
          partner_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_contracts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "gt_partner_roster_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_contracts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_snapshots: {
        Row: {
          avg_deal_value_cents: number | null
          conversion_pct: number | null
          created_at: string
          hot_lead_count: number | null
          id: string
          is_demo: boolean
          lead_count: number | null
          mrr_cents: number | null
          outstanding_cents: number | null
          overdue_cents: number | null
          pipeline_cents: number | null
          revenue_cents: number | null
          snapshot_date: string
          tenant_id: string
        }
        Insert: {
          avg_deal_value_cents?: number | null
          conversion_pct?: number | null
          created_at?: string
          hot_lead_count?: number | null
          id?: string
          is_demo?: boolean
          lead_count?: number | null
          mrr_cents?: number | null
          outstanding_cents?: number | null
          overdue_cents?: number | null
          pipeline_cents?: number | null
          revenue_cents?: number | null
          snapshot_date: string
          tenant_id: string
        }
        Update: {
          avg_deal_value_cents?: number | null
          conversion_pct?: number | null
          created_at?: string
          hot_lead_count?: number | null
          id?: string
          is_demo?: boolean
          lead_count?: number | null
          mrr_cents?: number | null
          outstanding_cents?: number | null
          overdue_cents?: number | null
          pipeline_cents?: number | null
          revenue_cents?: number | null
          snapshot_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_sops: {
        Row: {
          description: string | null
          id: string
          shared_at: string
          source: string
          source_sop_id: string
          steps: Json
          task_type: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          id?: string
          shared_at?: string
          source?: string
          source_sop_id: string
          steps?: Json
          task_type?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          id?: string
          shared_at?: string
          source?: string
          source_sop_id?: string
          steps?: Json
          task_type?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_sops_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sops: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          source: string
          status: string
          steps: Json
          tenant_id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          status?: string
          steps?: Json
          tenant_id: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          source?: string
          status?: string
          steps?: Json
          tenant_id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sops_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      street_clusters: {
        Row: {
          city: string | null
          created_at: string | null
          houses_with_jobs: number | null
          id: string
          last_activity_at: string | null
          postal_code: string | null
          recurring_customers: number | null
          street: string
          tenant_id: string
          total_houses: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          houses_with_jobs?: number | null
          id?: string
          last_activity_at?: string | null
          postal_code?: string | null
          recurring_customers?: number | null
          street: string
          tenant_id: string
          total_houses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          houses_with_jobs?: number | null
          id?: string
          last_activity_at?: string | null
          postal_code?: string | null
          recurring_customers?: number | null
          street?: string
          tenant_id?: string
          total_houses?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "street_clusters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          contact_name: string | null
          created_at: string
          default_rate_cents: number | null
          email: string | null
          handles_own_sales: boolean
          id: string
          kvk_number: string | null
          name: string
          notes: string | null
          phone: string | null
          pricing_model: string | null
          rating: number | null
          region: string | null
          specialization: string | null
          status: string
          tenant_id: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          default_rate_cents?: number | null
          email?: string | null
          handles_own_sales?: boolean
          id?: string
          kvk_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          pricing_model?: string | null
          rating?: number | null
          region?: string | null
          specialization?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          default_rate_cents?: number | null
          email?: string | null
          handles_own_sales?: boolean
          id?: string
          kvk_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          pricing_model?: string | null
          rating?: number | null
          region?: string | null
          specialization?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          properties: Json
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          properties?: Json
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          properties?: Json
          tenant_id?: string
          user_id?: string | null
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
      templates: {
        Row: {
          category: string | null
          content: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          status: string
          tenant_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          status?: string
          tenant_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          status?: string
          tenant_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          meta: Json
          tenant_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          tenant_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_playbook_grants: {
        Row: {
          granted_at: string
          granted_by_user_id: string | null
          id: string
          playbook_id: string
          tenant_id: string
        }
        Insert: {
          granted_at?: string
          granted_by_user_id?: string | null
          id?: string
          playbook_id: string
          tenant_id: string
        }
        Update: {
          granted_at?: string
          granted_by_user_id?: string | null
          id?: string
          playbook_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_playbook_grants_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "playbooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_playbook_grants_tenant_id_fkey"
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
          demo_mode_active: boolean
          id: string
          is_active: boolean | null
          is_superadmin: boolean | null
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          demo_mode_active?: boolean
          id?: string
          is_active?: boolean | null
          is_superadmin?: boolean | null
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          demo_mode_active?: boolean
          id?: string
          is_active?: boolean | null
          is_superadmin?: boolean | null
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
          account_manager_user_id: string | null
          avg_project_value: string | null
          created_at: string
          default_payment_days: number | null
          description: string | null
          email: string | null
          google_review_count: number | null
          google_review_score: number | null
          iban: string | null
          id: string
          ideal_customer: string | null
          internal_notes: string | null
          is_managed: boolean
          is_platform_case: boolean
          kvk_number: string | null
          logo_url: string | null
          maintenance_frequencies: string[] | null
          managed_package: string | null
          min_project_value: string | null
          mollie_customer_id: string | null
          name: string
          niche: string | null
          onboarding_completed: boolean
          onboarding_dismissed: boolean | null
          onboarding_step: number | null
          owner_name: string | null
          owner_phone: string | null
          plan: string | null
          plan_expires_at: string | null
          plan_started_at: string | null
          premium_guarantees: string[] | null
          premium_tagline: string | null
          premium_usp: string[] | null
          primary_color: string | null
          project_types: string[] | null
          region: string | null
          seasonal_notes: string | null
          services: string[] | null
          slug: string
          social_facebook: string | null
          social_google_business: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_tiktok: string | null
          subscription_status: string
          team_size: number | null
          tone_of_voice: string | null
          trial_ends_at: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
          work_days: string[] | null
          work_hours_end: string | null
          work_hours_start: string | null
        }
        Insert: {
          account_manager_user_id?: string | null
          avg_project_value?: string | null
          created_at?: string
          default_payment_days?: number | null
          description?: string | null
          email?: string | null
          google_review_count?: number | null
          google_review_score?: number | null
          iban?: string | null
          id?: string
          ideal_customer?: string | null
          internal_notes?: string | null
          is_managed?: boolean
          is_platform_case?: boolean
          kvk_number?: string | null
          logo_url?: string | null
          maintenance_frequencies?: string[] | null
          managed_package?: string | null
          min_project_value?: string | null
          mollie_customer_id?: string | null
          name: string
          niche?: string | null
          onboarding_completed?: boolean
          onboarding_dismissed?: boolean | null
          onboarding_step?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          premium_guarantees?: string[] | null
          premium_tagline?: string | null
          premium_usp?: string[] | null
          primary_color?: string | null
          project_types?: string[] | null
          region?: string | null
          seasonal_notes?: string | null
          services?: string[] | null
          slug: string
          social_facebook?: string | null
          social_google_business?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          subscription_status?: string
          team_size?: number | null
          tone_of_voice?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
          work_days?: string[] | null
          work_hours_end?: string | null
          work_hours_start?: string | null
        }
        Update: {
          account_manager_user_id?: string | null
          avg_project_value?: string | null
          created_at?: string
          default_payment_days?: number | null
          description?: string | null
          email?: string | null
          google_review_count?: number | null
          google_review_score?: number | null
          iban?: string | null
          id?: string
          ideal_customer?: string | null
          internal_notes?: string | null
          is_managed?: boolean
          is_platform_case?: boolean
          kvk_number?: string | null
          logo_url?: string | null
          maintenance_frequencies?: string[] | null
          managed_package?: string | null
          min_project_value?: string | null
          mollie_customer_id?: string | null
          name?: string
          niche?: string | null
          onboarding_completed?: boolean
          onboarding_dismissed?: boolean | null
          onboarding_step?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          premium_guarantees?: string[] | null
          premium_tagline?: string | null
          premium_usp?: string[] | null
          primary_color?: string | null
          project_types?: string[] | null
          region?: string | null
          seasonal_notes?: string | null
          services?: string[] | null
          slug?: string
          social_facebook?: string | null
          social_google_business?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_tiktok?: string | null
          subscription_status?: string
          team_size?: number | null
          tone_of_voice?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
          work_days?: string[] | null
          work_hours_end?: string | null
          work_hours_start?: string | null
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
          unit: string
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
          unit?: string
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
          unit?: string
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
      work_order_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_type: string | null
          sort_order: number
          storage_path: string
          work_order_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_type?: string | null
          sort_order?: number
          storage_path: string
          work_order_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_type?: string | null
          sort_order?: number
          storage_path?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_photos_work_order_id_fkey"
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
          created_at: string
          date: string | null
          description: string | null
          extra_work: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          project_id: string
          signature_data: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          tenant_id: string
          title: string | null
          updated_at: string
          work_order_number: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          extra_work?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          project_id: string
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          tenant_id: string
          title?: string | null
          updated_at?: string
          work_order_number?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          extra_work?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          project_id?: string
          signature_data?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          tenant_id?: string
          title?: string | null
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
    }
    Views: {
      gt_leads_pipeline_view: {
        Row: {
          avg_days_in_stage: number | null
          lead_count: number | null
          pipeline_stage: string | null
          qualification_rate: number | null
          qualified_count: number | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gt_metrics_summary_view: {
        Row: {
          active_partner_count: number | null
          avg_lead_value: number | null
          overall_qualification_rate: number | null
          qualified_leads: number | null
          recurring_ltv_total: number | null
          streets_active: number | null
          tenant_id: string | null
          total_estimated_value: number | null
          total_jobs_completed: number | null
          total_leads: number | null
          total_street_revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gt_partner_roster_view: {
        Row: {
          amount_pending: number | null
          id: string | null
          is_active: boolean | null
          jobs_completed: number | null
          leads_assigned: number | null
          name: string | null
          paid_payments: number | null
          pending_payments: number | null
          phone: string | null
          specialties: string[] | null
          tenant_id: string | null
          total_payments: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gt_payment_tracking_view: {
        Row: {
          avg_amount: number | null
          latest_paid: string | null
          oldest_payment: string | null
          partner_id: string | null
          partner_name: string | null
          payment_count: number | null
          status: string | null
          tenant_id: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "gt_partner_roster_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gt_street_performance_view: {
        Row: {
          city: string | null
          houses_with_jobs: number | null
          id: string | null
          last_activity_at: string | null
          penetration_rate: number | null
          postal_code: string | null
          recurring_customers: number | null
          revenue_per_house: number | null
          street: string | null
          tenant_id: string | null
          total_houses: number | null
          total_revenue: number | null
        }
        Insert: {
          city?: string | null
          houses_with_jobs?: number | null
          id?: string | null
          last_activity_at?: string | null
          penetration_rate?: never
          postal_code?: string | null
          recurring_customers?: number | null
          revenue_per_house?: never
          street?: string | null
          tenant_id?: string | null
          total_houses?: number | null
          total_revenue?: number | null
        }
        Update: {
          city?: string | null
          houses_with_jobs?: number | null
          id?: string | null
          last_activity_at?: string | null
          penetration_rate?: never
          postal_code?: string | null
          recurring_customers?: number | null
          revenue_per_house?: never
          street?: string | null
          tenant_id?: string | null
          total_houses?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "street_clusters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_get_stats: { Args: never; Returns: Json }
      admin_list_tenants: {
        Args: never
        Returns: {
          created_at: string
          id: string
          name: string
          niche: string
          onboarding_completed: boolean
          owner_name: string
          owner_phone: string
          plan: string
          region: string
          slug: string
          subscription_status: string
          trial_ends_at: string
        }[]
      }
      admin_update_tenant: {
        Args: { new_plan?: string; new_status?: string; target_id: string }
        Returns: undefined
      }
      get_user_tenant_id: { Args: never; Returns: string }
      is_demo_mode_active: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      list_my_tenants: {
        Args: never
        Returns: {
          is_active: boolean
          role: string
          tenant_id: string
          tenant_name: string
        }[]
      }
      seed_default_sops: { Args: { p_tenant_id: string }; Returns: number }
      seed_extra_sops: { Args: { p_tenant_id: string }; Returns: number }
      switch_tenant: { Args: { target_tenant_id: string }; Returns: undefined }
      tenant_has_tier: { Args: { required_tier: string }; Returns: boolean }
      toggle_demo_mode: { Args: { new_state: boolean }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
