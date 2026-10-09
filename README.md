# DIGITAL ATTENDANCE SYSTEM

Digital Attendance System is a final-year college project that combines a React web application, an Express and MongoDB backend, and an InsightFace-powered Python service. It supports attendance workflows for students, faculty, and administrators, including face enrollment, selfie verification, and group-photo recognition.

## Main Features

- Role-based student, faculty, and administrator workflows.
- Subject creation, enrollment, status management, and membership changes.
- Group-photo attendance with AI-assisted face matching.
- Student selfie attendance and face verification.
- Attendance review, approval, finalization, history, and records.
- Faculty approval and user administration.
- Password reset through email OTP.
- Campus geofencing support for relevant attendance flows.

## Role Features

### Students

- Register and sign in.
- View available subjects and join or leave subjects.
- Enroll a face image for recognition.
- Mark attendance with selfie verification.
- View attendance history and subject information.

### Faculty

- Create and manage subjects.
- View enrolled students and pending attendance.
- Submit group-photo attendance.
- Review, approve, reject, and finalize attendance.
- View attendance records and faculty profile information.

### Administrators

- View system settings and all users.
- Review and approve or reject faculty accounts.
- View faculty and attendance information.
- Access administrator-protected operations.

## AI Face Recognition Workflow

1. A student uploads a single-face image through the frontend.
2. The backend sends the image to the FastAPI `/enroll` endpoint.
3. InsightFace detects the face and generates an embedding stored with the student record.
4. For selfie or group attendance, the backend sends an image and enrolled embeddings to `/recognize`.
5. The AI service detects faces, compares embeddings, and returns student matches and similarity values.
6. The backend applies the attendance workflow and role, faculty-status, and location rules.

## Technology Stack

- Frontend: React 19, Vite, Axios, JavaScript.
- Backend: Node.js, Express, Mongoose, MongoDB, JWT, bcryptjs, Nodemailer.
- AI service: Python, FastAPI, OpenCV, NumPy, InsightFace, ONNX Runtime.
- API testing and documentation assets: Postman collections in `postman/`.

## Project Architecture

```text
client/       React and Vite browser application
server/       Express API, authentication, business logic, and models
face-service/ FastAPI face detection and recognition service
postman/      API collections, environments, flows, and specifications
```

The frontend calls the backend API. The backend owns authentication, authorization, MongoDB persistence, attendance rules, email OTP delivery, and communication with the AI service. The AI service performs image processing and embedding comparison.

## Backend and API Overview

The Express server runs on port `5000` by default and exposes:

- `/api/auth`: registration, login, password-reset OTP, OTP verification, and password reset.
- `/api/user`: profile access, faculty profile, administrator access, and student face enrollment.
- `/api/subjects`: subject creation, discovery, joining, leaving, status updates, and deletion.
- `/api/attendance`: attendance submission, group recognition, review, finalization, records, history, and selfie verification.
- `/api/admin`: settings, users, faculty listing, and faculty approval or rejection.

The FastAPI service runs on port `8000` by default and exposes `/health`, `/enroll`, and `/recognize`.

## Database Overview

MongoDB stores users, subjects, attendance records, roles, faculty status, and enrolled face embeddings through the Mongoose models in `server/models/`. Set `MONGO_URI` to a local or managed MongoDB database before starting the backend.

## Authentication and Security

- JWT tokens protect authenticated routes.
- Role middleware restricts student, faculty, and administrator operations.
- Passwords are hashed with bcryptjs.
- Password reset uses an email OTP workflow.
- CORS is restricted through `CLIENT_URL`.
- Secrets, SMTP credentials, and database URLs must be supplied through deployment secrets.
- Face and group images are uploaded to Cloudinary; MongoDB stores each asset's HTTPS `secure_url` in `User.facePhotoUrl` and `Attendance.groupPhotoUrl`.
- Do not place backend secrets in `VITE_*` variables because frontend variables are sent to the browser.

## Prerequisites

- Node.js 20 or newer and npm.
- Python 3.11 or a compatible version for the installed InsightFace and ONNX Runtime wheels.
- MongoDB running locally or a reachable MongoDB deployment.
- An SMTP account for password-reset email.
- A camera and browser geolocation permission for applicable attendance flows.

