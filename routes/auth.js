// routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/db.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { name, username, email, password, number, role } = req.body;

  if (!name || !username || !email || !password || !role) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  await db.read();
  const existingUser = db.data.users.find(
    u => u.email === email || u.username === username
  );
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: uuidv4(),
    name,
    username,
    email,
    password: hashedPassword,
    number: number || '',
    role,
    resumeDescription: '',
    companyDescription: '',
    jobsPosted: [],
    appliedJobs: []
  };

  db.data.users.push(newUser);
  await db.write();

  res.status(201).json({ message: 'User registered successfully', userId: newUser.id });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  await db.read();
  const user = db.data.users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const { password: pw, ...userData } = user;
  res.status(200).json({ message: 'Login successful', user: userData, userId: user.id });
});

export default router;
