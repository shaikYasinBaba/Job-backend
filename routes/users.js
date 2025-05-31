// routes/users.js
import express from 'express';
import db from '../models/db.js';

const router = express.Router();

// Get user by ID
router.get('/:id', async (req, res) => {
  const userId = req.params.id;
  await db.read();

  const user = db.data.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { password, ...userData } = user;
  res.status(200).json(userData);
});

// Update user by ID
router.put('/:id', async (req, res) => {
  const userId = req.params.id;
  const updates = req.body;

  await db.read();
  const userIndex = db.data.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return res.status(404).json({ message: 'User not found' });

  delete updates.password;

  db.data.users[userIndex] = {
    ...db.data.users[userIndex],
    ...updates
  };

  await db.write();

  const { password, ...updatedUser } = db.data.users[userIndex];
  res.status(200).json({ message: 'Profile updated', user: updatedUser });
});

// 1) LIST ALL USERS (jobseekers only)
router.get('/', async (req, res) => {
  await db.read();
  // only return jobseekers
  const users = db.data.users
    .filter(u => u.role === 'jobseeker')
    .map(({ password, ...u }) => u);
  res.status(200).json(users);
});

// —————————————————————————————————————————


export default router;
