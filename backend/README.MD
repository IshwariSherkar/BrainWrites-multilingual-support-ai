# BrainWrites - Backend

FastAPI + MongoDB + ML Models backend for the BrainWrites multilingual customer support platform.

## Setup
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## Environment Variables

Create a `.env` file:
```
MONGODB_URL=mongodb://localhost:27017
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
GROQ_API_KEY=your_groq_key
CLERK_SECRET_KEY=your_clerk_secret
```

## API Docs

Visit `http://localhost:8000/docs` for full Swagger documentation.

## ML Models

Place these in `app/ml_model/`:
```
app/ml_model/
├── tone_model/              # Flan-T5 fine-tuned for tone transfer
│   ├── model.safetensors
│   ├── config.json
│   └── tokenizer files...
└── translator/              # Custom Transformer for translation
    ├── transformer_translator_model.keras
    └── spm_bpe.model
```

Download ML models from Google Drive: [add link here]