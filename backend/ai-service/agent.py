"""
Agentic Routing Layer for MedAssist AI.

Implements a decision-making agent that routes user queries into one of three paths:
1. ANSWER - Answer from medical knowledge base (RAG pipeline)
2. CLARIFY - Ask a clarifying question when the query is ambiguous
3. ESCALATE - Flag emergency symptoms and direct to emergency services
"""

from __future__ import annotations

import re
from typing import List, Optional

from chain import MedAssistChain


# Emergency keywords that should trigger immediate escalation
EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "can't breathe", "cannot breathe",
    "difficulty breathing", "shortness of breath", "choking",
    "severe bleeding", "hemorrhage", "unconscious", "unresponsive",
    "seizure", "convulsion", "stroke", "anaphylaxis", "allergic reaction",
    "overdose", "poisoning", "suicidal", "suicide", "self-harm",
    "severe burn", "head injury", "broken bone", "fracture",
    "loss of consciousness", "fainting", "collapsed",
]

# Patterns that suggest the query needs clarification
AMBIGUOUS_PATTERNS = [
    r"^(what|tell me) about .{3,10}$",  # Very short, vague queries
    r"^(it|this|that|the thing)\b",      # Pronoun-heavy without context
    r"\bor\b.*\bor\b",                   # Multiple options suggesting uncertainty
]

ESCALATION_RESPONSE = (
    "⚠️ **This sounds like it could be a medical emergency.**\n\n"
    "Please take immediate action:\n"
    "- **Call emergency services:** 911 (US), 999 (UK), 112 (EU)\n"
    "- Go to your nearest emergency room\n"
    "- If someone is with you, ask them to help while you call\n\n"
    "Do not wait — getting professional help quickly is critical."
)


class MedAssistAgent:
    """
    Agent that decides how to handle each user query.

    Routes to one of three paths:
    - ANSWER: Use RAG pipeline to answer from medical docs
    - CLARIFY: Ask the user to provide more details
    - ESCALATE: Direct to emergency services
    """

    def __init__(self):
        self.chain = MedAssistChain()

    def classify_intent(self, query: str) -> str:
        """
        Classify the user's query intent.

        Args:
            query: The user's message

        Returns:
            One of: "ESCALATE", "CLARIFY", "ANSWER"
        """
        query_lower = query.lower().strip()

        # Check for emergency keywords first (highest priority)
        for keyword in EMERGENCY_KEYWORDS:
            if keyword in query_lower:
                return "ESCALATE"

        # Check for ambiguous queries (only if no chat history context)
        if len(query_lower.split()) < 3:
            return "CLARIFY"

        for pattern in AMBIGUOUS_PATTERNS:
            if re.search(pattern, query_lower):
                return "CLARIFY"

        # Default: answer from knowledge base
        return "ANSWER"

    def generate_clarification(self, query: str) -> str:
        """Generate a clarifying question for ambiguous queries."""
        query_lower = query.lower().strip()

        # Common ambiguous topics that need specificity
        clarifications = {
            "diabetes": "Could you clarify — are you asking about Type 1 diabetes, Type 2 diabetes, or gestational diabetes? This will help me find the most relevant information.",
            "pain": "I'd like to help! Could you describe where you're experiencing pain and how long it's been going on? This will help me find relevant information.",
            "medication": "Could you specify which medication you're asking about? Or are you looking for general information about a type of medication?",
            "vaccine": "Are you asking about a specific vaccine (e.g., COVID-19, flu, HPV), or would you like general information about vaccinations?",
            "cancer": "Cancer is a broad topic. Could you specify which type of cancer you'd like to learn about, or what aspect (symptoms, screening, treatment options)?",
        }

        for keyword, clarification in clarifications.items():
            if keyword in query_lower:
                return clarification

        return (
            f"I'd like to help with your question about \"{query}\", but I need "
            f"a bit more detail to find the best information. Could you provide "
            f"more specifics about what you'd like to know?"
        )

    def process_query(
        self,
        query: str,
        chat_history: Optional[List[dict]] = None,
    ) -> dict:
        """
        Process a user query through the agent pipeline.

        Args:
            query: The user's question
            chat_history: Previous conversation messages

        Returns:
            Dict with response data including intent, answer, and sources
        """
        # Step 1: Classify intent
        intent = self.classify_intent(query)

        # Step 2: Route based on intent
        if intent == "ESCALATE":
            return {
                "intent": "ESCALATE",
                "answer": ESCALATION_RESPONSE,
                "sources": [],
                "chunks_retrieved": 0,
                "relevance_scores": [],
            }

        if intent == "CLARIFY" and not chat_history:
            # Only ask for clarification if there's no conversation context
            return {
                "intent": "CLARIFY",
                "answer": self.generate_clarification(query),
                "sources": [],
                "chunks_retrieved": 0,
                "relevance_scores": [],
            }

        # ANSWER: Run the full RAG pipeline
        result = self.chain.query(query, chat_history)
        result["intent"] = "ANSWER"

        return result
