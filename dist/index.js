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
// Only listen if we are not in a serverless environment (like Vercel).
// (DB connection itself is now guaranteed per-request via the middleware
// in app.ts, so this is just for local/dev `npm run dev` usage.)
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
    (0, db_1.connectDB)()
        .then(() => {
        app_1.default.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
        .catch((err) => {
        console.error('Failed to connect to DB, server not started:', err);
    });
}
else {
    // Serverless: kick off an early connection attempt so the first
    // request doesn't always pay the full connect cost, though the
    // app.ts middleware is what actually guarantees readiness.
    (0, db_1.connectDB)().catch(console.error);
}
// Export for Vercel serverless functions
exports.default = app_1.default;
