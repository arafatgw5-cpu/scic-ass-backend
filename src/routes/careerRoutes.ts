import express from 'express';
import { 
  getCareers, 
  getCareerById, 
  saveCareer, 
  unsaveCareer, 
  getSavedCareers 
} from '../controllers/careerController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getCareers);
router.get('/:id', getCareerById);

// Protected routes (authentication required)
router.use(protect);
router.get('/saved', getSavedCareers);
router.post('/:id/save', saveCareer);
router.delete('/:id/unsave', unsaveCareer);

export default router;