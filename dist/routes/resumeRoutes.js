"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const resumeController_1 = require("../controllers/resumeController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.post('/generate-pdf', resumeController_1.generatePdf);
router.route('/')
    .get(resumeController_1.getResumes)
    .post(resumeController_1.createResumeEntry);
router.route('/:id')
    .get(resumeController_1.getResumeById)
    .put(resumeController_1.updateResume)
    .delete(resumeController_1.deleteResume);
exports.default = router;
