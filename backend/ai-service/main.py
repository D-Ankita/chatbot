"""
MedAssist AI - FastAPI Application

Healthcare FAQ chatbot with RAG pipeline, agentic routing,
and voice interaction support.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import HOST, PORT
from agent import MedAssistAgent
from ingest import ingest_pdfs


# --- Pydantic Models ---

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class QueryRequest(BaseModel):
    question: str
    chat_history: List[ChatMessage] = []


class QueryResponse(BaseModel):
    intent: str
    answer: str
    sources: List[dict] = []
    chunks_retrieved: int = 0
    relevance_scores: List[float] = []


class IngestResponse(BaseModel):
    status: str
    message: str
    files_processed: int = 0
    total_pages: int = 0
    total_chunks: int = 0


class HealthResponse(BaseModel):
    status: str
    service: str
    documents_indexed: int


# --- Application ---

agent: Optional[MedAssistAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize the agent on startup."""
    global agent
    print("🏥 Starting MedAssist AI service...")
    agent = MedAssistAgent()
    doc_count = agent.chain.retriever.document_count
    print(f"✅ Agent ready. {doc_count} document chunks indexed.")
    yield
    print("👋 Shutting down MedAssist AI service.")


app = FastAPI(
    title="MedAssist AI",
    description="Healthcare FAQ chatbot with RAG pipeline and agentic routing",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints ---

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Check if the service is running and return index stats."""
    if agent is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    return HealthResponse(
        status="healthy",
        service="MedAssist AI",
        documents_indexed=agent.chain.retriever.document_count,
    )


@app.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    """
    Process a user query through the MedAssist agent.

    The agent will:
    - ESCALATE if it detects emergency symptoms
    - CLARIFY if the query is ambiguous
    - ANSWER using RAG pipeline for medical questions
    """
    if agent is None:
        raise HTTPException(status_code=503, detail="Service not initialized")

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Convert chat history to dict format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.chat_history
        ]

        result = agent.process_query(request.question, history)

        return QueryResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.post("/ingest", response_model=IngestResponse)
async def ingest_documents():
    """
    Ingest all PDF documents from the knowledge_base/ directory.

    This will:
    1. Load all PDFs
    2. Split them into chunks
    3. Generate embeddings
    4. Store in ChromaDB
    """
    try:
        result = ingest_pdfs()

        if result["status"] == "error":
            return IngestResponse(
                status="error",
                message=result.get("message", "Ingestion failed"),
            )

        return IngestResponse(
            status="success",
            message="Documents ingested successfully",
            files_processed=result["files_processed"],
            total_pages=result["total_pages"],
            total_chunks=result["total_chunks"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion error: {str(e)}")


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF document to the knowledge base and ingest it."""
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        from config import KNOWLEDGE_BASE_DIR
        import shutil

        # Save uploaded file
        file_path = KNOWLEDGE_BASE_DIR / file.filename
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

        # Ingest the uploaded file
        result = ingest_pdfs(str(file_path))

        return {
            "status": "success",
            "message": f"Uploaded and ingested {file.filename}",
            "details": result,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=int(PORT), reload=True)
