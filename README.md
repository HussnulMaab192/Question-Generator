# Quran Competition Question Generator

A production web application for generating and running Quran competition
question sets from a live Excel workbook. An examiner selects categories
(Excel sheets) and how many questions to draw from each, generates a
shuffled set, then scores each question for Memorization and Tajweed
(0–10 each) during the competition.

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui-style primitives (Radix Slot + class-variance-authority)
- lucide-react icons
- React Router
- Axios

**Backend**
- FastAPI (Python)
- Pandas + openpyxl (Excel I/O)
- Pydantic v2 (typed request/response models, snake_case ⇄ camelCase)
- pytest (unit + integration tests)

Designed to work responsively on Windows laptops, Android tablets, and
iPads, and to run entirely on a local network with no internet dependency.

## Repository Structure

```
Question Generator/
├── backend/                        FastAPI application
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/             health.py, categories.py, generate.py, reload.py, admin.py
│   │   │   └── router.py           Aggregates all routers
│   │   ├── core/                   Settings/config (workbook path, CORS, ...)
│   │   ├── models/                 Pydantic schemas (Category, Question, Reload, Workbook, Admin, ...)
│   │   ├── services/
│   │   │   ├── excel_service.py    Loads/auto-reloads/replaces the workbook, derives categories+questions
│   │   │   ├── question_service.py Random, no-duplicate question selection
│   │   │   └── exceptions.py       Shared service-layer error types
│   │   └── main.py                 FastAPI entrypoint (CORS, lifespan load, error handlers)
│   ├── tests/                      Pytest suite (+ `helpers.py` for shared test fixtures)
│   ├── data/                       Place `competition_questions.xlsx` here (gitignored)
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/                       React + TypeScript + Vite application
│   ├── src/
│   │   ├── api/                    Axios client + typed endpoint functions
│   │   ├── components/
│   │   │   ├── layout/              AppLayout, Header, Footer (responsive)
│   │   │   ├── competition/         Setup + Generated Questions screens and their pieces
│   │   │   ├── admin/               Workbook info card + upload form for the Admin page
│   │   │   ├── common/              Small reusable helpers (LoadingSpinner, Toaster)
│   │   │   └── ui/                  Reusable UI primitives (Button, Card, Tooltip, ...)
│   │   ├── config/                  Environment variable access
│   │   ├── contexts/                App-wide React contexts (ToastContext)
│   │   ├── hooks/                   useCategories, useCompetitionSetup, useQuestionGeneration, useQuestionStatuses, useWorkbookInfo
│   │   ├── pages/                   Route-level page components (HomePage, AdminPage, ...)
│   │   ├── routes/                  Route path constants
│   │   ├── types/                   Shared TypeScript types
│   │   ├── App.tsx                  Route definitions
│   │   └── main.tsx                 App entrypoint
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
npm run preview   # Serve the production build locally (also LAN-reachable)
npm run serve     # Shorthand for `npm run build && npm run preview`
npm run lint      # Lint the codebase
```

## Data Layer (Questions Workbook)

The backend is **fully data-driven**: it reads categories and questions
directly from an Excel workbook — no category/sheet names, column names, or
column positions are ever hardcoded.

- **Expected location:** `backend/data/competition_questions.xlsx`
- **Format:** one sheet per selectable category. Sheet names can be
  anything (`"30"`, `"Juz Amma Part 1"`, `"Surah Baqarah"`, `"Easy
  Questions"`, ...) — the app discovers whatever sheets exist at load time.
  Each sheet has **no header row** — every row is data. The first column
  holds the question's number/label; the next non-empty cell after it is
  treated as the question text, so extra columns can be appended later
  (e.g. a translation column) without any code change.
- **This repository does not include the workbook.** Download/export the
  real spreadsheet as `.xlsx`, name it exactly `competition_questions.xlsx`,
  and place it at `backend/data/competition_questions.xlsx`. The app will
  never generate, fabricate, or overwrite this file for you.
- **Auto-reload:** the workbook is read at startup and cached in memory,
  but every subsequent read compares the file's modification timestamp and
  transparently re-reads it if it changed — so sheets you add, remove, or
  rename in Excel show up automatically, with **no backend restart
  needed**. `POST /api/v1/reload` additionally forces an immediate reload
  on demand (this is what the frontend's "Refresh Categories" button
  calls); see `backend/app/services/excel_service.py`.

### `GET /api/v1/categories`

Returns one category per sheet, derived dynamically:

```json
[
  { "id": "30", "name": "30", "questionCount": 10 },
  { "id": "29", "name": "29", "questionCount": 8 }
]
```

### `POST /api/v1/generate`

Randomly selects the requested number of (never duplicated) questions per
category:

```json
// Request
{ "categories": [{ "id": "30", "count": 2 }, { "id": "28", "count": 3 }] }
```

```json
// Response
[
  { "category": "30", "questionNumber": 4, "text": "...", "fullText": "..." }
]
```

