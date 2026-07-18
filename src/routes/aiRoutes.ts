import express from 'express';
import {
  createResume,
  getCareerRecommendations,
  parseResume,
  chatWithAI,
  analyzeImage,
} from '../controllers/aiController';
// import { protect } from '../middlewares/authMiddleware'; // 🔥 সাময়িকভাবে বন্ধ করা হয়েছে (Debugging-এর জন্য)
import { handleImageUpload } from '../middlewares/uploadMiddleware';

const router = express.Router();

// ⚠️ TEMPORARILY DISABLED: সব AI রাউট থেকে অথেনটিকেশন চেক সাময়িকভাবে বন্ধ রাখা হয়েছে
// router.use(protect); 

// POST /api/ai/generate-resume
router.post('/generate-resume', createResume);

// POST /api/ai/recommend-careers
router.post('/recommend-careers', getCareerRecommendations);

// POST /api/ai/analyze-resume
router.post('/analyze-resume', parseResume);

// POST /api/ai/chat  (SSE streaming)
router.post('/chat', chatWithAI);

// POST /api/ai/image  (multipart/form-data, field name: "image", optional "prompt" field)
router.post('/image', handleImageUpload, analyzeImage);

// POST /api/ai/vision  — alias for /image, so the existing frontend works without changes.
router.post('/vision', handleImageUpload, analyzeImage);

export default router;