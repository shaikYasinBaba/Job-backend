import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'


import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import jobRoutes from './routes/jobs.js'
import adminRoutes from './routes/admin.js'

dotenv.config()
const app = express()

const allowedOrigins = [
  'http://localhost:3000',             // dev frontend URL
  'https://job-frontend-1-wl63.onrender.com'   // <-- REPLACE with your real frontend URL
]

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}))

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/admin', adminRoutes)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
