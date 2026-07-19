"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = require("../controllers/aiController");
// import { protect } from '../middlewares/authMiddleware'; // 🔥 সাময়িকভাবে বন্ধ (Debugging)
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const router = express_1.default.Router();
// ⚠️ TEMPORARILY DISABLED
// router.use(protect);
// ─── Startup safety net ──────────────────────────────────────────────
// If any controller export is missing (file not saved / partial edit),
// register a clear 500 stub INSTEAD of crashing the whole server with
// "argument handler must be a function". Existing behaviour is unchanged
// when every handler is a valid function.
function safe(name, handler) {
    if (typeof handler === 'function') {
        return handler;
    }
    console.error(`⚠️ [aiRoutes] Handler "${name}" is NOT a function (got ${typeof handler}). ` +
        `Check that src/controllers/aiController.ts actually exports it (with the "export" keyword) and the file is saved.`);
    return ((req, res) => {
        res.status(500).json({
            success: false,
            message: `AI route "${name}" is unavailable (handler missing on server).`,
        });
    });
}
// POST /api/ai/generate-resume
router.post('/generate-resume', safe('createResume', aiController_1.createResume));
// POST /api/ai/recommend-careers
router.post('/recommend-careers', safe('getCareerRecommendations', aiController_1.getCareerRecommendations));
// POST /api/ai/analyze-resume
router.post('/analyze-resume', safe('parseResume', aiController_1.parseResume));
// POST /api/ai/chat  (SSE streaming)
router.post('/chat', safe('chatWithAI', aiController_1.chatWithAI));
// POST /api/ai/text-action  ✅ NEW — powers summary / experience / project AI buttons
router.post('/text-action', safe('textAction', aiController_1.textAction));
// POST /api/ai/image  (multipart/form-data, field name: "image", optional "prompt" field)
router.post('/image', uploadMiddleware_1.handleImageUpload, safe('analyzeImage', aiController_1.analyzeImage));
// POST /api/ai/vision  — alias for /image, so the existing frontend works without changes.
router.post('/vision', uploadMiddleware_1.handleImageUpload, safe('analyzeImage', aiController_1.analyzeImage));
exports.default = router;
