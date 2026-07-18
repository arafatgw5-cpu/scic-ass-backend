"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = require("../controllers/aiController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// All AI routes require authentication
router.use(authMiddleware_1.protect);
// POST /api/ai/generate-resume
router.post('/generate-resume', aiController_1.createResume);
// POST /api/ai/recommend-careers
router.post('/recommend-careers', aiController_1.getCareerRecommendations);
// POST /api/ai/analyze-resume
router.post('/analyze-resume', aiController_1.parseResume);
// POST /api/ai/chat  (SSE streaming)
router.post('/chat', aiController_1.chatWithAI);
exports.default = router;