Returns `400` if a category doesn't exist, or if more questions are
requested than are available in that category.

### `POST /api/v1/reload`

Forces the workbook to be re-read from disk right now (see Data Layer
above):

```json
{ "success": true, "categories": 15 }
```

### `GET /api/v1/admin/workbook`

Metadata about the currently loaded workbook, for the Admin page:

```json
{
  "filename": "competition_questions.xlsx",
  "lastModified": "2026-07-27T22:45:14.239Z",
  "categoryCount": 15,
  "totalQuestions": 148
}
```

### `POST /api/v1/admin/upload-workbook`

Uploads a replacement workbook (multipart `file` field, `.xlsx` only, max
20 MB). The upload is **validated before the current file is ever
touched** — parsed on a throwaway copy first — so a bad upload can never
corrupt or replace a working workbook; only once it's confirmed to be a
readable workbook is the real file atomically swapped in and `ExcelService`
reloaded. No restart required.

```json
{
  "success": true,
  "message": "Workbook uploaded and reloaded successfully. 15 categories found.",
  "workbook": { "filename": "...", "lastModified": "...", "categoryCount": 15, "totalQuestions": 148 }
}
```

Returns `400` for a wrong extension, an empty/oversized (>20 MB) file, or a
file that isn't actually a readable `.xlsx` workbook — in every case the
existing workbook on disk is left completely untouched.

**Error handling** — if the workbook is missing or cannot be parsed, every
endpoint above responds with a clear error instead of silently returning
nothing or fabricating sample data:

| Situation                             | Response                                                             |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `competition_questions.xlsx` missing   | `503` — `{ "detail": "Questions workbook not found at '...'. ..." }`  |
| Workbook present but corrupt/invalid   | `500` — `{ "detail": "Could not open '...' as an Excel workbook: ..." }` |
| Category not found / not enough questions | `400` — `{ "detail": "..." }`                                      |
| Upload while workbook locked (Excel etc.) | `409` — `{ "detail": "The workbook is currently in use..." }`     |
| Workbook present and valid             | `200` — dynamic data                                                  |

The frontend surfaces these messages directly (with a "No workbook
loaded."/"Retry" empty state for the missing-file case) instead of showing
fake or sample categories.

## Running Both Together

Open two terminals:

1. Terminal 1 (backend): follow **Backend Setup** above and leave `uvicorn`
   running.
2. Terminal 2 (frontend): follow **Frontend Setup** above and leave
   `npm run dev` running.

The frontend's home page performs a live connectivity check against the
backend `/health` endpoint so you can confirm both are wired up correctly.

## Deployment

The app is designed to run on one laptop and be used from tablets over the
same local Wi-Fi network during a live competition — no internet access or
cloud hosting required.

### Backend

Development (auto-reloads when backend source files change):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Production (no code auto-reload; steadier for a live event — the workbook
itself still auto-reloads on change regardless of this flag, see Data
Layer above):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

`--host 0.0.0.0` is what makes the API reachable from other devices on the
network (not just `localhost`) — keep it in both modes.

### Frontend

Development (hot reload, best while iterating):

```powershell
cd frontend
npm run dev        # http://localhost:5173
```

Production (optimized static build, served locally):

```powershell
cd frontend
npm run build      # type-checks and builds frontend/dist
npm run preview    # http://localhost:4173
# or, in one step:
npm run serve
```

Both `npm run dev` (port 5173) and `npm run preview` (port 4173) are
configured in `vite.config.ts` with `host: true`, so — like the backend —
they listen on every network interface, not just `localhost`.

### Local Network Access (Connecting a Tablet)

1. Find the laptop's LAN IP address:

   ```powershell
   ipconfig
   # Look for "IPv4 Address" under your active Wi-Fi/Ethernet adapter,
   # e.g. 192.168.1.42
   ```

2. **Backend:** allow the frontend's LAN address(es) in `backend/.env`:

   ```env
   CORS_ORIGINS=http://localhost:5173,http://192.168.1.42:5173,http://192.168.1.42:4173
   ```

   Restart the backend after changing `.env`.

3. **Frontend:** point it at the backend's LAN address instead of
   `localhost` in `frontend/.env`:

   ```env
   VITE_API_BASE_URL=http://192.168.1.42:8000/api/v1
   ```

   Restart the frontend (`npm run dev`, or rebuild/`npm run preview`) after
   changing `.env` — Vite only reads `.env` at startup.

4. On the tablet (same Wi-Fi network as the laptop), open a browser and go
   to:

   - Development: `http://192.168.1.42:5173`
   - Production: `http://192.168.1.42:4173`

### Development vs. Production — Summary

|                    | Development                                                | Production                                        |
| ------------------ | ------------------------------------------------------------ | -------------------------------------------------- |
| Backend command    | `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000` | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| Frontend command   | `npm run dev`                                               | `npm run serve` (= `build` + `preview`)           |
| Frontend port      | 5173                                                        | 4173                                               |
| Rebuilds on save?  | Yes (hot reload)                                             | No — re-run `npm run build` after any change      |
| Recommended for    | Active development                                           | The actual competition                            |

Use production mode for the live competition itself: it's a smaller,
optimized build that won't hot-reload (and briefly disconnect clients)
if a file happens to change mid-event.

### Cloud deployment (Render + Vercel)

The competition can also run hosted (backend on Render, frontend on Vercel).
Workbook uploads require a **persistent disk** on Render — the free
ephemeral filesystem loses files on every redeploy.

#### Backend on Render

1. Create a **Web Service** from this repo (or use the root `render.yaml` Blueprint).
2. Set **Root Directory** to `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment variables:

   | Variable | Example |
   | -------- | ------- |
   | `APP_ENV` | `production` |
   | `CORS_ORIGINS` | `https://your-app.vercel.app` |
   | `DATA_DIR` | `/var/data` (persistent disk mount) |
   | `QUESTIONS_WORKBOOK_FILENAME` | `competition_questions.xlsx` |

6. Attach a **persistent disk** mounted at `/var/data` (see `render.yaml`).
7. After the service is live, open `/admin` on the frontend and upload the
   `.xlsx` workbook (or place it on the disk before the first request).

Health check URL: `https://<your-service>.onrender.com/api/v1/health`

#### Frontend on Vercel

1. Import the repo into Vercel; set **Root Directory** to `frontend`.
2. Framework preset: Vite (or use `frontend/vercel.json`).
3. Build command: `npm run build` · Output: `dist`
4. Environment variable (Production):

   | Variable | Example |
   | -------- | ------- |
   | `VITE_API_BASE_URL` | `https://<your-service>.onrender.com/api/v1` |

5. Redeploy after changing env vars (Vite inlines `VITE_*` at build time).

#### Admin upload workflow (any environment)

1. Open `/admin` in the app.
2. Confirm current workbook stats (name, last modified, categories, total questions).
3. Choose a `.xlsx` file (max 20 MB) → **Upload & Replace Workbook**.
4. On success: toast + stats refresh; Home category grid picks up the new
   sheets (use **Refresh Categories** if you already had Setup open).
5. On failure: the toast shows the backend's exact `detail` (e.g. wrong
   extension, invalid file, or file locked by Excel → HTTP 409).

