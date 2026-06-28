# FixNow — Tech Stack

## Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.2.9 | Full-stack React framework with App Router |
| **React** | 18 | UI component library |
| **TypeScript** | 5.x | Type safety across the entire codebase |

## AI & ML

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Groq** | `@ai-sdk/groq ^4.0.0` | Ultra-fast LLM inference (LLaMA 3.1) |
| **Vercel AI SDK** | `ai ^7.0.3` | Unified AI provider abstraction |
| **cascadeflow** | `1.1.1-smr.2` | Multi-step AI workflow routing with fallback logic |
| **Hindsight** | `@vectorize-io/hindsight-client ^0.1.0` | Semantic vector memory for repair history recall |

## Backend & Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Firebase** | 12.13.0 | Firestore (database), Auth, Storage |
| **Zod** | 3.23.0 | Runtime schema validation for all AI inputs/outputs |
| **Pino** | 9.0.0 | Structured JSON logging |
| **Axios** | 1.15.0 | HTTP client for backend API calls |

## UI & Design

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 3.4.1 | Utility-first CSS framework |
| **Framer Motion** | 12.38.0 | Animation library for page transitions & micro-interactions |
| **Lucide React** | 1.12.0 | Icon system |
| **Radix UI** | Various | Accessible primitives (Dialog, Checkbox, Label) |
| **next-themes** | 0.4.6 | Dark mode theming |

## Maps & Geolocation

| Technology | Version | Purpose |
|-----------|---------|---------|
| **@react-google-maps/api** | 2.20.8 | Google Maps integration for technician tracking |
| **MapLibre GL** | 5.24.0 | Open-source map rendering |
| **GeoFire Common** | 6.0.0 | Geospatial queries for nearby technician matching |
| **@turf/turf** | 7.3.5 | Geospatial analysis utilities |

## Communication

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Socket.IO Client** | 4.8.3 | Real-time WebSocket for live booking updates |

## Testing

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Jest** | (dev) | Unit, integration, and E2E test runner |
| **ts-jest** | (dev) | TypeScript Jest transformer |

## Design Rationale

- **Groq over OpenAI**: Sub-200ms structured output generation at 1/10th the cost
- **Tailwind 3.4 (not v4)**: Stability and ecosystem compatibility locked per project rules
- **Firebase**: Serverless backend with real-time listeners eliminates the need for a dedicated server for data
- **Hindsight**: Semantic memory enables contextual AI that improves with each repair
- **cascadeflow**: Prevents single-point-of-failure in multi-step AI chains
