from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.slm import ChatRequest, ChatResponse, SLMInfoResponse
from app.services.slm_service import process_chat_message
from app.services.price_service import PriceService

router = APIRouter(prefix="/slm", tags=["SLM AI Assistant"])


@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """Send a message to the SLM AI assistant and get a contextual response."""
    current_price = PriceService.get_latest_price_from_db(db)

    history = None
    if request.conversation_history:
        history = [msg.model_dump() for msg in request.conversation_history]

    result = process_chat_message(
        db=db,
        message=request.message,
        current_price=current_price,
        conversation_history=history,
    )
    return ChatResponse(**result)


@router.get("/info", response_model=SLMInfoResponse)
async def get_model_info():
    """Get information about the SLM model."""
    return SLMInfoResponse(
        model_name="GoldSLM-v1",
        model_type="Rule-based / Pattern Matching",
        version="1.0.0-poc",
        capabilities=[
            "Portfolio analysis and summarization",
            "Risk assessment and alerts review",
            "Gold price analysis and commentary",
            "Trade recommendations based on positions",
            "Logistics and inventory status",
            "Alert and limit breach monitoring",
        ],
        description=(
            "A proof-of-concept Small Language Model that demonstrates "
            "AI-assisted gold trading analysis. This POC uses rule-based "
            "intent classification and template-driven response generation "
            "with real-time portfolio data context. In production, this would "
            "be replaced with a fine-tuned SLM (e.g., Phi-2, TinyLlama) or "
            "connected to an LLM API."
        ),
    )
