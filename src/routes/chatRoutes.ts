import express from 'express';
import { getChatHistory, clearChatHistory, addMessage } from '../controllers/chatController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getChatHistory)
  .post(addMessage)
  .delete(clearChatHistory);

export default router;
