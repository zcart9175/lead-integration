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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      lead_agents: {
        Row: {
          avg_response_minutes: number
          can_export: boolean
          can_unmask: boolean
          capacity: number
          conversion_rate: number
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          role: string
          status: Database["public"]["Enums"]["agent_status"]
          team: string
          updated_at: string
        }
        Insert: {
          avg_response_minutes?: number
          can_export?: boolean
          can_unmask?: boolean
          capacity?: number
          conversion_rate?: number
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string
          role?: string
          status?: Database["public"]["Enums"]["agent_status"]
          team?: string
          updated_at?: string
        }
        Update: {
          avg_response_minutes?: number
          can_export?: boolean
          can_unmask?: boolean
          capacity?: number
          conversion_rate?: number
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          role?: string
          status?: Database["public"]["Enums"]["agent_status"]
          team?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          created_at: string
          id: string
          is_active: boolean
          lead_id: string | null
          message: string
          severity: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          lead_id?: string | null
          message: string
          severity?: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lead_id?: string | null
          message?: string
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_alerts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_assignments: {
        Row: {
          agent_id: string | null
          assignment_score: number | null
          auto_assigned: boolean
          created_at: string
          id: string
          lead_id: string
          previous_agent_id: string | null
          reason: string | null
        }
        Insert: {
          agent_id?: string | null
          assignment_score?: number | null
          auto_assigned?: boolean
          created_at?: string
          id?: string
          lead_id: string
          previous_agent_id?: string | null
          reason?: string | null
        }
        Update: {
          agent_id?: string | null
          assignment_score?: number | null
          auto_assigned?: boolean
          created_at?: string
          id?: string
          lead_id?: string
          previous_agent_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "lead_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_previous_agent_id_fkey"
            columns: ["previous_agent_id"]
            isOneToOne: false
            referencedRelation: "lead_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_audit_logs: {
        Row: {
          action: string
          action_type: string
          actor: string
          actor_role: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          lead_id: string | null
          metadata: Json
        }
        Insert: {
          action: string
          action_type?: string
          actor?: string
          actor_role?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          metadata?: Json
        }
        Update: {
          action?: string
          action_type?: string
          actor?: string
          actor_role?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lead_audit_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_automation_rules: {
        Row: {
          accuracy: number
          created_at: string
          description: string
          execution_count: number
          id: string
          is_active: boolean
          last_executed_at: string | null
          name: string
          rule_key: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          accuracy?: number
          created_at?: string
          description?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name: string
          rule_key: string
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          accuracy?: number
          created_at?: string
          description?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name?: string
          rule_key?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_communications: {
        Row: {
          content: string
          created_at: string
          created_by: string
          direction: string
          duration_seconds: number | null
          id: string
          lead_id: string
          status: string
          subject: string | null
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          direction?: string
          duration_seconds?: number | null
          id?: string
          lead_id: string
          status?: string
          subject?: string | null
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          direction?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string
          status?: string
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_communications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_escalations: {
        Row: {
          created_at: string
          escalated_from: string | null
          escalated_to: string | null
          id: string
          idle_minutes: number | null
          is_resolved: boolean
          lead_id: string
          level: number
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
        }
        Insert: {
          created_at?: string
          escalated_from?: string | null
          escalated_to?: string | null
          id?: string
          idle_minutes?: number | null
          is_resolved?: boolean
          lead_id: string
          level?: number
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
        }
        Update: {
          created_at?: string
          escalated_from?: string | null
          escalated_to?: string | null
          id?: string
          idle_minutes?: number | null
          is_resolved?: boolean
          lead_id?: string
          level?: number
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_escalations_escalated_from_fkey"
            columns: ["escalated_from"]
            isOneToOne: false
            referencedRelation: "lead_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_escalations_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "lead_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_escalations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_follow_ups: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          created_at: string
          follow_up_type: string
          id: string
          is_completed: boolean
          lead_id: string
          notes: string | null
          outcome: string | null
          scheduled_at: string
          suggested_message: string | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          follow_up_type?: string
          id?: string
          is_completed?: boolean
          lead_id: string
          notes?: string | null
          outcome?: string | null
          scheduled_at: string
          suggested_message?: string | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          follow_up_type?: string
          id?: string
          is_completed?: boolean
          lead_id?: string
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string
          suggested_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "lead_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_integration_events: {
        Row: {
          created_at: string
          detail: string
          event: string
          id: string
          integration_key: string
          status: string
        }
        Insert: {
          created_at?: string
          detail?: string
          event: string
          id?: string
          integration_key: string
          status?: string
        }
        Update: {
          created_at?: string
          detail?: string
          event?: string
          id?: string
          integration_key?: string
          status?: string
        }
        Relationships: []
      }
      lead_integrations: {
        Row: {
          category: string
          created_at: string
          description: string
          endpoint_url: string | null
          events_today: number
          id: string
          integration_key: string
          is_enabled: boolean
          last_sync_at: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          endpoint_url?: string | null
          events_today?: number
          id?: string
          integration_key: string
          is_enabled?: boolean
          last_sync_at?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          endpoint_url?: string | null
          events_today?: number
          id?: string
          integration_key?: string
          is_enabled?: boolean
          last_sync_at?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_private: boolean
          lead_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          id?: string
          is_private?: boolean
          lead_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_private?: boolean
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_routing_rules: {
        Row: {
          created_at: string
          description: string
          execution_count: number
          id: string
          is_active: boolean
          name: string
          rule_key: string
          strategy: string
          target_team: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          name: string
          rule_key: string
          strategy?: string
          target_team?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          execution_count?: number
          id?: string
          is_active?: boolean
          name?: string
          rule_key?: string
          strategy?: string
          target_team?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_scores: {
        Row: {
          confidence: number
          created_at: string
          factors: Json
          id: string
          lead_id: string
          model_version: string
          score: number
          score_type: string
        }
        Insert: {
          confidence?: number
          created_at?: string
          factors?: Json
          id?: string
          lead_id: string
          model_version?: string
          score: number
          score_type: string
        }
        Update: {
          confidence?: number
          created_at?: string
          factors?: Json
          id?: string
          lead_id?: string
          model_version?: string
          score?: number
          score_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scores_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string
          setting_key: string
          updated_at: string
          value_bool: boolean | null
          value_text: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          label: string
          setting_key: string
          updated_at?: string
          value_bool?: boolean | null
          value_text?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string
          setting_key?: string
          updated_at?: string
          value_bool?: boolean | null
          value_text?: string | null
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          campaign: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sub_sources: Json
          type: Database["public"]["Enums"]["lead_source_type"]
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sub_sources?: Json
          type: Database["public"]["Enums"]["lead_source_type"]
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sub_sources?: Json
          type?: Database["public"]["Enums"]["lead_source_type"]
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_score: number
          assigned_agent_id: string | null
          assigned_at: string | null
          budget_range: string | null
          campaign: string | null
          category: string
          city: string | null
          closed_at: string | null
          company: string | null
          conversion_probability: number
          country: string
          created_at: string
          deal_value: number
          device: string
          duplicate_of: string | null
          duplicate_score: number
          email: string
          fraud_score: number
          id: string
          industry: Database["public"]["Enums"]["lead_industry"]
          intent_score: number
          ip_address: string | null
          is_duplicate: boolean
          language: string
          last_contact_at: string | null
          lost_reason: string | null
          name: string
          next_follow_up: string | null
          phone: string
          priority: Database["public"]["Enums"]["lead_priority"]
          requirements: string | null
          source: Database["public"]["Enums"]["lead_source_type"]
          spam_reason: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status_type"]
          sub_source: string
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
        }
        Insert: {
          ai_score?: number
          assigned_agent_id?: string | null
          assigned_at?: string | null
          budget_range?: string | null
          campaign?: string | null
          category?: string
          city?: string | null
          closed_at?: string | null
          company?: string | null
          conversion_probability?: number
          country?: string
          created_at?: string
          deal_value?: number
          device?: string
          duplicate_of?: string | null
          duplicate_score?: number
          email: string
          fraud_score?: number
          id?: string
          industry?: Database["public"]["Enums"]["lead_industry"]
          intent_score?: number
          ip_address?: string | null
          is_duplicate?: boolean
          language?: string
          last_contact_at?: string | null
          lost_reason?: string | null
          name: string
          next_follow_up?: string | null
          phone?: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          requirements?: string | null
          source?: Database["public"]["Enums"]["lead_source_type"]
          spam_reason?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status_type"]
          sub_source?: string
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Update: {
          ai_score?: number
          assigned_agent_id?: string | null
          assigned_at?: string | null
          budget_range?: string | null
          campaign?: string | null
          category?: string
          city?: string | null
          closed_at?: string | null
          company?: string | null
          conversion_probability?: number
          country?: string
          created_at?: string
          deal_value?: number
          device?: string
          duplicate_of?: string | null
          duplicate_score?: number
          email?: string
          fraud_score?: number
          id?: string
          industry?: Database["public"]["Enums"]["lead_industry"]
          intent_score?: number
          ip_address?: string | null
          is_duplicate?: boolean
          language?: string
          last_contact_at?: string | null
          lost_reason?: string | null
          name?: string
          next_follow_up?: string | null
          phone?: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          requirements?: string | null
          source?: Database["public"]["Enums"]["lead_source_type"]
          spam_reason?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status_type"]
          sub_source?: string
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "lead_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agent_status: "online" | "busy" | "offline"
      lead_industry:
        | "retail"
        | "healthcare"
        | "finance"
        | "education"
        | "real_estate"
        | "manufacturing"
        | "hospitality"
        | "logistics"
        | "technology"
        | "other"
      lead_priority: "critical" | "high" | "medium" | "low"
      lead_source_type:
        | "website"
        | "seo"
        | "social"
        | "ads"
        | "marketplace"
        | "referral"
        | "manual"
        | "api"
        | "whatsapp"
      lead_status_type:
        | "new"
        | "contacted"
        | "interested"
        | "follow_up"
        | "negotiation"
        | "won"
        | "lost"
        | "spam"
      lead_temperature: "hot" | "warm" | "cold"
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
      agent_status: ["online", "busy", "offline"],
      lead_industry: [
        "retail",
        "healthcare",
        "finance",
        "education",
        "real_estate",
        "manufacturing",
        "hospitality",
        "logistics",
        "technology",
        "other",
      ],
      lead_priority: ["critical", "high", "medium", "low"],
      lead_source_type: [
        "website",
        "seo",
        "social",
        "ads",
        "marketplace",
        "referral",
        "manual",
        "api",
        "whatsapp",
      ],
      lead_status_type: [
        "new",
        "contacted",
        "interested",
        "follow_up",
        "negotiation",
        "won",
        "lost",
        "spam",
      ],
      lead_temperature: ["hot", "warm", "cold"],
    },
  },
} as const
