@echo off
CALL conda activate aaienv

REM Start FastAPI backend from inside backend folder
start cmd /k "cd backend && uvicorn app.main:app --reload"

REM Start frontend dev server
start cmd /k "cd frontend && npm run dev"
