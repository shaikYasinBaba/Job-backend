import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../models/db.js'

const router = express.Router()

// Create a new job (employer)
router.post('/', async (req, res) => {
  const {
    employerId,
    title,
    position,
    company,
    duration,
    salary,
    location,
    jobDescription,
    recruiterName
  } = req.body

  if (!employerId || !title || !position || !company) {
    return res.status(400).json({ message: 'Missing required fields' })
  }

  await db.read()

  // Check if employer exists and role is employer
  const employer = db.data.users.find(u => u.id === employerId && u.role === 'employer')
  if (!employer) {
    return res.status(404).json({ message: 'Employer not found or invalid role' })
  }

  const newJob = {
    id: uuidv4(),
    employerId,
    title,
    position,
    company,
    duration: duration || '',
    salary: salary || '',
    location: location || '',
    jobDescription: jobDescription || '',
    recruiterName: recruiterName || '',
    applications: [] // to store { applicantId, status }
  }

  db.data.jobs.push(newJob)

  // Add this job to employer's jobsPosted
  employer.jobsPosted.push(newJob.id)

  await db.write()

  res.status(201).json({ message: 'Job posted successfully', job: newJob })
})

// Get all jobs
router.get('/', async (req, res) => {
  await db.read()
  res.status(200).json(db.data.jobs)
})

// Get job by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params
  await db.read()
  const job = db.data.jobs.find(j => j.id === id)
  if (!job) return res.status(404).json({ message: 'Job not found' })
  res.status(200).json(job)
})

// Get jobs by employer ID
router.get('/employer/:employerId', async (req, res) => {
  const { employerId } = req.params
  await db.read()
  const employerJobs = db.data.jobs.filter(j => j.employerId === employerId)
  res.status(200).json(employerJobs)
})

// Apply for a job (jobseeker)
router.post('/:jobId/apply', async (req, res) => {
  const { jobId } = req.params
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required to apply' })
  }

  await db.read()

  const job = db.data.jobs.find(j => j.id === jobId)
  if (!job) return res.status(404).json({ message: 'Job not found' })

  const user = db.data.users.find(u => u.id === userId && u.role === 'jobseeker')
  if (!user) return res.status(404).json({ message: 'Jobseeker not found' })

  // Check if already applied
  const existingApp = job.applications.find(app => app.applicantId === userId)
  if (existingApp) {
    return res.status(400).json({ message: 'Already applied to this job' })
  }

  // Add application with initial status 'applied'
  job.applications.push({ applicantId: userId, status: 'applied' })
  user.appliedJobs.push({ jobId, status: 'applied' })

  await db.write()

  res.status(200).json({ message: 'Applied to job successfully' })
})

// Update application status (employer)
router.put('/:jobId/applications/:applicantId/status', async (req, res) => {
  const { jobId, applicantId } = req.params
  const { status } = req.body

  const validStatuses = ['applied', 'viewed', 'selected for next step', 'rejected']

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ message: `Status is required and must be one of: ${validStatuses.join(', ')}` })
  }

  await db.read()

  const job = db.data.jobs.find(j => j.id === jobId)
  if (!job) return res.status(404).json({ message: 'Job not found' })

  const application = job.applications.find(app => app.applicantId === applicantId)
  if (!application) return res.status(404).json({ message: 'Application not found' })

  const user = db.data.users.find(u => u.id === applicantId && u.role === 'jobseeker')
  if (!user) return res.status(404).json({ message: 'Jobseeker not found' })

  // Update status in job applications
  application.status = status

  // Update status in user appliedJobs
  const userApp = user.appliedJobs.find(a => a.jobId === jobId)
  if (userApp) userApp.status = status

  await db.write()

  res.status(200).json({ message: 'Application status updated' })
})

  // Delete a job post (employer)
// Delete a job post (employer)
router.delete('/:id', async (req, res) => {
  const jobId = req.params.id;  // ✅ FIXED
  const { employerId } = req.body;

  if (!employerId) {
    return res.status(400).json({ message: 'Employer ID is required' });
  }

  await db.read();

  const jobIndex = db.data.jobs.findIndex(j => j.id === jobId);
  if (jobIndex === -1) return res.status(404).json({ message: 'Job not found' });

  const job = db.data.jobs[jobIndex];

  if (job.employerId !== employerId) {
    return res.status(403).json({ message: 'You are not authorized to delete this job' });
  }

  // Remove job from jobs list
  db.data.jobs.splice(jobIndex, 1);

  // Remove job reference from employer's jobsPosted
  const employer = db.data.users.find(u => u.id === employerId && u.role === 'employer');
  if (employer) {
    employer.jobsPosted = employer.jobsPosted.filter(id => id !== jobId);
  }

  await db.write();

  res.status(200).json({ message: 'Job deleted successfully' });
});

// Get all applicants for a specific job (employer view)
router.get('/:jobId/applications', async (req, res) => {
  const { jobId } = req.params;
  const { employerId } = req.query;

  if (!employerId) {
    return res.status(400).json({ message: 'Employer ID is required' });
  }

  await db.read();

  const job = db.data.jobs.find(j => j.id === jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  if (job.employerId !== employerId) {
    return res.status(403).json({ message: 'Unauthorized: You do not own this job posting' });
  }

  // If no applications yet
  if (!Array.isArray(job.applications) || job.applications.length === 0) {
    return res.status(200).json([]);
  }

  const applicants = job.applications.map(application => {
    const user = db.data.users.find(u => u.id === application.applicantId);

    if (!user) return null; // Just in case user was deleted or invalid reference

    return {
      applicantId: user.id,
      name: user.name,
      email: user.email,
      number: user.number,
      resumeDescription: user.resumeDescription,
      status: application.status,
    };
  }).filter(Boolean); // Remove nulls if any

  res.status(200).json(applicants);
});


// Get all jobs a user has applied to (jobseeker view)
router.get('/user/:userId/applied-jobs', async (req, res) => {
  const { userId } = req.params;

  await db.read();

  const user = db.data.users.find(u => u.id === userId && u.role === 'jobseeker');
  if (!user) return res.status(404).json({ message: 'Jobseeker can only apply. and Job' });

  const appliedJobs = user.appliedJobs.map(app => {
    const job = db.data.jobs.find(j => j.id === app.jobId);
    return {
      jobId: app.jobId,
      status: app.status,
      title: job?.title || 'Unknown',
      company: job?.company || '',
      location: job?.location || '',
      recruiterName: job?.recruiterName || '',
    };
  });

  res.status(200).json(appliedJobs);
});


export default router
