from typing import Optional, List
from app.repositories.conversation import ConversationRepository
from app.repositories.message import MessageRepository
from app.repositories.representative import RepresentativeRepository
from app.repositories.company import CompanyRepository
from app.models.user import Conversation, Message
from app.schemas.conversation import (
    ConversationCreateRequest,
    ConversationSchema,
    MessageSchema,
    MessageCreateRequest,
    RepresentativeMessageRequest
)
from app.core.enums import (
    ConversationStatus,
    ComplaintTopic,
    SupportedLanguage,
    ToneType
)
from app.core.logging import get_logger
from app.core.exceptions import NotFoundException
from app.ml_model.model_loader import get_model_and_tokenizer
from app.core.config import settings
import torch
from datetime import datetime

logger = get_logger(__name__)

# Load T5 model once at startup
model, tokenizer = get_model_and_tokenizer()


# Closing phrases across Indian languages
CLOSING_PHRASES = [
    "thank you", "thanks", "ok", "okay", "done",
    "great", "perfect", "got it", "understood",
    "shukriya", "dhanyawad", "theek hai", "theek he",
    "acha", "accha", "bahut acha", "bilkul",
    "dhanyavaad", "shukriyaa", "bas", "ho gaya",
    "samajh gaya", "samajh gayi", "thik aahe",
    "dhanyawaad", "chhan", "mast",
    "ok bhai", "theek hai bhai", "thanks bhai",
    "ho jayega", "kar dena", "ok che", "fine che",
    "ho ja", "bol na", "done che"
]

ANGRY_PHRASES = [
    "bakwaas", "bekar", "worst", "pathetic", "fraud",
    "cheat", "waste", "stupid", "bezzati", "pagal",
    "bewakoof", "ganda", "faltu", "bekaar", "ghatiya",
    "kya hai ye", "kaam nahi karta", "bura", "gussa",
    "naraaz", "tang", "pareshan", "bahut bura"
]

CONFUSED_PHRASES = [
    "samajh nahi", "kya matlab", "kaise", "kyun nahi",
    "pata nahi", "confuse", "clear nahi", "bata do",
    "samjha do", "explain", "kya hua", "kyare", "kem"
]

