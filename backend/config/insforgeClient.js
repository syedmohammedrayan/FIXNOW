// InsForge client for backend - graceful fallback if SDK is unavailable
// The @insforge/sdk has ESM/CJS compatibility issues on Node v24+
// The bookings route already has mock data fallback, so this is safe.

let insforge = null;

try {
  const { createClient } = require('@insforge/sdk');
  const insforgeUrl = process.env.INSFORGE_URL || '';
  const insforgeAnonKey = process.env.INSFORGE_ANON_KEY || '';
  if (insforgeUrl && insforgeAnonKey) {
    insforge = createClient({
      baseUrl: insforgeUrl,
      anonKey: insforgeAnonKey
    });
    console.log('✅ InsForge backend client initialized');
  } else {
    console.warn('⚠️  InsForge: INSFORGE_URL / INSFORGE_ANON_KEY not set. Using mock data.');
  }
} catch (e) {
  console.warn('⚠️  InsForge SDK unavailable (likely Node v24 ESM issue). Falling back to mock data.');
}

// Proxy object so callers can do insforge.database.from(...).select() safely
const insforgeProxy = insforge || {
  database: {
    from: () => ({
      select: async () => ({ data: null, error: new Error('InsForge unavailable') }),
      insert: async () => ({ data: null, error: new Error('InsForge unavailable') }),
    })
  }
};

module.exports = { insforge: insforgeProxy };
