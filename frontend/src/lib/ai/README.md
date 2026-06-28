# FixNow AI Infrastructure

This directory (`src/lib/ai`) contains the core, reusable infrastructure for the FixNow AI Platform. 
It is designed to support a phased, pragmatic integration path:
1. Working AI Endpoint (Vercel AI SDK + LLM Providers)
2. Memory Integration (Hindsight)
3. Routing & Budgeting Integration (CascadeFlow)
4. AI Agents (Diagnosis, Booking, Technician Copilot)

## Directory Structure & Responsibilities

- **`gateway/`**: 
  The entry point for all AI requests from the API or Server Actions. Handles request validation, authentication, and basic timeout constraints before passing data deeper.

- **`providers/`**: 
  The LLM integration layer. Will contain the specific adapters for OpenRouter, Groq, Ollama, etc. This ensures the rest of the app doesn't rely directly on vendor-specific SDKs.

- **`runtime/`**: 
  The execution engine. Manages policies like retries, provider/model selection, and metrics collection. Later, this is where `cascadeflow-core-smr` will be integrated to handle intelligent routing.

- **`memory/`**: 
  The context and retrieval layer. Responsible for injecting past conversations, user context, or RAG data into the prompt. Later, `Hindsight` will be integrated here to automate long-term memory.

- **`prompts/`**: 
  A centralized repository for system prompts and prompt templates used across different AI agents (e.g., Diagnosis vs. Booking). 

- **`tools/`**: 
  The executable functions (Tool Calling / Function Calling) that the LLMs can trigger to interact with FixNow's business logic, such as checking a technician's schedule or calculating an estimate.

- **`types/`**: 
  Universal TypeScript interfaces (`AIRequest`, `AIResponse`, etc.) that guarantee type safety across the entire AI pipeline.

- **`config/`**: 
  Environment configurations, limits, default models, and provider API keys.
