# Campus Resource Booking Lite

Students can view resources, register/login, book one for a date, and see all bookings. The same resource cannot be booked twice on the same day. Only logged-in users can book (JWT auth, passwords hashed with bcrypt).

**Stack:** React + Vite, Node.js, Express, MongoDB, Mongoose.

## Setup

1. Install Node.js 20+ and MongoDB (local install or a free MongoDB Atlas cluster).
2. Put your connection string in `backend/.env`:
   ```
   MONGO_URI=mongodb://127.0.0.1:27017/campus-booking
   PORT=5000
   JWT_SECRET=any_long_random_string
   ```
   For Atlas, use the `mongodb+srv://...` string from Atlas → Connect → Drivers.
3. Install dependencies (from the `campus-booking` folder):
   ```
   npm install
   ```

## Run

Terminal 1 (backend, http://localhost:5000):
```
npm run server
```
Terminal 2 (frontend, http://localhost:5173):
```
npm run client
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | /api/resources | List resources |
| GET | /api/bookings | List bookings |
| POST | /api/register | Create user `{ username, password }` |
| POST | /api/login | Returns `{ token, username }` |
| POST | /api/bookings | **Needs** `Authorization: Bearer <token>`. Body `{ resource, bookingDate }` (409 if duplicate) |
