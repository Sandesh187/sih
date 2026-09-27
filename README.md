# SIH26182 VASP Attribution Engine

A robust, full-stack cryptocurrency tracing and VASP attribution platform.

## Setup Instructions

### 1. Environment Configuration

1. Copy the example environment file in the backend directory:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Open `backend/.env` and add your API keys (Alchemy, TronGrid, Etherscan, etc.).

### 2. Quick Start (Windows)

We've provided a simple batch script that installs dependencies, starts Redis, the backend worker, the API, and the frontend server simultaneously.

1. Double-click or run `start_windows.bat` in the root directory.

### 3. Manual Setup (Any OS)

If you prefer to start services manually or are on Linux/macOS:

**A. Start Redis**
Make sure you have Redis installed and running:
```bash
redis-server --appendonly yes
```

**B. Start Backend API & Worker**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt

# Start the background tracing worker
python -m app.worker &

# Start the FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
```

**C. Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).