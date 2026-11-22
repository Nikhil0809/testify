import express from 'express';
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listStudents,
  getStats,
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { questionRules } from '../middleware/validate.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/questions', listQuestions);
router.post('/questions', questionRules, createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.get('/students', listStudents);
router.get('/stats', getStats);

export default router;
