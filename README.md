# MedAssist AI

An AI-powered healthcare information assistant that answers patient health questions using trusted medical sources — with both text and voice interaction.

MedAssist AI retrieves information from public medical guidelines (NHS, WHO, CDC), generates clear and cited responses, and ensures patient safety through built-in guardrails. It is designed for patients seeking quick health information, and healthcare support teams handling repetitive FAQs.

<img width="1808" height="1700" alt="image" src="https://github.com/user-attachments/assets/e60f60a3-033c-4e12-a7e6-97c6a99b1ca5" />

---

## What It Does

**Ask a health question. Get a cited, trustworthy answer.**

- Type or speak your health question
- MedAssist searches through verified medical documents to find relevant information
- You receive a clear answer with source citations (e.g., *"According to Diabetes-Overview.pdf, page 3..."*)
- Listen to the response read aloud via text-to-speech

MedAssist AI does not diagnose, prescribe, or replace professional medical advice. Every response is grounded in uploaded medical documents and includes a disclaimer.

---

## Key Features

### Cited, Source-Grounded Answers
Every response references the exact document and page it came from. No hallucinated medical information — answers are strictly based on the uploaded knowledge base.

### Voice Interaction
- **Voice input** — tap the microphone and speak your question
- **Voice output** — tap the speaker icon on any response to hear it read aloud
- Works with browser-native speech APIs; no external services required

### Emergency Detection
Detects urgent symptoms like chest pain, difficulty breathing, or choking, and immediately directs users to call emergency services instead of attempting to answer.

### Smart Clarification
When a question is too vague (e.g., "Tell me about diabetes"), MedAssist asks a follow-up question to give you a more relevant answer.

### Conversational Context
Remembers what you discussed earlier in the session, so follow-up questions like "What about the side effects?" work naturally.

### Knowledge Base
Ships with medical guides covering:
- Cold and Flu
- Diabetes
- First Aid
- Hypertension
- Mental Health

Additional PDFs can be uploaded to expand the knowledge base at any time.

---

## How It Works

```
You ask a question (text or voice)
        |
        v
  Is it an emergency?
   /            \
  Yes            No
   |              |
 "Call 911"    Is it vague?
              /        \
            Yes         No
             |           |
      "Can you clarify?"  Search medical documents
                              |
                          Generate cited answer
                              |
                        Display + read aloud
```

The system uses **Retrieval-Augmented Generation (RAG)** — your question is matched against medical document chunks stored in a vector database, and the most relevant passages are used to generate an accurate, grounded response.

---

## Safety & Compliance

| Guardrail | Description |
|-----------|-------------|
| Source grounding | Answers only from uploaded medical documents |
| No diagnosis | Never diagnoses conditions or prescribes treatment |
| Emergency escalation | Detects 25+ emergency keywords and redirects to emergency services |
| Disclaimers | Every response includes an educational-purposes-only notice |
| Citation transparency | Users can see exactly which document and page informed each answer |

---

## What This Project Demonstrates

- **RAG pipeline from scratch** — PDF ingestion, chunking, vector search, and cited LLM responses
- **Agentic routing** — intent classification (escalate / clarify / answer) before LLM calls
- **Multi-LLM support** — Gemini, Claude, and OpenAI with automatic fallback
- **Voice interaction** — browser-native speech-to-text and text-to-speech, no external services
- **Security practices** — XSS-safe rendering, path traversal protection, endpoint authentication
- **Production patterns** — health monitoring with exponential backoff, content-derived document IDs, telemetry control

For the full breakdown, see the [Project Overview](product-documents/00-Project-Overview.md).


---

## Documentation

| Document | Description |
|----------|-------------|
| [Project Overview](product-documents/00-Project-Overview.md) | What this project is, what it demonstrates, and why it matters |
| [Product Requirements](product-documents/01-PRD.md) | Full PRD with features, user stories, and acceptance criteria |
| [Architecture](product-documents/02-Architecture-Document.md) | System architecture and component design |
| [API Documentation](product-documents/03-API-Documentation.md) | API endpoints, request/response formats |
| [User Guide](product-documents/04-User-Guide.md) | End-user guide for using the chatbot |
| [Setup & Deployment](product-documents/05-Setup-and-Deployment-Guide.md) | Installation, configuration, and deployment |
| [Technical Design](product-documents/06-Technical-Design-Document.md) | Technical design decisions and data flows |
| [Testing Strategy](product-documents/07-Testing-Strategy.md) | Test plan and quality assurance approach |

---

## Built With

React, TypeScript, NestJS, FastAPI, LangChain, ChromaDB, and Sentence-Transformers.

---

*Built by Ankita Dodamani*
