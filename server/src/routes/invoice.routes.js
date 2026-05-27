import { Router } from 'express';
import {
  uploadInvoice,
  listInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  confirmInvoice,
  togglePaymentStatus,
} from '../controllers/invoice.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/',              upload.single('file'), uploadInvoice);
router.get('/',               listInvoices);
router.get('/:id',            getInvoice);
router.patch('/:id/payment',  togglePaymentStatus);
router.patch('/:id',          updateInvoice);
router.delete('/:id',         deleteInvoice);
router.post('/:id/confirm',   confirmInvoice);


export default router;
