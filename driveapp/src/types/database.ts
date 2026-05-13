import type {
  Alert,
  Driver,
  Entitlement,
  LocationSample,
  Membership,
  RouteStop,
  Schedule,
  Stop,
  Trip,
} from '@/types/db';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: Driver;
        Insert: Omit<Driver, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<Driver, 'id'>>;
        Relationships: [];
      };
      memberships: {
        Row: Membership;
        Insert: Omit<Membership, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Membership, 'id'>>;
        Relationships: [];
      };
      trips: {
        Row: Trip;
        Insert: Omit<Trip, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Trip, 'id'>>;
        Relationships: [];
      };
      route_stops: {
        Row: RouteStop;
        Insert: Omit<RouteStop, 'id'> & { id?: string };
        Update: Partial<Omit<RouteStop, 'id'>>;
        Relationships: [];
      };
      stops: {
        Row: Stop;
        Insert: Omit<Stop, 'id'> & { id?: string };
        Update: Partial<Omit<Stop, 'id'>>;
        Relationships: [];
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, 'id'> & { id?: string };
        Update: Partial<Omit<Schedule, 'id'>>;
        Relationships: [];
      };
      location_samples: {
        Row: LocationSample;
        Insert: Omit<LocationSample, 'id'> & { id?: number };
        Update: Partial<Omit<LocationSample, 'id'>>;
        Relationships: [];
      };
      alerts: {
        Row: Alert;
        Insert: Omit<Alert, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Alert, 'id'>>;
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          tenant_id: string | null;
          user_id: string;
          platform: string;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id: string;
          platform: string;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          tenant_id: string | null;
          push_token: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
      entitlements: {
        Row: Entitlement & { id?: string };
        Insert: Entitlement & { id?: string };
        Update: Partial<Entitlement>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
