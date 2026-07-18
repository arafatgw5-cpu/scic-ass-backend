"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const careerRoutes_1 = __importDefault(require("./routes/careerRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const recommendationRoutes_1 = __importDefault(require("./routes/recommendationRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const newsletterRoutes_1 = __importDefault(require("./routes/newsletterRoutes"));
const app = (0, express_1.default)();
// Set up allowed origins
const allowedOrigins = [
    'http://localhost:3000',
    'https://scic-ass-frontend.vercel.app',
    process.env.CLIENT_URL,
].filter(Boolean);
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Handle OPTIONS preflight requests
app.options('*', (0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
// Rate limiting (configured for serverless)
// Trust proxy is needed for Vercel
app.set('trust proxy', 1);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window`
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);
// Basic middlewares
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check route
app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'SkillPilot AI API is running' });
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'SkillPilot AI API is running' });
});
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/ai', aiRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
app.use('/api/resumes', resumeRoutes_1.default);
app.use('/api/careers', careerRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/recommendations', recommendationRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/newsletter', newsletterRoutes_1.default);
// Error handling middleware (to be expanded)
app.use((err, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    else {
        console.error(err.message);
    }
    if (err.name === 'CastError') {
        res.status(400).json({ success: false, message: 'Invalid ID format' });
        return;
    }
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' && !err.status ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    });
});
exports.default = app;
