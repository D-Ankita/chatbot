"""
LLM Chain module for MedAssist AI.

Constructs the prompt with retrieved context and conversation history,
sends it to the LLM, and returns the generated response.
"""

from __future__ import annotations

from typing import List, Optional

from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import HumanMessage, AIMessage, SystemMessage

from config import OPENAI_API_KEY, get_system_prompt
from retriever import MedAssistRetriever, RetrievedChunk


class MedAssistChain:
    """Orchestrates the RAG query pipeline: retrieve → prompt → LLM → response."""

    def __init__(self):
        self.retriever = MedAssistRetriever()
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.3,
            api_key=OPENAI_API_KEY,
            max_tokens=1024,
        )
        self.system_prompt_template = get_system_prompt()

    def build_prompt(
        self,
        question: str,
        context: str,
        chat_history: Optional[List[dict]] = None,
    ) -> list:
        """
        Build the message list for the LLM.

        Args:
            question: The user's current question
            context: Formatted context from retrieved documents
            chat_history: List of previous messages [{"role": "user"|"assistant", "content": "..."}]

        Returns:
            List of LangChain message objects
        """
        # Format chat history
        history_str = ""
        if chat_history:
            for msg in chat_history[-6:]:  # Keep last 6 messages for context
                role = "Patient" if msg["role"] == "user" else "MedAssist"
                history_str += f"{role}: {msg['content']}\n"

        # Fill the system prompt template
        system_content = self.system_prompt_template.format(
            context=context,
            chat_history=history_str or "No previous conversation.",
            question=question,
        )

        messages = [
            SystemMessage(content=system_content),
            HumanMessage(content=question),
        ]

        return messages

    def query(
        self,
        question: str,
        chat_history: Optional[List[dict]] = None,
    ) -> dict:
        """
        Run the full RAG pipeline for a user question.

        Args:
            question: The user's question
            chat_history: Previous conversation messages

        Returns:
            Dict with answer, sources, and retrieved chunks info
        """
        # Step 1: Retrieve relevant chunks
        chunks = self.retriever.retrieve(question)

        # Step 2: Format context
        context = self.retriever.format_context(chunks)

        # Step 3: Build prompt
        messages = self.build_prompt(question, context, chat_history)

        # Step 4: Get LLM response
        response = self.llm.invoke(messages)

        # Step 5: Extract source citations
        sources = self._extract_sources(chunks)

        return {
            "answer": response.content,
            "sources": sources,
            "chunks_retrieved": len(chunks),
            "relevance_scores": [c.relevance_score for c in chunks],
        }

    def _extract_sources(self, chunks: List[RetrievedChunk]) -> List[dict]:
        """Extract unique source documents from retrieved chunks."""
        seen = set()
        sources = []
        for chunk in chunks:
            source_key = f"{chunk.source}_{chunk.page}"
            if source_key not in seen:
                seen.add(source_key)
                source_name = (
                    chunk.source.split("/")[-1]
                    if "/" in chunk.source
                    else chunk.source
                )
                sources.append(
                    {
                        "document": source_name,
                        "page": chunk.page + 1,
                        "relevance": chunk.relevance_score,
                    }
                )
        return sources
