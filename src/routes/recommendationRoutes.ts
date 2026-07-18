import express from 'express';
import { getRecommendation } from '../controllers/recommendationController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getRecommendation);

export default router;
