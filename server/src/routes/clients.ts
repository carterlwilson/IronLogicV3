import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import {
  getClients,
  getClient,
  updateClient,
  getClientBenchmarks,
  addClientBenchmark,
  updateClientBenchmark,
  replaceClientBenchmark,
  getClientProgramProgress,
  updateClientProgramProgress
} from '../controllers/clientController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/clients - List clients with filtering/pagination
// Accessible by: admin, gym_owner, coach
router.get('/', requireRole(['admin', 'gym_owner', 'coach']), getClients);

// GET /api/clients/:id - Get client with full profile
// Accessible by: admin, gym_owner, coach, client (own profile only)
router.get('/:id', getClient);

// PUT /api/clients/:id - Update client profile
// Accessible by: admin, gym_owner, coach, client (own profile only)
router.put('/:id', updateClient);

// GET /api/clients/:id/benchmarks - Get client's benchmarks
// Accessible by: admin, gym_owner, coach, client (own benchmarks only)
router.get('/:id/benchmarks', getClientBenchmarks);

// POST /api/clients/:id/benchmarks - Add new benchmark
// Accessible by: admin, gym_owner, coach
router.post('/:id/benchmarks', requireRole(['admin', 'gym_owner', 'coach']), addClientBenchmark);

// PUT /api/clients/:id/benchmarks/:benchmarkId - Update benchmark (24-hour rule)
// Accessible by: admin, gym_owner, coach
router.put('/:id/benchmarks/:benchmarkId', requireRole(['admin', 'gym_owner', 'coach']), updateClientBenchmark);

// POST /api/clients/:id/benchmarks/:benchmarkId/replace - Replace old benchmark
// Accessible by: admin, gym_owner, coach
router.post('/:id/benchmarks/:benchmarkId/replace', requireRole(['admin', 'gym_owner', 'coach']), replaceClientBenchmark);

// GET /api/clients/:id/program-progress - Get current program position
// Accessible by: admin, gym_owner, coach, client (own progress only)
router.get('/:id/program-progress', getClientProgramProgress);

// PUT /api/clients/:id/program-progress - Update program progress
// Accessible by: admin, gym_owner, coach
router.put('/:id/program-progress', requireRole(['admin', 'gym_owner', 'coach']), updateClientProgramProgress);

export default router;