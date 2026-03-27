#!/usr/bin/env bash
set -e

echo "Starting Project Lazarus..."

# Install dependencies
pnpm install

# Start API server (port 8080) in background
PORT=8080 pnpm --filter @workspace/api-server run dev &
API_PID=$!

# Wait for API to be ready
sleep 4

# Start frontend (port 5173)
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/lazarus run dev &
FRONTEND_PID=$!

echo ""
echo "Project Lazarus is running:"
echo "   Frontend  ->  http://localhost:5173"
echo "   API       ->  http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
