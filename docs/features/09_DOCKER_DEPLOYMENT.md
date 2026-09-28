# Feature Specification: Docker Compose Deployment

## 1. Overview
To ensure a smooth evaluation at SIH 2026, the entire VASP Attribution Engine will be containerized. A single `docker-compose up -d` command will launch the Redis datastore, Python FastAPI backend, Python background worker, and Next.js frontend.

## 2. Dockerfiles

### 2.1 `backend/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y gcc curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Expose FastAPI port
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 `frontend/Dockerfile`
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 3. Docker Compose Configuration

### 3.1 `docker-compose.yml`
```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app

  worker:
    build:
      context: ./backend
    command: python -m app.worker
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next

volumes:
  redis_data:
```

## 4. Startup Scripts

### 4.1 `start.sh` (Linux/Mac)
```bash
#!/bin/bash
echo "Starting SIH26182 VASP Attribution Engine..."
docker-compose up -d --build
echo "Platform is running at http://localhost:3000"
```

### 4.2 `start_windows.bat` (Windows)
```bat
@echo off
echo Starting SIH26182 VASP Attribution Engine...
docker-compose up -d --build
echo Platform is running at http://localhost:3000
pause
```

## 5. Ignore Files

### 5.1 `backend/.dockerignore`
```
__pycache__
*.pyc
.env
.venv
venv/
.git
```

### 5.2 `frontend/.dockerignore`
```
node_modules
.next
.git
.env
```

## 6. Environment Variables (`.env`)
```env
REDIS_URL=redis://redis:6379/0
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_API_URL=http://localhost:8000
```
