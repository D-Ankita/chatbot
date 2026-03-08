"""
Document Ingestion Pipeline for MedAssist AI.

Loads medical PDFs, splits them into chunks, generates embeddings,
and stores them in ChromaDB for retrieval.

Usage:
    python ingest.py                     # Ingest all PDFs from knowledge_base/
    python ingest.py --path /path/to.pdf # Ingest a specific PDF
"""

from __future__ import annotations

import argparse
import hashlib
import sys
from pathlib import Path
from typing import Optional

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
import chromadb
from chromadb.config import Settings

from config import (
    KNOWLEDGE_BASE_DIR,
    CHROMA_PERSIST_DIR,
    CHROMA_COLLECTION_NAME,
    EMBEDDING_MODEL,
    CHUNK_SIZE,
    CHUNK_OVERLAP,
)


def load_pdf(file_path: str) -> list:
    """Load a PDF file and return a list of document pages."""
    print(f"📄 Loading PDF: {file_path}")
    loader = PyPDFLoader(file_path)
    pages = loader.load()
    print(f"   Loaded {len(pages)} pages")
    return pages


def chunk_documents(documents: list) -> list:
    """Split documents into smaller chunks for embedding."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = text_splitter.split_documents(documents)
    print(f"🔪 Split into {len(chunks)} chunks (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    return chunks


def get_embedding_function():
    """Create and return the embedding function."""
    print(f"🧠 Loading embedding model: {EMBEDDING_MODEL}")
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )


def store_in_chromadb(chunks: list, embedding_fn) -> None:
    """Store document chunks with embeddings in ChromaDB."""
    print(f"💾 Storing in ChromaDB at: {CHROMA_PERSIST_DIR}")

    client = chromadb.PersistentClient(
        path=CHROMA_PERSIST_DIR,
        settings=Settings(anonymized_telemetry=False),
    )
    collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    # Process chunks in batches
    batch_size = 50
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]

        ids = [
            hashlib.md5(
                f"{chunk.metadata.get('source', 'unknown')}_{chunk.metadata.get('page', 0)}_{i + j}".encode()
            ).hexdigest()
            for j, chunk in enumerate(batch)
        ]
        documents = [chunk.page_content for chunk in batch]
        metadatas = [
            {
                "source": chunk.metadata.get("source", "unknown"),
                "page": chunk.metadata.get("page", 0),
            }
            for chunk in batch
        ]

        # Generate embeddings
        embeddings = embedding_fn.embed_documents(documents)

        collection.upsert(
            ids=ids,
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
        )
        print(f"   Stored batch {i // batch_size + 1} ({len(batch)} chunks)")

    print(f"✅ Total documents in collection: {collection.count()}")


def ingest_pdfs(pdf_path: Optional[str] = None) -> dict:
    """
    Main ingestion pipeline.

    Args:
        pdf_path: Path to a specific PDF, or None to ingest all PDFs in knowledge_base/

    Returns:
        Summary dict with ingestion stats
    """
    # Collect PDF files
    if pdf_path:
        pdf_files = [Path(pdf_path)]
    else:
        pdf_files = list(KNOWLEDGE_BASE_DIR.glob("*.pdf"))

    if not pdf_files:
        print("⚠️  No PDF files found!")
        return {"status": "error", "message": "No PDF files found"}

    print(f"\n{'='*60}")
    print(f"🏥 MedAssist AI - Document Ingestion Pipeline")
    print(f"{'='*60}")
    print(f"📂 Found {len(pdf_files)} PDF file(s)\n")

    # Load all PDFs
    all_documents = []
    for pdf_file in pdf_files:
        try:
            docs = load_pdf(str(pdf_file))
            all_documents.extend(docs)
        except Exception as e:
            print(f"❌ Error loading {pdf_file}: {e}")
            continue

    if not all_documents:
        return {"status": "error", "message": "No documents loaded successfully"}

    # Chunk documents
    chunks = chunk_documents(all_documents)

    # Create embeddings and store
    embedding_fn = get_embedding_function()
    store_in_chromadb(chunks, embedding_fn)

    summary = {
        "status": "success",
        "files_processed": len(pdf_files),
        "total_pages": len(all_documents),
        "total_chunks": len(chunks),
    }

    print(f"\n{'='*60}")
    print(f"✅ Ingestion complete!")
    print(f"   Files: {summary['files_processed']}")
    print(f"   Pages: {summary['total_pages']}")
    print(f"   Chunks: {summary['total_chunks']}")
    print(f"{'='*60}\n")

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest medical PDFs into MedAssist knowledge base")
    parser.add_argument("--path", type=str, help="Path to a specific PDF file to ingest")
    args = parser.parse_args()

    result = ingest_pdfs(args.path)
    if result["status"] == "error":
        sys.exit(1)
