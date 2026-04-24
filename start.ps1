# Start Backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python manage.py runserver 0.0.0.0:8000"

# Start Frontend in a new window
# Using cmd /c for npm to avoid execution policy issues
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; cmd /c 'npm run dev'"

Write-Host "ProTrack system is starting..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173 (or 5174)" -ForegroundColor Green
