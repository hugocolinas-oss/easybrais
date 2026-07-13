/**
 * Supabase Database types for Easy Brais.
 *
 * Hand-written to match the initial migration. Once the schema stabilises,
 * regenerate with:
 *   npx supabase gen types typescript --project-id <id> > packages/types/src/database.ts
 */

export type BookingType = "luggage_transfer" | "custom";
export type BookingStatus = "draft" | "pending" | "pending_payment" | "payment_expired" | "confirmed" | "in_pickup" | "in_progress" | "in_transit" | "delivered" | "completed" | "cancelled" | "incident";
export type PaymentStatus = "pending" | "paid" | "partial" | "refunded";
export type EmailStatus = "not_sent" | "sent" | "failed";
export type SourceChannel = "web" | "phone" | "email" | "walk_in" | "partner" | "other";
export type OperationalStatus = "pending" | "picked_up" | "in_transit" | "delivered" | "failed";
export type EventType =
  | "created"
  | "updated"
  | "status_changed"
  | "item_status_changed"
  | "incident_reported"
  | "payment_received"
  | "payment_expired"
  | "email_sent"
  | "note_added"
  | "cancelled";
export type ActorType = "system" | "staff" | "customer";
export type StaffRole = "chofer" | "operator" | "manager" | "admin";

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          language: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          language?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          language?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      accommodations: {
        Row: {
          id: string;
          external_code: string | null;
          name: string;
          display_name: string | null;
          stage_name: string | null;
          town: string | null;
          route_name: string | null;
          address: string | null;
          lat: number | null;
          lng: number | null;
          contact_phone: string | null;
          contact_email: string | null;
          active: boolean;
          visible_in_reservations: boolean;
          internal_notes: string | null;
          reservation_notes: string | null;
          sort_order: number;
          route_stage_id: string | null;
          last_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_code?: string | null;
          name: string;
          display_name?: string | null;
          stage_name?: string | null;
          town?: string | null;
          route_name?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          active?: boolean;
          visible_in_reservations?: boolean;
          internal_notes?: string | null;
          reservation_notes?: string | null;
          sort_order?: number;
          route_stage_id?: string | null;
          last_verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_code?: string | null;
          name?: string;
          display_name?: string | null;
          stage_name?: string | null;
          town?: string | null;
          route_name?: string | null;
          address?: string | null;
          lat?: number | null;
          lng?: number | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          active?: boolean;
          visible_in_reservations?: boolean;
          internal_notes?: string | null;
          reservation_notes?: string | null;
          sort_order?: number;
          route_stage_id?: string | null;
          last_verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accommodations_route_stage_id_fkey";
            columns: ["route_stage_id"];
            isOneToOne: false;
            referencedRelation: "route_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      route_stages: {
        Row: {
          id: string;
          code: number;
          name: string;
          route_section: string;
          branch_sequence: number;
          price_to_redondela: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: number;
          name: string;
          route_section: string;
          branch_sequence: number;
          price_to_redondela?: number | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: number;
          name?: string;
          route_section?: string;
          branch_sequence?: number;
          price_to_redondela?: number | null;
          active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          id: string;
          booking_code: string;
          customer_id: string;
          booking_type: BookingType;
          service_date: string;
          status: BookingStatus;
          source_channel: SourceChannel;
          language: string;
          notes_customer: string | null;
          notes_internal: string | null;
          incident_reason: string | null;
          incident_reported_at: string | null;
          subtotal_amount: number;
          extra_weight_amount: number;
          discount_amount: number;
          total_amount: number;
          payment_status: PaymentStatus;
          email_status: EmailStatus;
          stripe_session_id: string | null;
          stripe_payment_intent: string | null;
          payment_method: string | null;
          payment_expires_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_code: string;
          customer_id: string;
          booking_type?: BookingType;
          service_date: string;
          status?: BookingStatus;
          source_channel?: SourceChannel;
          language?: string;
          notes_customer?: string | null;
          notes_internal?: string | null;
          incident_reason?: string | null;
          incident_reported_at?: string | null;
          subtotal_amount?: number;
          extra_weight_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          payment_status?: PaymentStatus;
          email_status?: EmailStatus;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          payment_method?: string | null;
          payment_expires_at?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_code?: string;
          customer_id?: string;
          booking_type?: BookingType;
          service_date?: string;
          status?: BookingStatus;
          source_channel?: SourceChannel;
          language?: string;
          notes_customer?: string | null;
          notes_internal?: string | null;
          incident_reason?: string | null;
          incident_reported_at?: string | null;
          subtotal_amount?: number;
          extra_weight_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          payment_status?: PaymentStatus;
          email_status?: EmailStatus;
          stripe_session_id?: string | null;
          stripe_payment_intent?: string | null;
          payment_method?: string | null;
          payment_expires_at?: string | null;
          paid_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_items: {
        Row: {
          id: string;
          booking_id: string;
          service_date: string;
          pickup_accommodation_id: string | null;
          dropoff_accommodation_id: string | null;
          bags_count: number;
          overweight_bags_count: number;
          unit_price: number;
          line_total: number;
          operational_status: OperationalStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          service_date: string;
          pickup_accommodation_id?: string | null;
          dropoff_accommodation_id?: string | null;
          bags_count?: number;
          overweight_bags_count?: number;
          unit_price?: number;
          line_total?: number;
          operational_status?: OperationalStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          service_date?: string;
          pickup_accommodation_id?: string | null;
          dropoff_accommodation_id?: string | null;
          bags_count?: number;
          overweight_bags_count?: number;
          unit_price?: number;
          line_total?: number;
          operational_status?: OperationalStatus;
        };
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_items_pickup_accommodation_id_fkey";
            columns: ["pickup_accommodation_id"];
            isOneToOne: false;
            referencedRelation: "accommodations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_items_dropoff_accommodation_id_fkey";
            columns: ["dropoff_accommodation_id"];
            isOneToOne: false;
            referencedRelation: "accommodations";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_events: {
        Row: {
          id: string;
          booking_id: string;
          event_type: EventType;
          actor_type: ActorType;
          actor_id: string | null;
          payload_json: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          event_type: EventType;
          actor_type?: ActorType;
          actor_id?: string | null;
          payload_json?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          event_type?: EventType;
          actor_type?: ActorType;
          actor_id?: string | null;
          payload_json?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_cash_closures: {
        Row: {
          id: string;
          closure_date: string;
          total_bookings: number;
          total_bags: number;
          gross_amount: number;
          discounts_amount: number;
          extras_amount: number;
          net_amount: number;
          pending_collection_amount: number;
          cancellations_count: number;
          generated_at: string;
        };
        Insert: {
          id?: string;
          closure_date: string;
          total_bookings?: number;
          total_bags?: number;
          gross_amount?: number;
          discounts_amount?: number;
          extras_amount?: number;
          net_amount?: number;
          pending_collection_amount?: number;
          cancellations_count?: number;
          generated_at?: string;
        };
        Update: {
          id?: string;
          closure_date?: string;
          total_bookings?: number;
          total_bags?: number;
          gross_amount?: number;
          discounts_amount?: number;
          extras_amount?: number;
          net_amount?: number;
          pending_collection_amount?: number;
          cancellations_count?: number;
        };
        Relationships: [];
      };
      email_logs: {
        Row: {
          id: string;
          booking_id: string | null;
          recipient: string;
          subject: string | null;
          template: string | null;
          template_key: string;
          status: string;
          provider: string | null;
          external_message_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id?: string | null;
          recipient: string;
          subject?: string | null;
          template?: string | null;
          template_key: string;
          status?: string;
          provider?: string | null;
          external_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string | null;
          recipient?: string;
          subject?: string | null;
          template?: string | null;
          template_key?: string;
          status?: string;
          provider?: string | null;
          external_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_logs_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_routes: {
        Row: {
          id: string;
          route_date: string;
          status: string;
          notes: string | null;
          route_section: string;
          total_stops: number;
          total_bags: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          route_date: string;
          status?: string;
          notes?: string | null;
          route_section?: string;
          total_stops?: number;
          total_bags?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          route_date?: string;
          status?: string;
          notes?: string | null;
          route_section?: string;
          total_stops?: number;
          total_bags?: number;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_route_stops: {
        Row: {
          id: string;
          route_id: string;
          position: number;
          stop_type: string;
          accommodation_id: string | null;
          accommodation_name: string;
          accommodation_town: string | null;
          booking_item_id: string | null;
          booking_code: string;
          customer_name: string;
          bags_count: number;
          completed: boolean;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          route_id: string;
          position: number;
          stop_type: string;
          accommodation_id?: string | null;
          accommodation_name?: string;
          accommodation_town?: string | null;
          booking_item_id?: string | null;
          booking_code?: string;
          customer_name?: string;
          bags_count?: number;
          completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          route_id?: string;
          position?: number;
          stop_type?: string;
          accommodation_id?: string | null;
          accommodation_name?: string;
          accommodation_town?: string | null;
          booking_item_id?: string | null;
          booking_code?: string;
          customer_name?: string;
          bags_count?: number;
          completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "daily_route_stops_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "daily_routes";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          role: StaffRole;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name?: string;
          role?: StaffRole;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          full_name?: string;
          role?: StaffRole;
          active?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      booking_type: BookingType;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      email_status: EmailStatus;
      source_channel: SourceChannel;
      operational_status: OperationalStatus;
      event_type: EventType;
      actor_type: ActorType;
      staff_role: StaffRole;
    };
  };
}
