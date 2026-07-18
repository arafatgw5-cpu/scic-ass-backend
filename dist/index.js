"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
if (process.env.NODE_ENV !== 'production') {
    dotenv_1.default.config();
}
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const PORT = process.env.PORT || 5000;
// Connect to DB immediately for serverless environments
(0, db_1.connectDB)().catch(console.error);
// Only listen if we are not in a serverless environment (like Vercel)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    app_1.default.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
// Export for Vercel serverless functions
exports.default = app_1.default;
