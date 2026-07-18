import express from 'express';
import { createResume, getCareerRecommendations, parseResume, chatWithAI } from '../controllers/aiController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/generate-resume
router.post('/generate-resume', createResume);

// POST /api/ai/recommend-careers
router.post('/recommend-careers', getCareerRecommendations);

// POST /api/ai/analyze-resume
router.post('/analyze-resume', parseResume);

// POST /api/ai/chat  (SSE streaming)
router.post('/chat', chatWithAI);

export default router;
