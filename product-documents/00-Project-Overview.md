# MedAssist AI - Project Overview

## What Is This Project?

MedAssist AI is a full-stack healthcare chatbot that answers patient health questions using trusted medical sources. Unlike generic chatbot demos, it implements a complete production-grade pipeline: medical PDF ingestion, vector search, multi-LLM response generation, emergency detection, and voice interaction — all with patient safety as the core design constraint.

The project addresses a real problem in healthcare: patients Google symptoms and get unreliable, often alarming results. MedAssist AI provides grounded, cited answers from verified medical documents (NHS, WHO, CDC guidelines) while knowing its limits — it escalates emergencies, asks clarifying questions when needed, and never attempts to diagnose.

---

## What This Project Demonstrates

### 1. RAG (Retrieval-Augmented Generation) System Design

Built a complete RAG pipeline from scratch — not using a pre-built framework or template:

- **Document ingestion**: PDFs are loaded, split into semantically meaningful chunks (600 tokens, 100 overlap), and embedded using sentence-transformers
- **Vector storage**: ChromaDB with cosine similarity search and persistent storage
- **Context retrieval**: Top-k relevant chunks are retrieved per query and formatted as grounded context for the LLM
- **Source citation**: Every response traces back to a specific document and page number

This demonstrates understanding of how LLMs can be made factually reliable — a critical concern in production AI systems.

### 2. Agentic Routing with Safety Guardrails

The system does not blindly pass every query to the LLM. An agent layer classifies intent first:

- **ESCALATE** — Detects 25+ emergency keywords (chest pain, difficulty breathing, choking) and immediately directs users to call emergency services. The LLM is never consulted for emergencies.
- **CLARIFY** — Detects vague or ambiguous queries and asks targeted follow-up questions before retrieving documents.
- **ANSWER** — Runs the full RAG pipeline only for valid, clear health questions.

This pattern — deterministic routing before expensive LLM calls — is how production AI agents are built. It reduces latency, controls costs, and prevents unsafe outputs.

### 3. Multi-LLM Architecture

The backend supports three LLM providers with automatic fallback:

| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Google Gemini | gemini-1.5-flash-latest |
| 2 | Anthropic Claude | claude-3-5-haiku |
| 3 | OpenAI | gpt-4o-mini |

The system selects the provider based on which API key is configured. This demonstrates provider-agnostic LLM integration — a practical requirement in production where vendor lock-in is a risk.

### 4. Full-Stack Development

**Backend (Python)**
- FastAPI with async endpoints, Pydantic validation, and OpenAPI docs
- LangChain for LLM orchestration and document processing
- ChromaDB for vector similarity search
- HuggingFace sentence-transformers for local embeddings (no API calls needed)
- Environment-based configuration with multi-provider support

**Frontend (React + TypeScript)**
- React 19 with custom hooks and functional components
- TypeScript strict mode throughout
- Vite for fast builds and HMR
- Responsive UI with CSS animations and glassmorphism effects
- Centralized HTTP client with error handling

### 5. Browser-Native Voice Interaction

Built voice input and output using browser APIs — no external speech services:

- **Speech-to-Text**: Web Speech Recognition API with real-time transcription and debounced submission
- **Text-to-Speech**: Speech Synthesis API with global speaker tracking to prevent overlapping audio across message bubbles
- Graceful degradation when voice APIs are unavailable

### 6. Security-Conscious Development

- **XSS prevention**: Markdown rendering uses React elements instead of `dangerouslySetInnerHTML`
- **Path traversal protection**: File upload sanitizes filenames to prevent directory escape attacks
- **Endpoint authentication**: Admin endpoints (`/ingest`, `/upload`) support API key protection via headers
- **Input validation**: Pydantic models enforce request schemas; empty and malformed queries are rejected
- **CORS configuration**: Restricted to specific frontend origins

### 7. Production Patterns

- **Health monitoring**: Frontend polls backend health with exponential backoff (3s, 6s, 12s, 24s, 30s cap) when disconnected
- **Content-derived IDs**: Document chunks use hash-based IDs so re-ingesting a single file does not corrupt other documents
- **Telemetry control**: ChromaDB telemetry disabled to prevent runtime crashes
- **Error boundaries**: Descriptive error messages at startup (missing prompt file, missing API keys) instead of silent failures

---

## Architecture at a Glance

```
Frontend (React + TypeScript + Vite)
    |
    |  REST API (fetch)
    v
Gateway (NestJS) — optional proxy layer
    |
    v
AI Service (FastAPI + Python)
    |
    +-- Agent ---- classify intent (ESCALATE / CLARIFY / ANSWER)
    |
    +-- Chain ---- build prompt + call LLM (Gemini / Claude / OpenAI)
    |
    +-- Retriever - embed query + search ChromaDB + format context
    |
    +-- Ingest --- load PDFs + chunk + embed + store in ChromaDB
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend Gateway | NestJS |
| AI Service | FastAPI, LangChain, LangGraph |
| LLM Providers | OpenAI, Anthropic, Google Gemini |
| Vector Database | ChromaDB |
| Embeddings | Sentence-Transformers (all-MiniLM-L6-v2) |
| Document Processing | PyPDF, RecursiveCharacterTextSplitter |
| Voice | Web Speech API (browser-native) |

---

## Why This Matters

This project is not a wrapper around an LLM API. It solves a domain-specific problem (healthcare information retrieval) with:

- **Safety constraints** that a generic chatbot does not have (emergency detection, no diagnosis, source grounding)
- **Architectural decisions** that reflect production thinking (agent routing, multi-provider fallback, content-derived IDs)
- **Security practices** applied throughout (XSS-safe rendering, path traversal protection, endpoint auth)
- **Full ownership** of every layer — from PDF ingestion and vector search to React UI and voice interaction

It demonstrates the ability to design, build, and secure an AI-powered application end-to-end.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Product Requirements](01-PRD.md) | Features, user stories, and acceptance criteria |
| [Architecture](02-Architecture-Document.md) | System architecture and component design |
| [API Documentation](03-API-Documentation.md) | Endpoints, request/response formats |
| [User Guide](04-User-Guide.md) | End-user guide for using the chatbot |
| [Setup & Deployment](05-Setup-and-Deployment-Guide.md) | Installation, configuration, and deployment |
| [Technical Design](06-Technical-Design-Document.md) | Technical design decisions and data flows |
| [Testing Strategy](07-Testing-Strategy.md) | Test plan and quality assurance approach |