class ConversationService:
    def __init__(
        self,
        conversation_repository: ConversationRepository,
        message_repository: MessageRepository,
        representative_repository: RepresentativeRepository,
        company_repository: CompanyRepository
    ):
        self.conversation_repository = conversation_repository
        self.message_repository = message_repository
        self.representative_repository = representative_repository
        self.company_repository = company_repository

    # ─── Conversation Management ──────────────────────────

    async def create_conversation(
        self,
        company_id: str,
        data: ConversationCreateRequest
    ) -> ConversationSchema:
        conversation = Conversation(
            companyId=company_id,
            customer_name=data.customer_name,
            customer_email=data.customer_email,
            customer_language=data.customer_language
        )
        created = await self.conversation_repository.create(
            conversation
        )
        logger.info(
            f"Conversation created: {created.conversationId}"
        )
        return ConversationSchema(**created.model_dump())
    

    async def get_conversation(
        self, conversation_id: str
    ) -> Optional[ConversationSchema]:
        conversation = await self.conversation_repository.find_by_id(
            conversation_id
        )
        if not conversation:
            raise NotFoundException(
                message="Conversation not found",
                details={"conversation_id": conversation_id}
            )
        return ConversationSchema(**conversation.model_dump())

    async def get_company_conversations(
        self, company_id: str
    ) -> List[ConversationSchema]:
        conversations = await (
            self.conversation_repository.find_by_company_id(company_id)
        )
        return [
            ConversationSchema(**c.model_dump())
            for c in conversations
        ]

    async def close_conversation(
        self,
        conversation_id: str,
        company_id: str
    ) -> ConversationSchema:
        # Generate T5 summary of full conversation
        messages = await self.message_repository.find_by_conversation_id(
            conversation_id
        )
        conversation_text = " ".join([
            f"Agent: {m.processed_text}"
            for m in messages if m.processed_text
        ])
        summary = self._generate_summary(conversation_text)

        # Close conversation in MongoDB
        closed = await self.conversation_repository.update_status(
            conversation_id,
            ConversationStatus.CLOSED,
            summary=summary
        )
        logger.info(f"Conversation closed: {conversation_id}")
        return ConversationSchema(**closed.model_dump())

    # ─── ML Pipeline (Full ai)──────────────────────────────────────
    #  here it detect and classify the complaint of customer what ther are complainig about
    # ask groq for reply if grop say ESCALATE then representative will be called and 
    # if it says CONFIDENT then run through our model 
    # detect of they r saying bye and save to mongodb convo, update convo score

    async def process_customer_message(
        self,
        conversation_id: str,
        company_id: str,
        data: MessageCreateRequest
    ) -> MessageSchema:
        # Get company settings
        company = await self.company_repository.find_by_user_id(
            company_id
        )
        if not company:
            raise NotFoundException(
                message="Company not found",
                details={"company_id": company_id}
            )

        customer_message = data.customer_message

        # Step 1 - detect if closing message
        is_closing = self._detect_closing_message(customer_message)

        # Step 2 - classify complaint topic
        complaint_topic = self._classify_topic(customer_message)

        # Step 3 - try Groq AI first
        groq_response, escalate, escalation_reason = (
            await self._get_ai_response(customer_message, company)
        )

        if escalate:
            # Groq couldn't handle it - escalate to representative
            await self.conversation_repository.update_status(
                conversation_id,
                ConversationStatus.OPEN
            )
            await self.conversation_repository.collection.update_one(
                {"conversationId": conversation_id},
                {
                    "$set": {
                        "escalated": True,
                        "escalation_reason": escalation_reason
                    }
                }
            )
            # Save escalation message to MongoDB
            message = Message(
                conversationId=conversation_id,
                companyId=company_id,
                original_text=customer_message,
                handled_by="escalated",
                complaint_topic=complaint_topic,
                is_closing_message=is_closing
            )
            await self.message_repository.create(message)
            return MessageSchema(**message.model_dump())

        # Step 4 - process through ML pipeline
        detected_tone = self._detect_sentiment(customer_message)
        effective_tone = detected_tone or company.default_tone

        from app.core.enums import SupportedLanguage
        # Map customer language string to SupportedLanguage enum
        lang_map = {
            "english": SupportedLanguage.ENGLISH,
            "hindi": SupportedLanguage.HINDI,
            "marathi": SupportedLanguage.MARATHI,
            "gujarati": SupportedLanguage.GUJARATI,
            "punjabi": SupportedLanguage.PUNJABI
        }
        customer_lang_enum = lang_map.get(
            data.customer_language.lower(), 
            SupportedLanguage.ENGLISH
        )

        processed_text = await self._run_ml_pipeline(
            groq_response,
            effective_tone,
            customer_lang_enum  # use customer language, not company output language
        )

        # Step 5 - compute quality score
        quality_score = self._compute_quality_score(
            groq_response,
            processed_text,
            company.default_tone,
            company.output_language
        )

        # Step 6 - save message to MongoDB
        message = Message(
            conversationId=conversation_id,
            companyId=company_id,
            original_text=customer_message,
            processed_text=processed_text,
            output_language=company.output_language,
            applied_tone=company.default_tone,
            quality_score=quality_score,
            complaint_topic=complaint_topic,
            is_closing_message=is_closing,
            handled_by="ai",
            approved=True
        )
        saved_message = await self.message_repository.create(message)

        # Step 7 - update conversation quality score
        await self.conversation_repository.update_quality_score(
            conversation_id, quality_score
        )

        logger.info(
            f"Message processed by AI: {saved_message.messageId}"
        )
        return MessageSchema(**saved_message.model_dump())

    # this si wherre representative comes in loop if run the ml pipeline and generate recommendation
    # if approved then use it else original text and all original + recommen.. saved 
    async def process_representative_message(
        self,
        conversation_id: str,
        company_id: str,
        representative_id: str,
        data: RepresentativeMessageRequest
    ) -> MessageSchema:
        # Get company settings
        company = await self.company_repository.find_by_user_id(
            company_id
        )
        if not company:
            raise NotFoundException(
                message="Company not found",
                details={"company_id": company_id}
            )

        # Step 1 - generate recommendation using ML pipeline
        recommendation = await self._run_ml_pipeline(
            data.response_text,
            company.default_tone,
            company.output_language
        )

        # Step 2 - use approved text or recommendation
        final_text = (
            recommendation
            if data.approve_recommendation
            else data.response_text
        )

        # Step 3 - compute quality score
        quality_score = self._compute_quality_score(
            data.response_text,
            final_text,
            company.default_tone,
            company.output_language
        )

        # Step 4 - detect closing message
        is_closing = self._detect_closing_message(data.response_text)

        # Step 5 - classify topic
        complaint_topic = self._classify_topic(data.response_text)

        # Step 6 - save to MongoDB
        message = Message(
            conversationId=conversation_id,
            companyId=company_id,
            representativeId=representative_id,
            original_text=data.response_text,
            processed_text=final_text,
            output_language=company.output_language,
            applied_tone=company.default_tone,
            quality_score=quality_score,
            complaint_topic=complaint_topic,
            is_closing_message=is_closing,
            handled_by="representative",
            recommendation=recommendation,
            approved=data.approve_recommendation
        )
        saved_message = await self.message_repository.create(message)

        # Step 7 - update representative performance
        await self.representative_repository.update_performance(
            representative_id, quality_score
        )

        # Step 8 - update conversation quality score
        await self.conversation_repository.update_quality_score(
            conversation_id, quality_score
        )

        logger.info(
            f"Message processed by representative: "
            f"{saved_message.messageId}"
        )
        return MessageSchema(**saved_message.model_dump())

    # ─── Private ML Methods ───────────────────────────────
    # detects the sentiments of the customer whether happy, confused, angry, etc.
    def _detect_sentiment(self, text: str):
        text_lower = text.lower()
        if any(p in text_lower for p in ANGRY_PHRASES):
            return ToneType.EMPATHETIC
        if any(p in text_lower for p in CONFUSED_PHRASES):
            return ToneType.FRIENDLY
        return None
    # grop replies like if CONFIDENT then ai handles else human
    async def _get_ai_response(
        self, customer_message: str, company
    ) -> tuple:
        provider = company.ai_provider
        api_key = company.ai_api_key

        try:
            # ─── Groq ──────────────────────────────────────
            if provider == "groq":
                from groq import Groq
                key = api_key or settings.GROQ_API_KEY
                client = Groq(api_key=key)
                response = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                f"You are a professional customer support agent for '{company.company_name}', "
                                f"a company in the {company.industry} industry. "
                                f"Your tone should be {company.default_tone}. "
                                "Customers may write in Hindi, Marathi, Gujarati, Punjabi, Hinglish or English. "
                                "Always respond in English only. "
                                "For delivery complaints: acknowledge the delay, apologize sincerely, and say the team will investigate within 24 hours. "
                                "For refund requests: acknowledge, say refunds take 5-7 business days, and ask for order ID. "
                                "For order status: ask for order ID and say you will check immediately. "
                                "For general queries: answer helpfully and professionally. "
                                "Never say you don't have access to systems - instead give a helpful generic response. "
                                "If the query involves sensitive account data like passwords or payments, start with ESCALATE: followed by reason. "
                                "Otherwise start with CONFIDENT: followed by your response. "
                                "Keep responses under 3 sentences. Be warm and professional."
                            )
                        },
                        {"role": "user", "content": customer_message}
                    ]
                )
                result = response.choices[0].message.content.strip()

            # ─── OpenAI ────────────────────────────────────
            elif provider == "openai":
                import openai
                openai.api_key = api_key
                response = openai.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a multilingual customer support agent for Indian businesses. "
                                "Customers may write in Hindi, Marathi, Gujarati, Punjabi or Hinglish "
                                "(mix of Hindi and English). Always respond in English only. "
                                "Understand the customer emotion and respond appropriately. "
                                "If you can answer confidently start with CONFIDENT: followed by your response. "
                                "If you cannot answer or need account-specific info start with "
                                "ESCALATE: followed by the reason."
                            )
                        },
                        {"role": "user", "content": customer_message}
                    ]
                )
                result = response.choices[0].message.content.strip()

            # ─── Gemini ────────────────────────────────────
            elif provider == "gemini":
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                gemini_model = genai.GenerativeModel("gemini-1.5-flash")
                prompt = (
                    "You are a multilingual customer support agent for Indian businesses. "
                    "Customers may write in Hindi, Marathi, Gujarati, Punjabi or Hinglish "
                    "(mix of Hindi and English). Always respond in English only. "
                    "Understand the customer emotion and respond appropriately. "
                    "If you can answer confidently start with CONFIDENT: followed by your response. "
                    "If you cannot answer or need account-specific info start with "
                    f"ESCALATE: followed by the reason.\n\nCustomer: {customer_message}"
                )
                response = gemini_model.generate_content(prompt)
                result = response.text.strip()

            # ─── Claude ────────────────────────────────────
            elif provider == "claude":
                import anthropic
                client = anthropic.Anthropic(api_key=api_key)
                response = client.messages.create(
                    model="claude-3-5-haiku-20241022",
                    max_tokens=1024,
                    system=(
                        "You are a multilingual customer support agent for Indian businesses. "
                        "Customers may write in Hindi, Marathi, Gujarati, Punjabi or Hinglish "
                        "(mix of Hindi and English). Always respond in English only. "
                        "Understand the customer emotion and respond appropriately. "
                        "If you can answer confidently start with CONFIDENT: followed by your response. "
                        "If you cannot answer or need account-specific info start with "
                        "ESCALATE: followed by the reason."
                    ),
                    messages=[
                        {"role": "user", "content": customer_message}
                    ]
                )
                result = response.content[0].text.strip()

            # ─── Custom Endpoint ───────────────────────────
            elif provider == "custom":
                import httpx
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        company.ai_endpoint,
                        json={
                            "message": customer_message,
                            "system": (
                                "You are a customer support agent. "
                                "Reply with CONFIDENT: or ESCALATE:"
                            )
                        },
                        headers={"Authorization": f"Bearer {api_key}"},
                        timeout=30
                    )
                    result = response.json().get("response", "")

            else:
                return None, True, "Unknown AI provider"

            # ─── Parse Result ──────────────────────────────
            if result.startswith("ESCALATE:"):
                reason = result.replace("ESCALATE:", "").strip()
                return None, True, reason

            response_text = result.replace("CONFIDENT:", "").strip()
            return response_text, False, None

        except Exception as e:
            logger.error(f"AI provider error ({provider}): {str(e)}")
            return None, True, f"AI service error: {str(e)}"


    async def _run_ml_pipeline(
        self,
        text: str,
        tone: ToneType,
        output_language: SupportedLanguage
    ) -> str:
        # Step 1 - tone standardization using T5
        prompt = f"Convert to {tone.value} tone: {text.strip()}"
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            padding=True,
            truncation=True
        )
        outputs = model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=150,
            num_beams=4,
            early_stopping=True
        )
        tone_standardized = tokenizer.decode(
            outputs[0], skip_special_tokens=True
        )

        # Step 2 - translation if needed
        if output_language != SupportedLanguage.ENGLISH:
            tone_standardized = self._translate(
                tone_standardized, output_language
            )

        return tone_standardized

    def _translate(self, text: str, target_language: SupportedLanguage) -> str:
        if target_language == SupportedLanguage.ENGLISH:
            return text
        from groq import Groq
        from app.core.config import settings
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        lang_instructions = {
            "hindi": "Translate to casual conversational Hindi mixed with some English words (Hinglish). Like how Indians actually speak - not textbook Hindi. Example: 'Aapka order 24 hours mein deliver ho jayega, don't worry!' Return only the translated text.",
            "marathi": "Translate to casual conversational Marathi mixed with some English words. Like how Pune/Mumbai people actually speak - not textbook Marathi. Example: 'Tumcha order lवकरच येईल, don't worry!' Return only the translated text.",
            "gujarati": "Translate to casual conversational Gujarati mixed with some English words. Like how Gujaratis actually speak in daily life - not textbook Gujarati. Return only the translated text.",
            "punjabi": "Translate to casual conversational Punjabi mixed with some English words. Like how Punjabis actually speak - not textbook Punjabi. Return only the translated text.",
        }
        
        lang_name = target_language.value.lower()
        instruction = lang_instructions.get(
            lang_name,
            f"Translate to {lang_name}. Return only the translated text."
        )
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": instruction},
                {"role": "user", "content": text}
            ]
        )
        return response.choices[0].message.content.strip()

    def _generate_summary(self, conversation_text: str) -> str:
        prompt = f"summarize: {conversation_text.strip()}"
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )
        outputs = model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=150,
            num_beams=4,
            early_stopping=True
        )
        return tokenizer.decode(outputs[0], skip_special_tokens=True)

    def _classify_topic(self, text: str) -> ComplaintTopic:
        prompt = (
            f"classify topic as one of "
            f"billing/delivery/refund/technical/general: "
            f"{text.strip()}"
        )
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            padding=True,
            truncation=True
        )
        outputs = model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=10,
            num_beams=2
        )
        result = tokenizer.decode(
            outputs[0], skip_special_tokens=True
        ).lower().strip()

        topic_map = {
            "billing": ComplaintTopic.BILLING,
            "delivery": ComplaintTopic.DELIVERY,
            "refund": ComplaintTopic.REFUND,
            "technical": ComplaintTopic.TECHNICAL,
            "general": ComplaintTopic.GENERAL
        }
        return topic_map.get(result, ComplaintTopic.GENERAL)

    def _detect_closing_message(self, text: str) -> bool:
        text_lower = text.lower().strip()
        return any(
            phrase in text_lower
            for phrase in CLOSING_PHRASES
        )

    def _compute_quality_score(
        self,
        original: str,
        processed: str,
        expected_tone: ToneType,
        expected_language: SupportedLanguage
    ) -> float:
        score = 0.0

        # 40 points - was tone applied
        if processed and original != processed:
            score += 40.0

        # 30 points - is response a reasonable length
        word_count = len(processed.split()) if processed else 0
        if 10 <= word_count <= 200:
            score += 30.0
        elif word_count > 0:
            score += 15.0

        # 30 points - does processed text exist and is not empty
        if processed and len(processed.strip()) > 0:
            score += 30.0

        return round(score, 2)
