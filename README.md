# Quran Competition Question Generator

A web application for generating Quran competition questions. This repository
currently contains the **project architecture and scaffold only** — routing,
layout, API wiring, and folder structure are in place, but the question
generation business logic has **not** been implemented yet.

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui (Radix + class-variance-authority)
- React Router
- Axios

**Backend**
- FastAPI (Python)
- Pandas
- openpyxl

Designed to work responsively on Windows laptops, Android tablets, and iPads.

## Repository Structure

```
Question Generator/
├── backend/                   FastAPI application
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/        One module per resource (health.py, categories.py, questions.py)
│   │   │   └── router.py      Aggregates all routers
│   │   ├── core/               Settings/config (incl. workbook path)
│   │   ├── models/            Pydantic request/response schemas (Category, ...)
│   │   ├── services/          Business logic layer
│   │   │   ├── excel_service.py     Loads the workbook once, derives categories
│   │   │   ├── exceptions.py        Shared service-layer error types
│   │   │   └── question_service.py  Placeholder for future question generation
│   │   └── main.py            FastAPI entrypoint (CORS, lifespan workbook load, error handlers)
│   ├── tests/                 Pytest suite (health, ExcelService, categories endpoint)
│   ├── data/                  Place `competition_questions.xlsx` here (gitignored)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                  React + TypeScript + Vite application
│   ├── src/
│   │   ├── api/                Axios client + typed endpoint functions
│   │   ├── components/
│   │   │   ├── layout/         AppLayout, Header, Footer (responsive)
│   │   │   ├── categories/     CategorySelector (dynamic, workbook-driven)
│   │   │   ├── common/         Small reusable helpers (e.g. LoadingSpinner)
│   │   │   └── ui/             shadcn/ui primitives (Button, Card, ...)
│   │   ├── config/             Environment variable access
│   │   ├── hooks/              Reusable data-fetching hooks (useCategories, ...)
│   │   ├── pages/               Route-level page components
│   │   ├── routes/             Route path constants
│   │   ├── types/              Shared TypeScript types
│   │   ├── App.tsx             Route definitions
│   │   └── main.tsx             App entrypoint
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## Prerequisites

- **Python** 3.11+ (tested with 3.14)
- **Node.js** 18+ and **npm** (for the frontend — install from
  [nodejs.org](https://nodejs.org/) if `node`/`npm` are not yet available)

## Backend Setup

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env
# Edit .env if needed (CORS origins, port, etc.)

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API base URL: `http://localhost:8000`
- Interactive docs (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

Run tests with:

```powershell
pytest
```

## Frontend Setup

```powershell
cd frontend
npm install

copy .env.example .env
# Edit .env if the backend runs on a different host/port

npm run dev
```

- App URL: `http://localhost:5173`
- The dev server listens on all network interfaces (`host: true` in
  `vite.config.ts`), so it is also reachable from tablets/iPads on the same
  Wi-Fi network at `http://<your-machine-lan-ip>:5173` — useful for testing
  the responsive layout on real devices.

Other useful commands:

```powershell
npm run build     # Type-check + production build (outputs to frontend/dist)
npm run preview   # Preview the production build locally
npm run lint      # Lint the codebase
```

## Data Layer (Questions Workbook)

The backend is **fully data-driven**: it reads categories directly from an
Excel workbook — no category/sheet names are ever hardcoded.

- **Expected location:** `backend/data/competition_questions.xlsx`
- **Format:** one sheet per selectable category. Sheet names can be
  anything (`"30"`, `"Juz Amma Part 1"`, `"Surah Baqarah"`, `"Easy
  Questions"`, ...) — the app discovers whatever sheets exist at load time.
  The first row of each sheet is treated as a header; every non-empty row
  below it counts as one available question.
- **This repository does not include the workbook.** Download/export the
  real spreadsheet as `.xlsx`, name it exactly `competition_questions.xlsx`,
  and place it at `backend/data/competition_questions.xlsx`. The app will
  never generate, fabricate, or overwrite this file for you.
- The workbook is loaded **once**, at backend startup (`ExcelService`, see
  `backend/app/services/excel_service.py`). Adding, removing, or renaming
  sheets, or changing how many questions are in them, never requires a
  code change — just restart the backend (or re-request `/categories` if
  the file was missing on the previous startup attempt) so it re-reads the
  file.

### `GET /api/v1/categories`

Returns one category per sheet, derived dynamically:

```json
[
  { "id": "30", "name": "30", "questionCount": 10 },
  { "id": "29", "name": "29", "questionCount": 8 }
]
```

**Error handling** — if the workbook is missing or cannot be parsed, the
endpoint responds with a clear error instead of silently returning nothing
or fabricating sample data:

| Situation                          | Response                                |
| ----------------------------------- | ---------------------------------------- |
| `competition_questions.xlsx` missing | `503` — `{ "detail": "Questions workbook not found at '...'. ..." }` |
| Workbook present but corrupt/invalid | `500` — `{ "detail": "Could not open '...' as an Excel workbook: ..." }` |
| Workbook present and valid           | `200` — dynamic category list            |

The frontend's `CategorySelector` component (`frontend/src/components/categories/`)
fetches this endpoint and renders one button per category automatically —
there are no hardcoded category buttons anywhere in the UI. If the workbook
is missing, the UI surfaces the backend's error message directly with a
"Retry" action instead of showing fake/sample categories.

## Running Both Together

Open two terminals:

1. Terminal 1 (backend): follow **Backend Setup** above and leave `uvicorn`
   running.
2. Terminal 2 (frontend): follow **Frontend Setup** above and leave
   `npm run dev` running.

The frontend's home page performs a live connectivity check against the
backend `/health` endpoint so you can confirm both are wired up correctly.

## Current Status

- ✅ Backend: FastAPI app, CORS, layered folder structure (`api` / `services`
  / `models`), health endpoint, placeholder `questions` route.
- ✅ Backend data layer: `ExcelService` dynamically loads the questions
  workbook and exposes `GET /api/v1/categories`, with proper error handling
  for missing/invalid workbooks (no hardcoded categories, no fabricated data).
- ✅ Frontend: Vite + React + TypeScript + Tailwind + shadcn/ui, routing,
  responsive layout (header with mobile nav, adaptive grid), typed API
  client.
- ✅ Frontend category selection: dynamic, workbook-driven category buttons
  (`CategorySelector`) with loading/error/retry states — no hardcoded UI.
- ⏳ Not yet implemented: question generation logic, file upload/export
  flows, authentication, persistence.

## Notes for Contributors

- Add new backend endpoints under `backend/app/api/routes/`, register them
  in `backend/app/api/router.py`, and put business logic in
  `backend/app/services/` (never inline logic in route handlers).
- Add new frontend pages under `frontend/src/pages/`, register the route in
  `frontend/src/App.tsx` and `frontend/src/routes/paths.ts`, and add new
  shared UI primitives under `frontend/src/components/ui/` (matching
  shadcn/ui conventions — you can also use `npx shadcn@latest add <component>`
  once Node dependencies are installed).
- Keep environment-specific values in `.env` files (see the two
  `.env.example` files); never commit real `.env` files.
