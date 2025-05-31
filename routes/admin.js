// routes/admin.js
import express from 'express'
import db from '../models/db.js'

const router = express.Router()

router.delete('/clear-db', async (req, res) => {
  console.log('Clear DB route hit'); // Add this

  const { name, passcode } = req.body;

  if (name !== 'Yasin' || passcode !== 'Yasin123') {
    return res.status(401).json({ message: 'Unauthorized: invalid credentials' });
  }

  try {
    await db.read();
    db.data.users = [];
    db.data.jobs = [];
    await db.write();

    res.json({ message: 'All user and job data has been deleted successfully' });
  } catch (err) {
    console.error('Error clearing DB:', err); // Add this
    res.status(500).json({ message: 'Failed to clear database' });
  }
});


export default router
