# Hiigsi Tracker

Hiigsi Tracker is a productivity platform with a Django backend, a Vite web frontend, and an Expo mobile app.

## Stack
- Backend: Django, Django REST Framework, PostgreSQL, WhiteNoise, Gunicorn
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Mobile: Expo, React Native, Expo Router

## Local Development

### Backend
1. `cd backend`
2. Copy `.env.example` to `.env`
3. `python -m pip install -r requirements.txt`
4. `python manage.py migrate`
5. `python manage.py runserver`

### Frontend
1. `cd frontend`
2. Copy `.env.example` to `.env.local`
3. Set `VITE_API_URL=http://localhost:8000/api/`
4. `npm install`
5. `npm run dev`

### Mobile
1. `cd mobile`
2. `npm install`
3. `npx expo start`

## Deployment

### Render backend
- Blueprint file: [render.yaml](/C:/Users/A.Hazan/Desktop/TaskTracker/render.yaml)
- Service root: `backend`
- Build command: `./build.sh`
- Start command: `gunicorn hiigsi.wsgi:application`
- Health check: `/health/`

Set these environment variables in Render:
- `DATABASE_URL`
- `DJANGO_SECRET_KEY`
- `ALLOWED_HOSTS`
- `CORS_ALLOWED_ORIGINS`
- `CSRF_TRUSTED_ORIGINS`
- `WEBAUTHN_RP_ID`
- `WEBAUTHN_ORIGIN`

### Vercel frontend
- Set the Vercel project root directory to `frontend`
- SPA rewrite config is in [frontend/vercel.json](/C:/Users/A.Hazan/Desktop/TaskTracker/frontend/vercel.json)
- Set `VITE_API_URL` in Vercel to your Render API URL, for example `https://your-backend.onrender.com/api/`

## Git Safety
- Root and service-level `.gitignore` files are included
- Local env files, databases, uploads, caches, build output, Expo folders, and `node_modules` are ignored
- Safe example env files are included at [backend/.env.example](/C:/Users/A.Hazan/Desktop/TaskTracker/backend/.env.example) and [frontend/.env.example](/C:/Users/A.Hazan/Desktop/TaskTracker/frontend/.env.example)