No backend restart is required after upload or after editing the workbook
on disk.

## Current Status

Fully implemented, end to end:

- ✅ **Backend:** FastAPI app with layered `api` / `services` / `models`,
  CORS, and centralized error handling (`400`/`404`/`500`/`503` for the
  various workbook/category/generation failure modes).
- ✅ **Data layer:** `ExcelService` dynamically loads the questions
  workbook (no hardcoded sheet/column names), auto-reloads when the file
  on disk changes, and exposes `GET /api/v1/categories` and
  `POST /api/v1/reload`.
- ✅ **Question generation:** `POST /api/v1/generate` randomly selects
  non-duplicate questions per category via `QuestionService`, with strict
  validation (`400` for unknown categories or insufficient questions).
- ✅ **Frontend — Competition Setup:** dynamic, workbook-driven category
  grid (fully clickable tiles, compact per-category counters), a live
  selection summary, and a "Refresh Categories" action that forces a
  workbook reload without restarting anything.
- ✅ **Frontend — Generated Questions:** every generated question shown at
  once in a responsive card grid, with per-question Memorization and
  Tajweed scores (0–10), a sticky toolbar (scoring summary, Back to Setup,
  Regenerate), and a confirmation prompt before leaving if scores were entered.
- ✅ **UX polish:** loading skeletons, toast notifications, tooltips,
  friendly empty states, and an app version footer.
- ✅ **Reliability:** the workbook file is never left open/locked by the
  backend (Excel can always save it while the app is running), and every
  file-replacing operation (auto-reload, `/reload`, workbook upload)
  validates content before ever touching the real file on disk.
- ✅ **Admin page (`/admin`):** shows the current workbook's name, last
  modified time, category count, and total question count, plus a file
  picker (`.xlsx` only, max 20 MB) to upload a replacement workbook via
  `POST /api/v1/admin/upload-workbook` — validated, atomically swapped in,
  and reloaded with no restart, refreshing this page's stats and showing a
  toast on success or the backend's specific error on failure.
- ⏳ Not yet implemented: additional question types beyond plain text
  (the `Question`/card model already supports this extensibly), export
  flows, authentication, persistence across restarts.

## Notes for Contributors

- Add new backend endpoints under `backend/app/api/routes/`, register them
  in `backend/app/api/router.py`, and put business logic in
  `backend/app/services/` (never inline logic in route handlers).
- Add new frontend pages under `frontend/src/pages/`, register the route in
  `frontend/src/App.tsx` and `frontend/src/routes/paths.ts`, and add new
  shared UI primitives under `frontend/src/components/ui/`.
- Keep environment-specific values in `.env` files (see the two
  `.env.example` files); never commit real `.env` files.
