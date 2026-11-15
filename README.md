# Campus Resource Booking Lite

Students register/log in first, then view resources, book one for a date, and see all bookings. The same resource cannot be booked twice on the same day. Auth uses JWT; passwords are hashed with bcrypt.

**Stack:** React + Vite, Node.js, Express, MongoDB (Mongoose). Frontend on Vercel, backend on Render.

## Environment variables

| Where | Variable | Example |
|---|---|---|
| Backend (`backend/.env` locally, Render dashboard in production) | `MONGO_URI` | `mongodb+srv://USER:PASSWORD@cluster0.xxxx.mongodb.net/campus-booking` |
| Backend | `PORT` | `5000` (Render sets this automatically) |
| Backend | `JWT_SECRET` | any long random string, e.g. output of `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| Backend | `CLIENT_URL` | `https://your-app.vercel.app` (no trailing slash) |
| Frontend (Vercel dashboard, or `frontend/.env.local`) | `VITE_API_URL` | `https://your-api.onrender.com/api` |

Locally, `VITE_API_URL` is optional: the frontend falls back to `http://localhost:5000/api`.
`.env` files are in `.gitignore` and must never be committed.

## Run locally

1. Install Node.js 20+.
2. Create `backend/.env`:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/campus-booking
   PORT=5000
   JWT_SECRET=any_long_random_string
   ```
   (or your MongoDB Atlas connection string)
3. From the `campus-booking` folder (the one containing `package.json`):
   ```
   npm install
   npm run server     # backend  -> http://localhost:5000
   npm run client     # frontend -> http://localhost:5173 (second terminal)
   ```
   The backend only accepts browser requests from `localhost:5173`, `localhost:5174`, and `CLIENT_URL`.
4. Production build check: `npm run build` (output in `frontend/dist`).

## Deploy

### 1. MongoDB Atlas
- Create a free cluster, a database user, and copy the connection string (Connect → Drivers).
- Network Access → allow `0.0.0.0/0` (Render's IP addresses change).

### 2. Backend on Render
- New → Web Service → connect this GitHub repo. Runtime: Node. Root directory: leave empty.
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: `MONGO_URI`, `JWT_SECRET` (do not set `PORT`; Render provides it).
- Health check path (optional): `/api/health`
- After deploy, test: `https://your-api.onrender.com/api/health` → `{"status":"ok"}`
- Free Render services sleep when idle; the first request can take ~30–60 seconds.

### 3. Frontend on Vercel
- New Project → import this repo. Root directory: leave as the repo root.
- Framework preset: Other. Build command: `npm run build`. Output directory: `frontend/dist`. Install command: `npm install`.
- Environment variable: `VITE_API_URL=https://your-api.onrender.com/api`
- Deploy, then copy the Vercel URL (e.g. `https://your-app.vercel.app`, no trailing slash).

### 4. Connect them
- In Render → Environment, add `CLIENT_URL=https://your-app.vercel.app` and save (Render redeploys).
- Open the Vercel URL, register, log in, and make a booking.

Note: Vite bakes `VITE_API_URL` in at build time, so redeploy Vercel after changing it.

## API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/health | Returns `{ "status": "ok" }` |
| GET | /api/resources | List resources |
| POST | /api/register | Create user `{ username, password }` |
| POST | /api/login | Returns `{ token, username }` |
| GET | /api/bookings | List bookings (needs `Authorization: Bearer <token>`) |
| POST | /api/bookings | Create booking `{ resource, bookingDate }` (needs token; 409 if duplicate) |
