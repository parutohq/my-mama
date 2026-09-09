/* Generated with `pnpm supabase:types` after linking a Supabase project.
 * This checked-in bootstrap keeps the app type-safe at the client boundary until then. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Table = { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
export type Database = { public: { Tables: {
  profiles: Table; user_journeys: Table; health_events: Table; symptom_logs: Table;
  menstrual_cycles: Table; appointments: Table; care_tasks: Table; care_questions: Table;
  pregnancies: Table; postpartum_profiles: Table; user_roles: Table; providers: Table;
  consultation_services: Table; provider_availability: Table; consultation_bookings: Table;
  sharing_permissions: Table; clinical_content: Table; audit_logs: Table;
}; Views: Record<string, never>; Functions: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never> } };
