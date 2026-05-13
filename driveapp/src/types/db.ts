// Enums
export type TenantStatus = 'trial' | 'active' | 'suspended';
export type MembershipRole = 'company_admin' | 'dispatcher' | 'support' | 'readonly';
export type TripStatus = 'scheduled' | 'active' | 'completed' | 'cancelled';
export type Platform = 'ios' | 'android' | 'web';
export type AlertSeverity = 'info' | 'warning' | 'critical';

// Tables (row types — use for all query return values)
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan_tier: string;
  created_at: string;
  updated_at: string;
  suspended_at: string | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  tenant_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
}

export interface Driver {
  id: string;
  tenant_id: string;
  user_id: string;
  full_name: string;
  license_number: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  tenant_id: string;
  label: string;
  plate: string | null;
  capacity: number | null;
  status: string;
}

export interface Route {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  active: boolean;
}

export interface Stop {
  id: string;
  tenant_id: string;
  name: string;
  lat: number | null;
  lng: number | null;
}

export interface RouteStop {
  id: string;
  tenant_id: string;
  route_id: string;
  stop_id: string;
  sequence_order: number;
  arrival_offset_min: number;
  departure_offset_min: number;
  is_destination: boolean;
}

export interface Schedule {
  id: string;
  tenant_id: string;
  route_id: string;
  day_of_week: number | null;
  departs_at: string | null;
  meta: Record<string, unknown>;
}

export interface Trip {
  id: string;
  tenant_id: string;
  route_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  scheduled_start: string | null;
  status: TripStatus;
  created_at: string;
  updated_at: string;
}

export interface LocationSample {
  id: number;
  tenant_id: string;
  trip_id: string;
  lat: number;
  lng: number;
  recorded_at: string;
  payload: {
    accuracy?: number;
    speed?: number;
    bearing?: number;
    heading?: number;
    [key: string]: unknown;
  };
}

export interface Alert {
  id: string;
  tenant_id: string;
  trip_id: string | null;
  severity: AlertSeverity;
  message: string;
  created_at: string;
}

export interface Device {
  id: string;
  tenant_id: string | null;
  user_id: string;
  platform: Platform;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entitlement {
  tenant_id: string;
  feature_key: string;
  enabled: boolean;
}
