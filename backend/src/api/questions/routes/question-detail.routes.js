import express from "express";

import {
  authenticateUser as auth,
  optionalAuth,
} from "../../../middleware/authentication.js";

import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  postAnswerValidation,
  searchQuestionsValidation,
  getSimilarQuestionsValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
} from "../validation/question.validation.js";

import {
  createQuestionController,
  getQuestionsController,
  generateQuestionDraftCoachController,
  searchQuestionsSemanticController,
} from "../controller/question.controller.js";

import {
  getSingleQuestionController,
  postAnswerController,
  getSimilarQuestionsController,
  assessAnswerAgainstQuestionController,
} from "../controller/question-detail.controller.js";

const router = express.Router();

// Generate a question draft
router.post(
  "/draft-coach",
  optionalAuth,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

// Create a question (login required)
router.post(
  "/",
  auth,
  createQuestionValidation,
  createQuestionController,
);

// Get questions (public)
router.get(
  "/",
  auth,
  getQuestionsValidation,
  getQuestionsController,
);

// Search questions (public)
router.get(
  "/search",
  auth,
  searchQuestionsValidation,
  searchQuestionsSemanticController,
);

// Get question details (login required)
router.get(
  "/:questionHash",
  auth,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

// Post an answer (login required)
router.post(
  "/:questionHash/answers",
  auth,
  postAnswerValidation,
  postAnswerController,
);

// Get similar questions (public)
router.get(
  "/:questionHash/similar",
  auth,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

// Assess answer fit (login required)
router.post(
  "/:questionHash/answer-fit",
  auth,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

export default router;