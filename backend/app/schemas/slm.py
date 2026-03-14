from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    response: str
    intent: str
    confidence: float
    model: str
    suggestions: List[str]
    timestamp: str
    context_used: Dict[str, Any]


class SLMInfoResponse(BaseModel):
    model_name: str
    model_type: str
    version: str
    capabilities: List[str]
    description: str
