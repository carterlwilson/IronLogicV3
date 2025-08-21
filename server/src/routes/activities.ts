import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityGroups
} from '../controllers/activityTemplateController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/activities/groups - Get distinct activity groups (must be before /:id route)
router.get('/groups', getActivityGroups);

// GET /api/activities - List activities with filtering and pagination
router.get('/', getActivities);

// GET /api/activities/:id - Get single activity
router.get('/:id', getActivityById);

// POST /api/activities - Create new activity
router.post('/', createActivity);

// PUT /api/activities/:id - Update activity
router.put('/:id', updateActivity);

// DELETE /api/activities/:id - Soft delete activity
router.delete('/:id', deleteActivity);

export default router;