## Setup and Run

### Frontend

```powershell
cd client
npm install
Copy-Item .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to the backend API URL, normally `http://localhost:5000/api`.

### Backend

```powershell
cd server
npm install
Copy-Item .env.example .env
npm start
```

Use `npm run dev` for automatic restart during development. Populate `server/.env` with the required local values before starting the API.

### Python AI Service

```powershell
cd face-service
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

Start the AI service before using face enrollment or recognition. Its health check is available at `http://127.0.0.1:8000/health`.

## Required Environment Variables

Create local environment files from the examples. Never commit real values.

### Backend `server/.env`

- `PORT`
- `CLIENT_URL`
- `MONGO_URI`
- `JWT_SECRET`
- `FACE_SERVICE_URL`
- `FACE_SERVICE_TOKEN`
- `CAMPUS_LATITUDE`, `CAMPUS_LONGITUDE`, `CAMPUS_RADIUS`
- `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`, `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`
- `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` when running the admin setup script

### Frontend `client/.env`

- `VITE_API_BASE_URL`

## Production Deployment

The frontend is a Vite static site, and the backend and face service are separate Render web services. Images use Cloudinary object storage so their URLs persist across service restarts and deployments. Use HTTPS URLs and keep all private values in the relevant provider's environment settings.

### Render AI service

- Root Directory: `face-service`
- Runtime: Python 3
- Python version: `3.11.11` (pinned in `.python-version`)
- Environment setting: `PYTHON_VERSION=3.11.11` (optional when Render reads `.python-version`)
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Health Check Path: `/health`
- Environment variable: `FACE_SERVICE_TOKEN` (same value as the backend)

### Render backend service

- Root Directory: `server`
- Runtime: Node
- Node version: `24.21.0` (pinned in `.node-version`)
- Environment setting: `NODE_VERSION=24.21.0` (optional when Render reads `.node-version`)
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/health`
- Set `NODE_ENV=production`; Render supplies `PORT`.
- Set `FACE_SERVICE_URL` to the deployed AI service base URL, without an endpoint path.
- Set the same random `FACE_SERVICE_TOKEN` (at least 32 characters) on the AI service and backend. The backend sends it only to `/enroll` and `/recognize`; `/health` remains available for health checks.
- Set `CLIENT_URL` to the Vercel production origin. Multiple allowed origins can be comma-separated.

### Vercel frontend

- Root Directory: `client`
- Framework Preset: Vite
- Node.js Version: `24.x`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<backend-service>.onrender.com/api`

Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the backend service. The Cloudinary `secure_url` values are HTTPS delivery URLs; by default these assets are publicly retrievable by anyone who has the URL, so configure access controls and privacy notices appropriate for face imagery before production use.

Before switching traffic from an existing deployment, if its `server/uploads/face-photos` and `server/uploads/group-photos` files still exist, run `npm run migrate-uploads` from `server/` with `MONGO_URI` and the three Cloudinary variables set. It replaces old local upload URLs in MongoDB while retaining the same schema fields. Missing local files cannot be recovered by this script; affected users must upload a new face photo, and old group-photo previews will remain unavailable.

Configure MongoDB Atlas network access to allow the backend service, create a database user with only the required database permissions, and set its connection string as `MONGO_URI`. Set `JWT_SECRET` to a random value of at least 32 characters. Set the campus coordinates and Brevo SMTP variables listed above. Create the admin account separately with the `ADMIN_*` variables and run `npm run create-admin` from the backend service directory; do not put those credentials in source control.

Before launch, verify the AI `/health` endpoint, backend `/health` endpoint, registration, email password reset, both image upload flows, login, and attendance workflows from the deployed frontend. Configure backups, monitor resource usage, and restrict the AI service to backend traffic where the hosting plan/network supports it.

## Project Context

This system was developed as a final-year college project to demonstrate full-stack application development, role-based access control, database-backed workflows, email-based account recovery, geolocation checks, and applied AI face recognition for attendance management.
