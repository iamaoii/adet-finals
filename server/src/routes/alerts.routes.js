import { Router } from 'express';
import { listAlerts, resolveAlert } from '../controllers/alerts.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/',              listAlerts);
router.patch('/:id/resolve', resolveAlert);

export default router;
