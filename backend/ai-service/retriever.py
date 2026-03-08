"""
Retriever module for MedAssist AI.

Handles query embedding and similarity search against the ChromaDB vector store.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import chromadb
from chromadb.config import Settings
from langchain_huggingface import HuggingFaceEmbeddings

from config import (
    CHROMA_PERSIST_DIR,
    CHROMA_COLLECTION_NAME,
    EMBEDDING_MODEL,
    TOP_K_RESULTS,
)


@dataclass
class RetrievedChunk:
    """A retrieved document chunk with metadata."""
    content: str
    source: str
    page: int
    relevance_score: float


class MedAssistRetriever:
    """Retrieves relevant document chunks from ChromaDB based on user queries."""

    def __init__(self):
        self._embedding_fn = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        self._client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )

    def retrieve(self, query: str, top_k: Optional[int] = None) -> List[RetrievedChunk]:
        """
        Retrieve the most relevant document chunks for a given query.

        Args:
            query: The user's question
            top_k: Number of results to return (defaults to config TOP_K_RESULTS)

        Returns:
            List of RetrievedChunk objects sorted by relevance
        """
        k = top_k or TOP_K_RESULTS

        # Embed the query
        query_embedding = self._embedding_fn.embed_query(query)

        # Search ChromaDB
        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            include=["documents", "metadatas", "distances"],
        )

        # Parse results into RetrievedChunk objects
        chunks = []
        if results["documents"] and results["documents"][0]:
            for i, doc in enumerate(results["documents"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0

                # Convert cosine distance to similarity score (1 - distance)
                similarity = 1 - distance

                chunks.append(
                    RetrievedChunk(
                        content=doc,
                        source=metadata.get("source", "unknown"),
                        page=metadata.get("page", 0),
                        relevance_score=round(similarity, 4),
                    )
                )

        return chunks

    def format_context(self, chunks: List[RetrievedChunk]) -> str:
        """Format retrieved chunks into a context string for the LLM prompt."""
        if not chunks:
            return "No relevant documents found in the knowledge base."

        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source_name = chunk.source.split("/")[-1] if "/" in chunk.source else chunk.source
            context_parts.append(
                f"[Source {i}: {source_name}, Page {chunk.page + 1}]\n{chunk.content}"
            )

        return "\n\n---\n\n".join(context_parts)

    @property
    def document_count(self) -> int:
        """Return the number of documents in the collection."""
        return self._collection.count()
