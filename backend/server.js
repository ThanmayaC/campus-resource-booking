import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
// Allow local Vite dev servers + the deployed Vercel site (CLIENT_URL)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', process.env.CLIENT_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Fixed list of resources (no database needed for these)
const resources = ['Projector', 'Laptop', 'Conference Room'];

// One schema: a booking. bookingDate is stored as "YYYY-MM-DD" so one day = one value.
const bookingSchema = new mongoose.Schema({
  studentName: { type: String, required: true, trim: true },
  resource: { type: String, required: true, enum: resources },
  bookingDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
});
// Database-level guarantee: same resource + same day can exist only once
bookingSchema.index({ resource: 1, bookingDate: 1 }, { unique: true });
const Booking = mongoose.model('Booking', bookingSchema);

// User: password is stored only as a bcrypt hash, never as plain text
const User = mongoose.model('User', new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
}));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username?.trim() || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  if (await User.findOne({ username: username.trim() })) {
    return res.status(409).json({ message: 'Username already taken' });
  }
  await User.create({ username, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ message: 'Registered! Please log in.' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username?.trim() });
  if (!user || !(await bcrypt.compare(password || '', user.password))) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }
  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, username: user.username });
});

// Checks the "Authorization: Bearer <token>" header; sets req.user if valid
function auth(req, res, next) {
  try {
    req.user = jwt.verify(req.headers.authorization?.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Please log in first' });
  }
}

// Simple check that the server is up (useful for Render)
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/resources', (req, res) => res.json(resources));

app.get('/api/bookings', auth, async (req, res) => {
  res.json(await Booking.find().sort({ bookingDate: 1 }));
});

// The student name comes from the token, not the form
app.post('/api/bookings', auth, async (req, res) => {
  const { resource, bookingDate } = req.body;
  const studentName = req.user.username;
  if (!resource || !bookingDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const booking = await Booking.create({ studentName, resource, bookingDate });
    res.status(201).json(booking);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: `${resource} is already booked on ${bookingDate}` });
    }
    res.status(400).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => console.error('MongoDB connection failed:', err.message));
