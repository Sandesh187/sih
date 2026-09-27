@echo off
echo ====================================================
echo Starting SIH26182 VASP Attribution Engine...
echo ====================================================

:: Check if backend/.env exists
if not exist "backend\.env" (
    echo [WARNING] backend\.env not found! Copying from backend\.env.example...
    copy "backend\.env.example" "backend\.env"
    echo Please configure your API keys in backend\.env before deploying to production.
)

:: Setup Python Virtual Environment
echo.
echo [1/4] Setting up Python Backend...
cd backend
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Python dependencies...
pip install -r requirements.txt -q
cd ..

:: Setup Node.js Frontend
echo.
echo [2/4] Setting up Node.js Frontend...
cd frontend
echo Installing NPM packages...
call npm install
cd ..

:: Start Services
echo.
echo [3/4] Starting Services...

:: Start Redis (assuming WSL or Redis for Windows is installed)
:: Note: If Redis is not in PATH, this will fail gracefully.
start "Redis Server" cmd /c "redis-server --appendonly yes"

:: Start Python Worker
start "Python Tracing Worker" cmd /k "cd backend && call venv\Scripts\activate && python -m app.worker"

:: Start FastAPI Server
start "FastAPI Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"

:: Start Frontend Server
start "Next.js Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [4/4] Everything is launching!
echo The dashboard will be available at: http://localhost:3000
echo Close the command windows to stop the services.
pause
