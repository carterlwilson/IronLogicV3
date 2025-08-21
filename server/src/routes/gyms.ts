import { Router } from 'express';
import { authenticateToken, requireRole, requireAdmin } from '../middleware/auth';
import {
  getGyms,
  getGym,
  createGym,
  updateGym,
  deleteGym,
  getGymStats
} from '../controllers/gymController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/gyms - List gyms (admin: all, owner: their gym)
router.get('/', requireRole(['admin', 'gym_owner']), getGyms);

// GET /api/gyms/:id - Get single gym with locations
router.get('/:id', requireRole(['admin', 'gym_owner']), getGym);

// POST /api/gyms - Create new gym (admin only)
router.post('/', requireAdmin, createGym);

// PUT /api/gyms/:id - Update gym details
router.put('/:id', requireRole(['admin', 'gym_owner']), updateGym);

// DELETE /api/gyms/:id - Soft delete gym (admin only)
router.delete('/:id', requireAdmin, deleteGym);

// GET /api/gyms/:id/stats - Gym statistics
router.get('/:id/stats', requireRole(['admin', 'gym_owner']), getGymStats);

export default router;