"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const careerController_1 = require("../controllers/careerController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get('/', careerController_1.getCareers);
router.get('/:id', careerController_1.getCareerById);
// Protected routes (authentication required)
router.use(authMiddleware_1.protect);
router.get('/saved', careerController_1.getSavedCareers);
router.post('/:id/save', careerController_1.saveCareer);
router.delete('/:id/unsave', careerController_1.unsaveCareer);
exports.default = router;
