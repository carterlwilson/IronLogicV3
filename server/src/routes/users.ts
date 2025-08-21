import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
} from '../controllers/userController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Apply admin-only access to all routes
router.use(requireAdmin);

// GET /api/users - List users with pagination, filtering, sorting
router.get('/', getUsers);

// GET /api/users/:id - Get single user
router.get('/:id', getUser);

// POST /api/users - Create new user
router.post('/', createUser);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Soft delete user
router.delete('/:id', deleteUser);

// POST /api/users/:id/reset-password - Admin password reset
router.post('/:id/reset-password', resetUserPassword);

export default router;