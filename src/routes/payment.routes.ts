import express from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  initiateBkashPayment,
  executeBkashPayment,
  queryBkashPayment
} from '../controllers/payment.controller';

const router = express.Router();

router.post('/bkash/create', protect, initiateBkashPayment);
router.post('/bkash/execute', protect, executeBkashPayment);
router.get('/bkash/query/:paymentID', protect, queryBkashPayment);

export default router;
