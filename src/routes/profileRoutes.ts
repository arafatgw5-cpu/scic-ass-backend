import express from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// All profile routes are protected
router.use(protect);

router.route('/')
  .get(getProfile)
  .post(updateProfile)
  .put(updateProfile);

export default router;
