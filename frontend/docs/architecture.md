# FixNow — System Architecture

## Overview

FixNow is a full-stack home services platform built on Next.js 16, Firebase, and a multi-model AI pipeline. The platform connects customers with verified technicians for appliance repair, using AI to diagnose issues, recommend specialists, and predict future failures.

## Architecture Diagram

```mermaid
graph TB
    subgraph Client["Client Layer (Next.js 16)"]
        LP["Landing Page"]
        CD["Customer Dashboard"]
        TD["Technician Dashboard"]
        AD["Admin Dashboard"]
        CB["AI Chatbot"]
    end

    subgraph AI["AI Pipeline"]
        ORC["Orchestration Layer"]
        SD["Smart Diagnosis"]
        BI["Booking Intelligence"]
        TC["Technician Copilot"]
        PM["Predictive Maintenance"]
        MSI["Multimodal Service Intelligence"]
        OPS["Admin Intelligence"]
    end

    subgraph Providers["AI Providers"]
        GROQ["Groq (LLaMA 3.1)"]
        VSDK["Vercel AI SDK"]
        CF["cascadeflow"]
    end

    subgraph Memory["Memory & Storage"]
        HS["Hindsight (Semantic Memory)"]
        FB["Firebase Firestore"]
        FBA["Firebase Auth"]
        FBS["Firebase Storage"]
    end

    subgraph Platform["Platform Engineering"]
        VAL["Zod Validation"]
        CACHE["Response Cache"]
        LOG["Pino Logger"]
        MET["Metrics Collector"]
        RL["Rate Limiter"]
        FF["Feature Flags"]
    end

    Client --> ORC
    ORC --> SD
    ORC --> BI
    ORC --> TC
    ORC --> PM
    ORC --> MSI
    ORC --> OPS

    SD --> GROQ
    BI --> GROQ
    TC --> GROQ
    PM --> GROQ

    GROQ --> VSDK
    CF --> ORC

    SD --> HS
    PM --> HS

    Client --> FB
    Client --> FBA
    Client --> FBS

    ORC --> Platform
```

## Data Flow

1. **Customer reports issue** → Text/image/voice input → Multimodal Service Intelligence classifies the upload
2. **Smart Diagnosis** → Groq LLM analyzes the issue, queries Hindsight for past repairs on this appliance
3. **Booking Intelligence** → Maps diagnosis output to technician skills, tools, and urgency
4. **Technician Copilot** → Generates step-by-step repair checklist for the assigned technician
5. **Predictive Maintenance** → After repair, calculates future failure probability using repair history from Hindsight
6. **Admin Intelligence** → Aggregates platform-wide metrics for executive dashboards

## Key Design Decisions

- **Groq over OpenAI**: Chosen for speed (sub-200ms inference) and cost efficiency for structured output generation
- **Hindsight Vector Memory**: Enables semantic recall of past repairs, making each diagnosis contextually aware
- **cascadeflow**: Routes complex multi-step AI workflows with automatic fallback and retry logic
- **Zod Everywhere**: Every AI input and output is validated against strict schemas, preventing hallucination-induced crashes
