import { Router } from 'express';
import {
  getBenchmarkTemplates,
  getBenchmarkTemplateById,
  createBenchmarkTemplate,
  updateBenchmarkTemplate,
  deleteBenchmarkTemplate,
  getBenchmarkTags
} from '../controllers/benchmarkTemplateController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/benchmark-templates/tags - Get distinct tags (must come before :id route)
router.get('/tags', getBenchmarkTags);

// GET /api/benchmark-templates - List benchmark templates with filtering and pagination
router.get('/', getBenchmarkTemplates);

// GET /api/benchmark-templates/:id - Get single benchmark template
router.get('/:id', getBenchmarkTemplateById);

// POST /api/benchmark-templates - Create new benchmark template
router.post('/', createBenchmarkTemplate);

// PUT /api/benchmark-templates/:id - Update benchmark template
router.put('/:id', updateBenchmarkTemplate);

// DELETE /api/benchmark-templates/:id - Delete benchmark template
router.delete('/:id', deleteBenchmarkTemplate);

export default router;