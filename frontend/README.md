# BrainWrites — Frontend

React 18 + Vite + Tailwind CSS frontend for the BrainWrites multilingual customer support platform.

## Setup
```bash
npm install
npm run dev
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/portal` | Login portal for Company / Manager / Representative |
| `/company/register` | Company registration |
| `/company/login` | Company login |
| `/company/dashboard` | Company dashboard — manage team, view chat link |
| `/manager/login` | Manager login via Google (Clerk) |
| `/manager/dashboard` | Manager dashboard — view conversations, analytics |
| `/representative/login` | Representative login via Google (Clerk) |
| `/representative/dashboard` | Rep dashboard — handle escalated chats |
| `/chat/:companySlug` | Public customer chat interface |
| `/demo` | Live API demo |
| `/pricing` | Pricing plans |

## Environment Variables

Create a `.env` file:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=http://127.0.0.1:8000/api/v1
```