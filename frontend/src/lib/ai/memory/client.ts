/**
 * Hindsight Cloud Client — Singleton
 * 
 * This is the ONLY file that imports the Hindsight SDK directly.
 * All other files use memory.service.ts instead.
 */

let clientInstance: any = null;

function getHindsightClient(): any {
  if (clientInstance) return clientInstance;

  const baseUrl = process.env.HINDSIGHT_URL;
  const apiKey = process.env.HINDSIGHT_API_KEY;

  if (!baseUrl || !apiKey) {
    console.warn('[Hindsight] Missing HINDSIGHT_URL or HINDSIGHT_API_KEY — memory disabled.');
    return null;
  }

  try {
    // Dynamic import to gracefully handle missing package
    const { HindsightClient } = require('@vectorize-io/hindsight-client');
    clientInstance = new HindsightClient({
      baseUrl,
      apiKey
    });
    console.log('[Hindsight] Client initialized successfully.');
    return clientInstance;
  } catch (e: any) {
    console.warn('[Hindsight] SDK not available:', e?.message || e);
    return null;
  }
}

export { getHindsightClient };
