import { Router } from 'express';
import { 
  getScheduleTemplates,
  getScheduleTemplate,
  createScheduleTemplate,
  updateScheduleTemplate,
  deleteScheduleTemplate,
  setDefaultTemplate
} from '../controllers/scheduleTemplateController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/schedule-templates - List templates for gym
router.get('/', getScheduleTemplates);

// GET /api/schedule-templates/:id - Get single template
router.get('/:id', getScheduleTemplate);

// POST /api/schedule-templates - Create new template
router.post('/', createScheduleTemplate);

// PUT /api/schedule-templates/:id - Update template
router.put('/:id', updateScheduleTemplate);

// DELETE /api/schedule-templates/:id - Delete template
router.delete('/:id', deleteScheduleTemplate);

// POST /api/schedule-templates/:id/set-default - Set as default template
router.post('/:id/set-default', setDefaultTemplate);

export default router;