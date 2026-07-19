import express, { Request, Response, RequestHandler } from 'express';
import {
  createResume,
  getCareerRecommendations,
  parseResume,
  chatWithAI,
  analyzeImage,
  textAction,
} from '../controllers/aiController';
// import { protect } from '../middlewares/authMiddleware'; // 🔥 সাময়িকভাবে বন্ধ (Debugging)
import { handleImageUpload } from '../middlewares/uploadMiddleware';

const router = express.Router();

// ⚠️ TEMPORARILY DISABLED
// router.use(protect);

// ─── Startup safety net ──────────────────────────────────────────────
// If any controller export is missing (file not saved / partial edit),
// register a clear 500 stub INSTEAD of crashing the whole server with
// "argument handler must be a function". Existing behaviour is unchanged
// when every handler is a valid function.
function safe(name: string, handler: unknown): RequestHandler {
  if (typeof handler === 'function') {
    return handler as RequestHandler;
  }
  console.error(
    `⚠️ [aiRoutes] Handler "${name}" is NOT a function (got ${typeof handler}). ` +
    `Check that src/controllers/aiController.ts actually exports it (with the "export" keyword) and the file is saved.`
  );
  return ((req: Request, res: Response): void => {
    res.status(500).json({
      success: false,
      message: `AI route "${name}" is unavailable (handler missing on server).`,
    });
  }) as unknown as RequestHandler;
}

// POST /api/ai/generate-resume
router.post('/generate-resume', safe('createResume', createResume));

// POST /api/ai/recommend-careers
router.post('/recommend-careers', safe('getCareerRecommendations', getCareerRecommendations));

// POST /api/ai/analyze-resume
router.post('/analyze-resume', safe('parseResume', parseResume));

// POST /api/ai/chat  (SSE streaming)
router.post('/chat', safe('chatWithAI', chatWithAI));

// POST /api/ai/text-action  ✅ NEW — powers summary / experience / project AI buttons
router.post('/text-action', safe('textAction', textAction));

// POST /api/ai/image  (multipart/form-data, field name: "image", optional "prompt" field)
router.post('/image', handleImageUpload, safe('analyzeImage', analyzeImage));

// POST /api/ai/vision  — alias for /image, so the existing frontend works without changes.
router.post('/vision', handleImageUpload, safe('analyzeImage', analyzeImage));

export default router;