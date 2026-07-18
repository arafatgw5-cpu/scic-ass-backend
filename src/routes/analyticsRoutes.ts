import express from 'express';
import { getAnalytics, updateAnalytics } from '../controllers/analyticsController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAnalytics)
  .post(updateAnalytics)
  .put(updateAnalytics);

export default router;
