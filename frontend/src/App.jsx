import React, { useEffect, useState } from 'react';
import './style.css';

const API = 'http://localhost:5000/api';

export default function App() {
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ resource: '', bookingDate: '' });
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  // Logged-in user ({ token, username }) is kept in localStorage so a refresh keeps you logged in
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [message, setMessage] = useState({ text: '', type: '' });

  const loadBookings = () =>
    fetch(`${API}/bookings`).then((r) => r.json()).then(setBookings);

  // Runs once when the page loads
  useEffect(() => {
    fetch(`${API}/resources`).then((r) => r.json()).then(setResources)
      .catch(() => setMessage({ text: 'Cannot reach server', type: 'error' }));
    loadBookings();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleAuthChange = (e) => setAuthForm({ ...authForm, [e.target.name]: e.target.value });

  // type is 'login' or 'register'
  const handleAuth = async (type) => {
    const res = await fetch(`${API}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authForm),
    });
    const data = await res.json();
    if (!res.ok) return setMessage({ text: data.message, type: 'error' });
    if (type === 'register') return setMessage({ text: data.message, type: 'success' });
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    setAuthForm({ username: '', password: '' });
    setMessage({ text: '', type: '' });
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setMessage({ text: '', type: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage({ text: 'Booking successful!', type: 'success' });
      setForm({ resource: '', bookingDate: '' });
      loadBookings();
    } else {
      if (res.status === 401) logout(); // token expired or invalid
      setMessage({ text: data.message, type: 'error' });
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Campus Resource Booking</h1>
        {user && <p>Hi, {user.username} <button className="logout" onClick={logout}>Logout</button></p>}
      </header>

      <h2>Resources</h2>
      <div className="cards">
        {resources.map((r) => <div className="card" key={r}>{r}</div>)}
      </div>

      {user ? (
        <>
          <h2>Book a Resource</h2>
          <form onSubmit={handleSubmit}>
            <select name="resource" value={form.resource} onChange={handleChange} required>
              <option value="">Select resource</option>
              {resources.map((r) => <option key={r}>{r}</option>)}
            </select>
            <input type="date" name="bookingDate" value={form.bookingDate} onChange={handleChange} required />
            <button type="submit">Book</button>
          </form>
        </>
      ) : (
        <>
          <h2>Login to Book</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleAuth('login'); }}>
            <input name="username" placeholder="Username" value={authForm.username} onChange={handleAuthChange} required />
            <input type="password" name="password" placeholder="Password" value={authForm.password} onChange={handleAuthChange} required />
            <button type="submit">Login</button>
            <button type="button" onClick={() => handleAuth('register')}>Register</button>
          </form>
        </>
      )}
      {message.text && <p className={message.type}>{message.text}</p>}

      <h2>All Bookings</h2>
      <table>
        <thead><tr><th>Student</th><th>Resource</th><th>Date</th></tr></thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}><td>{b.studentName}</td><td>{b.resource}</td><td>{b.bookingDate}</td></tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && <p>No bookings yet.</p>}
    </div>
  );
}
