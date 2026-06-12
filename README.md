# Dewy – AI-Native CRM for Beauty Brands

Dewy is a production-quality MVP of an AI-native CRM built specifically for beauty and skincare brands. Instead of manually creating database filters, marketers describe a business goal in natural language (e.g., *"Win back customers who haven't purchased in 90 days"* or *"Sunscreen buyers who have never purchased a moisturizer"*).

Dewy automatically:
1. **Identifies the target customer audience** using Gemini NLP segmentation.
2. **Translates filters to SQLAlchemy queries** to calculate audience size, matching spend, and matches.
3. **Recommends the best communication channel** (WhatsApp, SMS, Email, RCS) with strategic reasoning.
4. **Generates personalized message copy variants** (A, B, C) tailored to the audience and channel.
5. **Launches campaigns** and triggers a separate **Channel Simulator Service** which processes messages.
6. **Simulates asynchronous funnel callbacks** (Sent → Delivered/Failed → Opened → Clicked → Purchased) with randomized delays.
7. **Performs real-time campaign updates** in the CRM database, including simulated product orders on purchase events.
8. **Generates campaign performance insights** and next-best marketing recommendations.

---

## Technical Architecture

```
                 +-----------------------------+
                 |     Next.js 16 Frontend     |
                 |     (Dashboard, Copilot)    |
                 +--------------+--------------+
                                |
                                v
                 +-----------------------------+
                 |    FastAPI CRM Backend      | <---->  Google Gemini API
                 |        (Port 8000)          |
                 +-------+--------------+------+
                         |              ^
                         |              | Callback
                         v              | (/receipt)
+------------+   +-------v--------------+------+
| PostgreSQL |   |  Channel Simulator Service  |
|  Database  |   |        (Port 8001)          |
+------------+   +-----------------------------+
```

---

## Directory Structure

* `/frontend`: Next.js 16 app using React Query, Tailwind CSS, Recharts, and shadcn/ui.
* `/backend`: FastAPI service using SQLAlchemy, Alembic, Pydantic, and PostgreSQL.
* `/channel-service`: Separate FastAPI service simulating communications delivery.
* `/docs`: Project documentation.

---

## Getting Started

### Prerequisites

* Python 3.10+
* Node.js 18+
* PostgreSQL database (or fallback to local SQLite)
* Gemini API Key

### Backend Setup

1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Create virtual environment and install dependencies:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set environment variables in `.env`:
   ```env
   DATABASE_URL=sqlite:///./dewy.db  # Or your PostgreSQL URI
   GEMINI_API_KEY=your_gemini_key
   CHANNEL_SERVICE_URL=http://localhost:8001
   ```
4. Run DB Seeding (generates 1,000 customers, 100 products, 5,000+ orders, and personas like VIP, Dormant, SunCare, AcneCare):
   ```bash
   python -m app.db.seed
   ```
5. Start the CRM Backend:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

### Channel Simulator Setup

1. Navigate to `/channel-service`:
   ```bash
   cd channel-service
   ```
2. Start the Simulator:
   ```bash
   # Re-uses backend venv
   ..\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
   ```

### Frontend Setup

1. Navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) to view the SaaS dashboard!

---

## REST API Documentation

### CRM Backend (Port 8000)
* `GET /health`: Health status.
* `GET /customers`: Filter and search customers.
* `GET /products`: List products.
* `GET /orders`: List order logs.
* `GET /campaigns`: List campaign history.
* `GET /campaigns/{id}`: View campaign detail, funnel counts, logs, and AI insights.
* `POST /campaigns`: Create campaign draft/segment.
* `POST /campaigns/send`: Dispatch campaign.
* `POST /receipt`: Simulator callback updating states.
* `GET /stats`: Aggregated dashboard metrics.
* `POST /ai/segment`: Natural language parsing.
* `POST /ai/message`: Generate campaign message copy variants.
* `POST /ai/recommend-channel`: Retrieve channel recommendations.
* `POST /ai/insights`: Generate AI post-campaign evaluations.

### Channel Simulator (Port 8001)
* `POST /send`: Accept messages and simulate funnel callbacks.
