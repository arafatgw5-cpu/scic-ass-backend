"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const newsletterController_1 = require("../controllers/newsletterController");
const router = express_1.default.Router();
router.post('/subscribe', newsletterController_1.subscribeNewsletter);
exports.default = router;
