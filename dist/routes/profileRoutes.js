"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profileController_1 = require("../controllers/profileController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// All profile routes are protected
router.use(authMiddleware_1.protect);
router.route('/')
    .get(profileController_1.getProfile)
    .post(profileController_1.updateProfile)
    .put(profileController_1.updateProfile);
exports.default = router;
