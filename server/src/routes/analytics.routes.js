import { Router } from 'express';
import {
  getSummary, getMonthlyTrend, getBySupplier, getByStatus, getByCategory,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/summary',     getSummary);
router.get('/monthly',     getMonthlyTrend);
router.get('/by-supplier', getBySupplier);
router.get('/by-status',   getByStatus);
router.get('/by-category', getByCategory);

export default router;
