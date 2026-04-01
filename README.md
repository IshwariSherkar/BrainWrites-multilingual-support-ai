#  BrainWrites
### *Speak their language, win their trust.*


Imagine you run a business in India. Your customers speak Marathi, Hindi, Gujarati, Punjabi - but your support team only speaks English. Every day, messages come in that your team struggles to understand, and responses go out that feel cold, robotic, or just wrong in tone.

**BrainWrites** was built to solve exactly this.

It's an AI-powered multilingual customer support platform that sits between your customers and your team - understanding what customers write in any Indian language, generating warm and professional responses, standardizing the tone to match your brand, and delivering the reply back in the customer's own language.

Your customer writes in Marathi. Your AI responds in Marathi. Your brand sounds consistent. Your team stays in control.


##  What It Does

```
Customer writes in Hindi / Marathi / Gujarati / Punjabi / Hinglish
        ↓
Groq AI (LLaMA 3.3 70B) understands the message and generates a response
        ↓
Fine-tuned T5 model applies your company's tone (formal / friendly / empathetic)
        ↓
Custom Transformer model translates the response to the customer's language
        ↓
Customer receives a reply in their own language, in your brand's voice ✅
```


##  Architecture

```
BrainWrites/
├── backend/                  # FastAPI + MongoDB + ML Models
│   ├── app/
│   │   ├── api/              # REST endpoints
│   │   ├── core/             # Auth, security, decorators
│   │   ├── ml_model/
│   │   │   ├── tone_model/   # Fine-tuned Flan-T5 for tone transfer
│   │   │   └── translator/   # Custom Transformer for Indian language translation
│   │   ├── models/           # MongoDB data models
│   │   ├── repositories/     # Database access layer
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic + ML pipeline
└── frontend/                 # React + Vite + Tailwind CSS
    └── src/
        ├── pages/
        │   ├── company/      # Company register, login, dashboard
        │   ├── manager/      # Manager login, dashboard
        │   ├── representative/ # Rep login, dashboard
        │   └── customer/     # Public chat interface
        └── components/       # Shared components
```


##  Who Uses It

| Role | What They Do |
|------|-------------|
| **Company** | Registers, gets a unique chat link, manages managers & reps |
| **Manager** | Oversees conversations, views analytics, manages representatives |
| **Representative** | Handles escalated conversations, gets AI-suggested responses |
| **Customer** | Chats in their language via the company's public link |


##  ML Models

### 1. Tone Standardization - Fine-tuned Flan-T5
- Base model: `google/flan-t5-base`
- Trained on custom `tone_conversion_dataset.csv`
- Converts AI responses to: **Formal**, **Friendly**, or **Empathetic** tone
- Each company can set their preferred tone

### 2. Translation - Custom Transformer (TensorFlow/Keras)
- Built from scratch: Encoder-Decoder with Multi-Head Attention
- Trained on [AI4Bharat BPCC dataset](https://huggingface.co/datasets/ai4bharat/BPCC)
- Supports: **English ↔ Hindi, Marathi, Gujarati, Punjabi**
- Custom SentencePiece BPE tokenizer (vocab size: 8000)

### 3. Response Generation - Groq AI (LLaMA 3.3 70B)
- Understands multilingual input (Hindi, Marathi, Gujarati, Punjabi, Hinglish)
- Generates confident responses or escalates to human reps
- Context-aware: knows the company name, industry, and tone preference


##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Auth | Clerk (Google SSO for managers/reps) + JWT (companies) |
| Backend | FastAPI, Python 3.11 |
| Database | MongoDB (Motor async driver) |
| AI/ML | Groq (LLaMA 3.3 70B), Flan-T5, Custom Transformer |
| ML Framework | PyTorch (T5), TensorFlow/Keras (Translator) |
| Tokenization | HuggingFace Transformers, SentencePiece |


##  Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally
- Groq API key

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your GROQ_API_KEY, SECRET_KEY, CLERK keys

python -m uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Access
| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Landing page |
| `http://localhost:5173/portal` | Company / Manager / Rep login |
| `http://localhost:5173/chat/{company-slug}` | Customer chat |
| `http://localhost:8000/docs` | API documentation |



## Supported Languages

| Language | Script | Code |
|----------|--------|------|
| English | Latin | `english` |
| Hindi | Devanagari | `hindi` |
| Marathi | Devanagari | `marathi` |
| Gujarati | Gujarati | `gujarati` |
| Punjabi | Gurmukhi | `punjabi` |



## Key Features

- Multilingual Chat - customers write in any Indian language
- Tone Standardization - formal, friendly, or empathetic - your choice
- AI + Human Handoff - AI handles common queries, escalates complex ones
- Quality Scoring - every response gets a quality score
- Multi-company - each company gets their own isolated environment
- Role-based Access - company, manager, and representative roles
- Conversation Summaries - T5-generated summaries when chats close
- Daily Digests - scheduled email summaries for managers



## About


The goal was to explore how modern AI - large language models, fine-tuned transformers, and custom neural networks - can be combined into a real, usable product that solves a genuine problem faced by Indian businesses every day.

  
<p align="center">
  <b>BrainWrites</b> - Speak their language, win their trust. 
</p>
