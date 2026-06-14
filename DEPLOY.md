# Dewy Deployment Guide

Dewy consists of three services:
1. **Frontend**: Next.js client application (React, Tailwind CSS, Lucide icons).
2. **Backend**: FastAPI backend server (Gemini API integration, SQLAlchemy database logic).
3. **Channel Service**: Simulated communications delivery agent (handles WhatsApp, Email, SMS simulators and callbacks).

---

## Prerequisites
- [Docker](https://www.docker.com/) (with Docker Compose v2+) installed on the target machine.
- A **Google Gemini API Key** (retrieve one from [Google AI Studio](https://aistudio.google.com/)).

---

## 🚀 Deployment with Docker Compose (Recommended)

Docker Compose is the easiest way to launch the entire application stack in a containerized environment.

### 1. Configure Environment Variables
Copy the root `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```
Open `.env` and configure your API key:
```ini
GEMINI_API_KEY=AIzaSy...
```

### 2. Launch the Application Stack
From the project root, run:
```bash
docker-compose up --build -d
```
This command will:
- Build the optimized Docker images for the frontend, backend, and channel-service.
- Set up SQLite database files inside persistent Docker volumes (`backend-data` and `channel-data`).
- Expose the following ports:
  - **Frontend**: [http://localhost:3000](http://localhost:3000)
  - **Backend API**: [http://localhost:8000](http://localhost:8000)
  - **Channel Service API**: [http://localhost:8001](http://localhost:8001)

### 3. Check Logs
To monitor the logs and ensure all services started correctly:
```bash
docker-compose logs -f
```

---

## 🛠️ Individual Service Configurations

If you prefer to deploy services separately (e.g., on Vercel, Render, AWS, Heroku, etc.), configure the environment variables as follows:

### Backend Service (`backend/`)
- **`GEMINI_API_KEY`**: (Required) Google Gemini API Key.
- **`DATABASE_URL`**: (Optional) Connection URL. Defaults to SQLite (`sqlite:///./dewy.db`). For PostgreSQL: `postgresql://user:password@host:5432/dbname`.
- **`CHANNEL_SERVICE_URL`**: (Required) URL of the simulator service. (e.g., `http://localhost:8001` or dynamic service address).
- **`PORT`**: Port to run on (defaults to `8000`).

### Channel Simulator Service (`channel-service/`)
- **`DATABASE_URL`**: Defaults to `sqlite:///./channel_service.db`.
- **`CRM_CALLBACK_URL`**: (Required) Endpoint in the backend where delivery callbacks are sent. Usually `http://<backend-url>/api/receipts`.
- **`CALLBACK_TIMEOUT_SECONDS`**: Interval between webhook simulator ticks (default `10`).

### Frontend App (`frontend/`)
- **`NEXT_PUBLIC_API_URL`**: (Required) Publicly accessible URL of the backend API server. If deploying to custom domains, specify `https://api.yourdomain.com`.
  > [!NOTE]
  > Since `NEXT_PUBLIC_` variables are baked in during Next.js build time, this must be set **before** or **during** the build stage (`docker build --build-arg NEXT_PUBLIC_API_URL=...`).

---

## 🔒 Production Considerations

1. **CORS Restrictions**:
   In `backend/app/main.py`, the `allow_origins` parameter is set to `["*"]` by default. In a production environment, restrict this to the exact domain name of your frontend:
   ```python
   allow_origins=["https://dewy.yourdomain.com"]
   ```

2. **API Endpoint Security**:
   Ensure you serve all backend APIs and callback endpoints over `HTTPS` to protect user database payloads and API keys.

3. **External Database**:
   Instead of SQLite container volumes, provision a production-grade managed PostgreSQL database and feed the connection strings into both `DATABASE_URL` fields.
