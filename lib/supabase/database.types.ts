/* Generated with `pnpm supabase:types` after linking a Supabase project.
 * This checked-in bootstrap keeps the app type-safe at the client boundary until then. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table = { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
export type Database = { public: { Tables: {
  profiles: Table; user_journeys: Table; health_events: Table; symptom_logs: Table;
  menstrual_cycles: Table; appointments: Table; care_tasks: Table; medications: Table; investigations: Table; care_questions: Table; profile_preferences: Table; journey_transitions: Table;
  journey_tasks: Table; achievement_definitions: Table; user_achievements: Table; user_reminders: Table;
  notifications: Table; push_subscriptions: Table; notification_delivery_logs: Table; demo_data_state: Table;
  pregnancies: Table; postpartum_profiles: Table; user_roles: Table; providers: Table;
  consultation_services: Table; provider_availability: Table; consultation_bookings: Table;
  sharing_permissions: Table; clinical_content: Table; audit_logs: Table; pregnancy_share_links: Table;
}; Views: Record<string, never>; Functions: {
  mama_username_status: { Args: { candidate: string }; Returns: string };
  claim_mama_identity: { Args: { candidate: string; chosen_display_name: string; confirmed_13_plus: boolean }; Returns: string };
  mama_public_profile: { Args: { handle: string }; Returns: Json };
  resolve_pregnancy_share: { Args: { lookup_hash: string }; Returns: Json };
}; Enums: Record<string, never>; CompositeTypes: Record<string, never> } };
