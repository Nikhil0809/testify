import express from 'express';
import {
  getQuestionPool,
  startTest,
  getActiveTest,
  saveAnswers,
  submitTest,
  getResult,
  getHistory,
  getDashboard,
} from '../controllers/testController.js';
import { protect } from '../middleware/auth.js';
import { answerRules } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.get('/questions', getQuestionPool);
router.get('/dashboard', getDashboard);
router.get('/history', getHistory);
router.post('/start', startTest);
router.get('/active', getActiveTest);
router.put('/:id/answers', answerRules, saveAnswers);
router.post('/:id/submit', submitTest);
router.get('/:id/result', getResult);

export default router;
