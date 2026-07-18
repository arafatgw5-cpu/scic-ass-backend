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

router.use(protect);

router.get('/', getCareers);
router.get('/saved', getSavedCareers);
router.get('/:id', getCareerById);
router.post('/:id/save', saveCareer);
router.delete('/:id/unsave', unsaveCareer);

export default router;
