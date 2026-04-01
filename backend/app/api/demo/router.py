from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from groq import Groq
from app.core.config import settings
from app.core.logging import get_logger
from app.ml_model.model_loader import get_model_and_tokenizer

router = APIRouter(prefix="/demo", tags=["Demo"])
logger = get_logger(__name__)

model, tokenizer = get_model_and_tokenizer()

LANGUAGE_MAP = {
    "hindi": "Hindi",
    "marathi": "Marathi",
    "gujarati": "Gujarati",
    "punjabi": "Punjabi",
    "english": "English"
}

TONE_PROMPTS = {
    "professional": "professional and courteous",
    "empathetic": "empathetic and understanding",
    "formal": "formal and respectful",
    "friendly": "friendly and warm"
}

class DemoChatRequest(BaseModel):
    customer_message: str
    language: str = "hindi"
    tone: str = "professional"

class DemoChatResponse(BaseModel):
    original_message: str
    groq_response: str
    tone_standardized: str
    final_response: str
    quality_score: float
    detected_language: str
    applied_tone: str
    escalated: bool = False
    escalation_reason: Optional[str] = None
    pipeline_steps: list

@router.post("/chat", response_model=DemoChatResponse)
async def demo_chat(data: DemoChatRequest):
    pipeline_steps = []
    customer_message = data.customer_message
    language = data.language.lower()
    tone = data.tone.lower()

    # ─── Step 1: Groq AI ──────────────────────────────
    pipeline_steps.append({
        "step": "Groq AI",
        "status": "processing",
        "detail": "Generating response..."
    })

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        target_lang = LANGUAGE_MAP.get(language, "Hindi")
        tone_desc = TONE_PROMPTS.get(tone, "professional and courteous")

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a multilingual customer support agent for Indian businesses. "
                        f"Customers may write in Hindi, Marathi, Gujarati, Punjabi or Hinglish. "
                        f"Always respond in English only. Be {tone_desc}. "
                        f"Be {tone_desc} in your response. "
                        f"If you can answer confidently start with CONFIDENT: followed by your response. "
                        f"If you cannot answer or need account-specific info start with "
                        f"ESCALATE: followed by the reason."
                    )
                },
                {"role": "user", "content": customer_message}
            ]
        )
        groq_result = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq error in demo: {str(e)}")
        groq_result = "ESCALATE: AI service temporarily unavailable"

    # ─── Step 2: Parse Groq Result ────────────────────
    escalated = False
    escalation_reason = None

    if groq_result.startswith("ESCALATE:"):
        escalated = True
        escalation_reason = groq_result.replace("ESCALATE:", "").strip()
        groq_response = escalation_reason
    else:
        groq_response = groq_result.replace("CONFIDENT:", "").strip()

    pipeline_steps.append({
        "step": "Groq AI",
        "status": "done",
        "detail": "ESCALATE" if escalated else "CONFIDENT response generated"
    })

    if escalated:
        return DemoChatResponse(
            original_message=customer_message,
            groq_response=groq_response,
            tone_standardized="",
            final_response="",
            quality_score=0,
            detected_language=language,
            applied_tone=tone,
            escalated=True,
            escalation_reason=escalation_reason,
            pipeline_steps=pipeline_steps
        )

    # ─── Step 3: Tone Standardization ─────────────────
    pipeline_steps.append({
        "step": "Tone Standardization",
        "status": "processing",
        "detail": f"Applying {tone} tone via T5..."
    })

    try:
        prompt = f"make this response {tone} and professional: {groq_response.strip()}"
        inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True, max_length=512)
        outputs = model.generate(input_ids=inputs["input_ids"], attention_mask=inputs["attention_mask"], max_length=200, num_beams=4, early_stopping=True)
        tone_standardized = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
        if len(tone_standardized) < 5:
            tone_standardized = groq_response
    except Exception as e:
        logger.error(f"T5 tone error: {str(e)}")
        tone_standardized = groq_response

    pipeline_steps.append({
        "step": "Tone Standardization",
        "status": "done",
        "detail": f"{tone.capitalize()} tone applied"
    })

    # ─── Step 4: Translation ─────────────────────────
    pipeline_steps.append({
        "step": "Translation",
        "status": "processing",
        "detail": f"Translating to {LANGUAGE_MAP.get(language, language)}..."
    })

    try:
        if language == "english":
            final_response = tone_standardized
        else:
            lang_instructions = {
                "hindi": "Translate to casual conversational Hindi mixed with some English words (Hinglish). Like how Indians actually speak — not textbook Hindi. Example: 'Aapka order 24 hours mein deliver ho jayega, don't worry!' Return only the translated text.",
                "marathi": "Translate to casual conversational Marathi mixed with some English words. Like how Pune/Mumbai people actually speak — not textbook Marathi. Return only the translated text.",
                "gujarati": "Translate to casual conversational Gujarati mixed with some English words. Like how Gujaratis actually speak in daily life — not textbook Gujarati. Return only the translated text.",
                "punjabi": "Translate to casual conversational Punjabi mixed with some English words. Like how Punjabis actually speak — not textbook Punjabi. Return only the translated text.",
            }
            instruction = lang_instructions.get(
                language,
                f"Translate to {LANGUAGE_MAP.get(language, language)}. Return only the translated text."
            )
            trans_response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": instruction},
                    {"role": "user", "content": tone_standardized}
                ]
            )
            final_response = trans_response.choices[0].message.content.strip()
            if len(final_response) < 5:
                final_response = tone_standardized
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        final_response = tone_standardized

    # ─── Step 5: Quality Score ────────────────────────
    pipeline_steps.append({
        "step": "Quality Score",
        "status": "processing",
        "detail": "Computing quality score..."
    })

    score = 0.0
    if final_response and len(final_response.strip()) > 10:
        score += 40.0
    word_count = len(final_response.split()) if final_response else 0
    if 10 <= word_count <= 200:
        score += 30.0
    elif word_count > 0:
        score += 15.0
    if final_response and len(final_response.strip()) > 0:
        score += 30.0
    quality_score = round(score, 2)

    pipeline_steps.append({
        "step": "Quality Score",
        "status": "done",
        "detail": f"Score: {quality_score}/100"
    })

    return DemoChatResponse(
        original_message=customer_message,
        groq_response=groq_response,
        tone_standardized=tone_standardized,
        final_response=final_response,
        quality_score=quality_score,
        detected_language=language,
        applied_tone=tone,
        escalated=False,
        pipeline_steps=pipeline_steps
    )