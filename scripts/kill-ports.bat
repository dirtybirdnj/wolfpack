@echo off
REM Kill any processes using ports 3000 and 8080 (Windows version)

echo Checking for processes on ports 3000 and 8080...
echo.

REM Check port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do (
  echo Found process on port 3000 (PID: %%a)
  taskkill /F /PID %%a
  echo Killed process on port 3000
  goto :port8080
)
echo Port 3000 is free

:port8080
REM Check port 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8080"') do (
  echo Found process on port 8080 (PID: %%a)
  taskkill /F /PID %%a
  echo Killed process on port 8080
  goto :done
)
echo Port 8080 is free

:done
echo.
echo Ports are clear! You can now run: npm run dev
pause
