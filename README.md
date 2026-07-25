# AIVOA Complaint Management System

AIVOA is an AI-assisted pharmaceutical Quality Management System (QMS) complaint intake app for API and FDF quality teams. It extracts complaint details from pasted text or uploaded PDFs, checks form completeness, classifies initial risk, recommends QA actions, persists records in Supabase/PostgreSQL, and lets users review past complaints.

## Feature Coverage

| Feature | Backend | Frontend |
| --- | --- | --- |
| Complaint Completeness Checker | Calculates required-field completion and missing fields after extraction. | Shows completion percentage, missing required fields, and commit readiness. |
| Root Cause Recommendation | AI generates a dedicated root-cause investigation recommendation. | Displayed and editable in the AI Copilot Complaint Insights panel. |
| Duplicate Complaint Detection | Compares the current complaint with saved complaints by batch, product/customer, and product/category. | Shows matching complaint IDs in the AI insights panel and past complaints drawer. |
| CAPA Recommendation | AI generates a dedicated corrective and preventive action recommendation. | Displayed and editable in the AI Copilot Complaint Insights panel. |
| Complaint Summary | AI generates a concise complaint summary. | Displayed in the AI insights panel and used in past complaint cards when available. |
| AI Risk Classification | AI suggests severity, category, next action, and initial risk assessment. | Displayed and editable in the AI insights panel. |

## Application Flow

1. The user pastes a raw complaint message or uploads a PDF in AIVOA Copilot.
2. The FastAPI backend sends the content through a LangGraph workflow.
3. The graph classifies the message intent, extracts structured complaint fields, checks completeness, and generates AI QA insights.
4. The backend checks Supabase/PostgreSQL for potential duplicate complaints.
5. The frontend updates the form, highlights AI-filled fields, and shows completion/risk/summary/CAPA details.
6. When ready, the user commits the complaint to the QMS ledger.
7. The user can open Past Complaints to review saved records and load one back into the form.

## Tech Stack

- Frontend: React, Vite, Redux Toolkit, Tailwind CSS, lucide-react
- Backend: FastAPI, SQLAlchemy, LangGraph, Pydantic
- AI provider: Groq OpenAI-compatible chat API
- Persistence: Supabase/PostgreSQL
- PDF parsing: pypdf

## Project Structure

```text
AIVOA/
  backend/
    app/
      api/routes.py              FastAPI complaint endpoints
      graph/                     LangGraph complaint workflow
      models/                    Pydantic and SQLAlchemy models
      services/                  Groq, PDF, and persistence services
      main.py                    FastAPI app startup
    requirements.txt
  frontend/
    src/
      api/complaintApi.js        Browser API client
      components/                Form, chat, insights, and history UI
      store/complaintSlice.js    Redux complaint state
    package.json
```

## Environment Variables

Create `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://user:password@host:5432/database
```

For Supabase, use the PostgreSQL connection string from your Supabase project settings. The app creates the `complaints` table on startup and adds nullable feature columns when missing.

## Backend Setup

```powershell
cd C:\Users\KIIT0001\Documents\AIVOA
python -m venv .venv
.\.venv\Scripts\pip install -r backend\requirements.txt
cd backend
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Use the full path if PowerShell has trouble resolving the virtual environment:

```powershell
C:\Users\KIIT0001\Documents\AIVOA\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

## Frontend Setup

```powershell
cd C:\Users\KIIT0001\Documents\AIVOA\frontend
npm install
npm.cmd run dev -- --host 127.0.0.1
```

Open:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:8000`.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/complaint/extract` | Extract and analyze complaint text. |
| `POST` | `/api/complaint/extract-pdf` | Extract and analyze complaint PDF content. |
| `POST` | `/api/complaint/commit` | Commit the current form to the QMS ledger. |
| `GET` | `/api/complaint/history` | List saved complaints from persistent storage. |
| `GET` | `/api/complaint/session/{session_id}` | Retrieve the latest draft for a session. |
| `GET` | `/api/complaint/{complaint_id}` | Retrieve one complaint by complaint ID. |

## Development Checks

Backend syntax check:

```powershell
python -m compileall backend\app
```

Frontend build and lint:

```powershell
cd frontend
npm.cmd run build
npm.cmd run lint
```

## Troubleshooting

### `[WinError 10048] only one usage of each socket address`

Port `8000` is already in use. Find and stop the process:

```powershell
netstat -ano | findstr :8000
tasklist /FI "PID eq YOUR_PID"
taskkill /PID YOUR_PID /F
```

### `[WinError 10013] permission denied`

If the traceback points to `supabase.com:5432`, Windows or the execution sandbox is blocking outbound PostgreSQL access. Run the backend from a normal terminal and check firewall or antivirus rules for Python.

### PowerShell blocks `npm`

Use `npm.cmd`:

```powershell
npm.cmd run dev
npm.cmd run build
```

## Notes

- AI outputs are recommendations for QA review, not final regulatory decisions.
- Duplicate detection is deterministic and based on saved complaint metadata. It is meant to flag likely related records, not prove equivalence.
- The user can edit AI-generated fields before committing the complaint.
