import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import aiRoutes from './routes/aiRoutes';
import profileRoutes from './routes/profileRoutes';
import resumeRoutes from './routes/resumeRoutes';
import careerRoutes from './routes/careerRoutes';
import chatRoutes from './routes/chatRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import newsletterRoutes from './routes/newsletterRoutes';

const app = express();

// Set up allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://scic-ass-frontend.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Handle OPTIONS preflight requests
app.options(/.*/, cors());

app.use(helmet());
app.use(compression());
app.use(cookieParser());

// Rate limiting (configured for serverless)
// Trust proxy is needed for Vercel
app.set('trust proxy', 1);
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Basic middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check route
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SkillPilot AI API is running' });
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SkillPilot AI API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Error handling middleware (to be expanded)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
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

export default app;
