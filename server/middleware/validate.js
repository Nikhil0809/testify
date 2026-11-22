import { body } from 'express-validator';
import { validate } from './error.js';

export const registerRules = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

export const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

export const questionRules = [
  body('questionText').trim().notEmpty().withMessage('Question text is required'),
  body('options').isArray({ min: 4, max: 4 }).withMessage('Exactly 4 options are required'),
  body('options.*').trim().notEmpty().withMessage('Options cannot be empty'),
  body('correctAnswer').trim().notEmpty().withMessage('Correct answer is required'),
  body('subject')
    .isIn(['Programming', 'JavaScript', 'DBMS', 'Computer Science', 'General Knowledge'])
    .withMessage('Invalid subject'),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard']).withMessage('Invalid difficulty'),
  validate,
];

export const answerRules = [
  body('answers').isArray().withMessage('answers must be an array'),
  body('answers.*.questionId').isMongoId().withMessage('Invalid question id'),
  body('answers.*.selectedOption').optional({ nullable: true }).isString().withMessage('Invalid option'),
  validate,
];
