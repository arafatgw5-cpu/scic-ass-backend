import express from 'express';
import { 
  createResumeEntry, 
  getResumes, 
  getResumeById, 
  updateResume, 
  deleteResume,
  generatePdf
} from '../controllers/resumeController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(protect);

router.post('/generate-pdf', generatePdf);

router.route('/')
  .get(getResumes)
  .post(createResumeEntry);

router.route('/:id')
  .get(getResumeById)
  .put(updateResume)
  .delete(deleteResume);

export default router;
