import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createWeeklySchedule,
  getWeeklySchedules,
  getWeeklyScheduleById,
  updateWeeklySchedule,
  deleteWeeklySchedule,
  enrollClient,
  cancelEnrollment,
  getScheduleStats
} from '../controllers/weeklyScheduleController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get schedule statistics for dashboard
// GET /api/weekly-schedules/stats
router.get('/stats', getScheduleStats);

// Create weekly schedule from template
// POST /api/weekly-schedules
router.post('/', createWeeklySchedule);

// Get all weekly schedules with filtering and pagination
// GET /api/weekly-schedules
router.get('/', getWeeklySchedules);

// Get specific weekly schedule by ID
// GET /api/weekly-schedules/:id
router.get('/:id', getWeeklyScheduleById);

// Update weekly schedule
// PUT /api/weekly-schedules/:id
router.put('/:id', updateWeeklySchedule);

// Delete weekly schedule (soft delete)
// DELETE /api/weekly-schedules/:id
router.delete('/:id', deleteWeeklySchedule);

// Enroll client in timeslot
// POST /api/weekly-schedules/:scheduleId/timeslots/:timeslotId/enroll
router.post('/:scheduleId/timeslots/:timeslotId/enroll', enrollClient);

// Cancel client enrollment
// DELETE /api/weekly-schedules/:scheduleId/timeslots/:timeslotId/clients/:clientId
router.delete('/:scheduleId/timeslots/:timeslotId/clients/:clientId', cancelEnrollment);

export default router;