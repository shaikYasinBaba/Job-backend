// index.js
import express from 'express'
import cors from 'cors' // ✅ ADD THIS LINE
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import jobRoutes from './routes/jobs.js'
import adminRoutes from './routes/admin.js'

dotenv.config()
const app = express()

app.use(cors({ origin: 'http://localhost:3000' })) // ✅ ENABLE CORS
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/admin', adminRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
