# Dewy – AI-Native CRM for Beauty Brands

Dewy is a production-quality, AI-native CRM platform built specifically for beauty, cosmetics, and skincare brands. Instead of manually writing database filters or SQL queries, marketers write business goals in natural language (e.g., *"Win back customers who haven't purchased in 90 days"* or *"Target sunscreen buyers who have never purchased a moisturizer"*).

Dewy processes these requests end-to-end:
1. **AI Segmentation**: Uses Gemini NLP to parse the goal into structured database filters.
2. **Deterministic SQL Conversion**: Translates parsed filters into database-level queries using SQLAlchemy to calculate audience size, purchase histories, and segment metrics.
3. **Smart Channel Recommendation**: Recommends the optimal communication channel (WhatsApp, Email, SMS) along with logical reasoning.
4. **Personalized Copywriting**: Generates copy variants tailored specifically to the target audience segment, selected channel, and campaign objective.
5. **Funnel Simulation**: Integrates with a simulated message dispatch broker to asynchronously run delivery, click, open, and order conversions.
6. **Insight Analytics**: Evaluates post-campaign analytics using AI to deliver insights and recommend next-best actions.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.2.x (React 19, App Router)
- **Styling**: Tailwind CSS v4, Vanilla CSS
- **Icons**: Lucide React
- **Data Fetching & State**: TanStack React Query v5, Axios
- **Visualization**: Recharts (v3) for interactive campaign dashboard charts
- **UI System**: Shadcn/ui & Radix UI primitives
- **Notifications**: React Hot Toast

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.x
- **Database**: SQLite (Local Dev / Docker Volume) or PostgreSQL (Production-ready)
- **AI Engine**: Google Gemini API via `google-generativeai` SDK (Gemini 1.5/2.5 models)
- **Environment**: Python-dotenv, Pydantic v2 schemas
- **Server**: Uvicorn

### Channel Simulator Service
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy 2.x
- **Database**: SQLite (independent data persistence store)
- **Task Dispatcher**: Asyncio background task loops simulating delay-based consumer funnels

### Orchestration & Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Configuration Templates**: Root, backend, and channel-service `.env.example` configurations

---

## 📐 Technical Architecture

```
                 +-----------------------------+
                 |     Next.js 16 Frontend     |
                 |     (Dashboard, Copilot)    |
                 +--------------+--------------+
                                |
                                v (Rest API / localhost:8000)
                 +-----------------------------+
                 |    FastAPI CRM Backend      | <---->  Google Gemini API
                 |        (Port 8000)          |
                 +-------+--------------+------+
                         |              ^
                         |              | Callback Webhook
                         v              | (/api/receipts)
+------------+   +-------v--------------+------+
| SQLite /   |   |  Channel Simulator Service  |
| PostgreSQL |   |        (Port 8001)          |
+------------+   +-----------------------------+
```

---

## 📂 Directory Structure

```
├── backend/                   # FastAPI CRM Backend
│   ├── app/
│   │   ├── db/                # Database configuration and seeding scripts
│   │   ├── models/            # SQLAlchemy database tables/models
│   │   ├── routes/            # Route controllers (AI, campaigns, datasets, etc.)
│   │   ├── schemas/           # Pydantic schemas for request/response validation
│   │   ├── services/          # Core services (AI generation, CRM queries, etc.)
│   │   └── main.py            # Backend service entrypoint
│   └── requirements.txt
│
├── channel-service/           # Simulated Message Delivery Service
│   ├── app/
│   │   ├── routes/            # Routes (Simulated message dispatch, webhook callbacks)
│   │   ├── simulator.py       # Asyncio scheduling loops simulating client action callbacks
│   │   └── main.py            # Channel Simulator entrypoint
│   └── requirements.txt
│
├── frontend/                  # Next.js 16 Web Dashboard & Copilot
│   ├── app/                   # Next.js App Router (Dashboard, Copilot UI)
│   ├── components/            # Shared UI components (Charts, Sidebar, AI copilot views)
│   ├── lib/                   # API clients and campaign projection math utils
│   └── package.json
│
└── DEPLOY.md                  # Detailed deployment runbook
```

---

### Deploying to Vercel & Render

For production, the frontend is deployed to **Vercel** and the backend services are deployed to **Render**.

#### 1. Backend Service (FastAPI) on Render
1. Create a new **Web Service** on Render and connect your repository.
2. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add the following **Environment Variables**:
   - `GEMINI_API_KEY`: *(Required)* Your Google Gemini API key.
   - `DATABASE_URL`: *(Optional)* Connection URI to a PostgreSQL database (e.g. Render PostgreSQL or Neon DB). If omitted, the service will fall back to SQLite.
   - `CHANNEL_SERVICE_URL`: The URL of your deployed Channel Simulator service.

#### 2. Channel Simulator Service (FastAPI) on Render
1. Create a new **Web Service** on Render and connect your repository.
2. Configure the service:
   - **Root Directory**: `channel-service`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add the following **Environment Variables**:
   - `DATABASE_URL`: *(Optional)* Connection URI to a PostgreSQL database.
   - `CRM_CALLBACK_URL`: `https://<your-backend-render-url>/api/receipts`

#### 3. Frontend App (Next.js) on Vercel
1. Import your repository into Vercel.
2. Configure the project:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Next.js`
3. Add the following **Environment Variable**:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed Backend service (e.g. `https://your-backend.onrender.com`).

---


### Method B: Manual Local Setup

#### 1. Setup Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Unix/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env # Set your GEMINI_API_KEY
python -m app.db.seed # Seed initial 1,000 customers, products, and order histories
python -m uvicorn app.main:app --reload --port 8000
```

#### 2. Setup Channel Simulator
```bash
cd channel-service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Unix/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8001
```

#### 3. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the web console.

---

## 🔌 Core API Documentation

### CRM Backend (`:8000`)
- **Customers**: `GET /customers` — Search, query, and paginate customers.
- **Products**: `GET /products` — Retrieve beauty/skincare product catalogs.
- **Campaigns**:
  - `GET /campaigns` — Fetch lists of campaigns.
  - `POST /campaigns` — Create custom target audiences and campaign drafts.
  - `POST /campaigns/send` — Dispatches message dispatch list to simulator.
- **Datasets**:
  - `GET /datasets` — List dataset files and sizes.
  - `POST /datasets/upload` — Upload CSV customer and transaction histories.
- **AI Copilot**:
  - `POST /ai/intelligence` — Generate database-wide intelligence summaries.
  - `POST /ai/opportunities` — Retrieve Gemini-generated marketing opportunities.
  - `POST /ai/segments` — Generate query-matching segment criteria.
  - `POST /ai/channels` — Retrieve predicted channel channel scores.
  - `POST /ai/messages` — Build copywriting variations.

### Channel Simulator (`:8001`)
- **Simulate Dispatch**: `POST /send` — Accepts delivery target payload. Simulates user behavior ticks over time.
- **Health**: `GET /health` — Verifies simulator is responsive.
- **Test Sandbox**: `POST /test-send` — Sandbox endpoint for validating communication payloads.
