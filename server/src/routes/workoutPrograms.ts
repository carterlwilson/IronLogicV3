import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getWorkoutPrograms,
  getWorkoutProgram,
  createWorkoutProgram,
  updateWorkoutProgram,
  deleteWorkoutProgram,
  copyWorkoutProgram,
  getVolumeCalculations
} from '../controllers/workoutProgramController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/workout-programs - List workout programs with filtering and pagination
router.get('/', getWorkoutPrograms);

// GET /api/workout-programs/:id - Get single workout program by ID
router.get('/:id', getWorkoutProgram);

// POST /api/workout-programs - Create new workout program
router.post('/', createWorkoutProgram);

// PUT /api/workout-programs/:id - Update workout program
router.put('/:id', updateWorkoutProgram);

// DELETE /api/workout-programs/:id - Soft delete workout program
router.delete('/:id', deleteWorkoutProgram);

// POST /api/workout-programs/:id/copy - Copy workout program (create template or duplicate)
router.post('/:id/copy', copyWorkoutProgram);

// GET /api/workout-programs/:id/volume - Get volume calculations for a program
router.get('/:id/volume', getVolumeCalculations);

export default router;