# FixNow — Security

## Overview

The FixNow platform implements a defense-in-depth security strategy across authentication, input validation, AI boundaries, and data access controls.

## Authentication & Authorization

### Firebase Auth
- All dashboard routes are protected by `onAuthStateChanged` listeners
- Role-based access control enforced at the route level:
  - `/customer/*` → `role === 'customer'`
  - `/technician/*` → `role === 'technician'`
  - `/admin/*` → `role === 'admin'`
- Unauthorized role detection triggers immediate `signOut()` + redirect
- Grace period (2000ms) prevents false redirects during auth initialization

### Route Protection Pattern
```typescript
useEffect(() => {
  const unsub = onAuthStateChanged(auth, async (u) => {
    if (!u) {
      const t = setTimeout(() => {
        if (!auth.currentUser) router.push('/auth/login?role=<role>');
      }, 2000);
      return () => clearTimeout(t);
    }
    // Verify role matches route
    const data = await fetch(`/api/users/${u.uid}`);
    if (data.user.role !== '<expected_role>') {
      await auth.signOut();
      router.replace('/auth/login?role=<expected_role>');
    }
  });
  return () => unsub();
}, [router]);
```

## Input Validation

### Zod Schema Validation
All AI pipeline inputs are validated using Zod before reaching the LLM:

- **Text length limits**: Prevents buffer overflow / cost attacks (max 2000 chars)
- **Required fields**: `userId`, `sessionId`, `trigger` are mandatory
- **Type enforcement**: Strict TypeScript types at runtime

### Image Upload Validation
- **Mime type whitelist**: Only `image/jpeg`, `image/png`, `image/webp` accepted
- **File size limit**: Maximum 10MB per upload
- **Malware prevention**: `.exe`, `.pdf`, and other non-image types are rejected

## AI Security

### Prompt Injection Defense
- System prompts are structured to resist injection attempts
- Low-confidence outputs (< 0.3) are flagged as "Unknown" rather than hallucinated
- All AI outputs are validated against Zod schemas before rendering

### Rate Limiting
- Platform-level rate limiter prevents API abuse
- Per-user request throttling

## Data Access

### Firestore Security
- All database operations use authenticated Firebase clients
- Real-time listeners are scoped to authorized collections
- Admin operations require `role === 'admin'` verification

### Memory Isolation
- Hindsight memory queries are scoped by `userId` / `applianceId`
- Cross-tenant memory access is prevented at the orchestration layer

## Platform Engineering Defenses

| Layer | Implementation | Location |
|-------|---------------|----------|
| Validation | Zod schemas | `src/lib/platform/validation/` |
| Error Handling | Typed `AppError` hierarchy | `src/lib/platform/errors/` |
| Logging | Pino structured JSON logs | `src/lib/platform/logger/` |
| Metrics | Custom `MetricsCollector` | `src/lib/platform/metrics/` |
| Caching | TTL `ResponseCache` | `src/lib/platform/cache/` |
| Rate Limiting | Per-user throttle | `src/lib/platform/rate-limit/` |
| Feature Flags | Environment-based toggles | `src/lib/platform/feature-flags/` |
