import { createClient } from '@insforge/sdk';

// Initialize the InsForge client
const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL || '';
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY || '';

// createClient with options object to match SDK types
export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey
});
