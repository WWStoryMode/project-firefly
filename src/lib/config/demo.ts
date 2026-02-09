/**
 * Demo mode configuration
 *
 * Centralizes all demo-specific constants and the demo mode flag.
 * When NEXT_PUBLIC_DEMO_MODE is 'true', the app uses hardcoded demo user IDs
 * and skips authentication. When 'false', real auth is required.
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

export const DEMO_IDS = {
  CUSTOMER_ID: '00000000-0000-0000-0000-000000000001',
  VENDOR_ID: '10000000-0000-0000-0000-000000000001',
  DELIVERY_PERSON_ID: '30000000-0000-0000-0000-000000000001',
} as const;
