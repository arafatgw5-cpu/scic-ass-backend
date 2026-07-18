import express from 'express';
import { subscribeNewsletter } from '../controllers/newsletterController';

const router = express.Router();

router.post('/subscribe', subscribeNewsletter);

export default router;
