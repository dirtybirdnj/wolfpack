#!/bin/bash

# Kill any processes using ports 3000 and 8080

echo "🔍 Checking for processes on ports 3000 and 8080..."

# Check port 3000 (API server)
PID_3000=$(lsof -ti:3000)
if [ -n "$PID_3000" ]; then
  echo "❌ Found process on port 3000 (PID: $PID_3000)"
  kill -9 $PID_3000
  echo "✅ Killed process on port 3000"
else
  echo "✓ Port 3000 is free"
fi

# Check port 8080 (Game server)
PID_8080=$(lsof -ti:8080)
if [ -n "$PID_8080" ]; then
  echo "❌ Found process on port 8080 (PID: $PID_8080)"
  kill -9 $PID_8080
  echo "✅ Killed process on port 8080"
else
  echo "✓ Port 8080 is free"
fi

echo ""
echo "✨ Ports are clear! You can now run: npm run dev"
