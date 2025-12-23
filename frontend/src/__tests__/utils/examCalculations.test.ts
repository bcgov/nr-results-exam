import { describe, it, expect } from 'vitest';
import {
  Choice,
  Question,
  getRandomQuestions,
  calculateScorePercentage,
  isPassing,
  generateResultJson,
} from '../../utils/examCalculations';

const questions: Question[] = [
  {
    question: 'What is the capital of France?',
    choices: [
      { option: 'Paris', isCorrect: true },
      { option: 'London', isCorrect: false },
      { option: 'Berlin', isCorrect: false },
      { option: 'Madrid', isCorrect: false },
    ],
  },
  {
    question: 'What is the capital of Spain?',
    choices: [
      { option: 'Paris', isCorrect: false },
      { option: 'London', isCorrect: false },
      { option: 'Berlin', isCorrect: false },
      { option: 'Madrid', isCorrect: true },
    ],
  },
  {
    question: 'What is the capital of Germany?',
    choices: [
      { option: 'Paris', isCorrect: false },
      { option: 'London', isCorrect: false },
      { option: 'Berlin', isCorrect: true },
      { option: 'Madrid', isCorrect: false },
    ],
  },
];

describe('examCalculations', () => {
  it('should get random questions', () => {
    const randomQuestions = getRandomQuestions(questions, 2);
    expect(randomQuestions).toHaveLength(2);
  });

  it('should calculate score percentage', () => {
    const userAnswers = [0, 3, 2];
    const score = calculateScorePercentage(questions, userAnswers);
    expect(score).toBe(100);
  });
  it('should check if the user is passing', () => {
    const userAnswers = [0, 3, 2];
    const passing = isPassing(questions, userAnswers);
    expect(passing).toBe(true);
    //check the failing case
    const userAnswers2 = [0, 2, 1];
    const passing2 = isPassing(questions, userAnswers2);
    expect(passing2).toBe(false);
  });
  it('should generate result json', () => {
    const userAnswers = [0, 3, 2];
    const result = generateResultJson(questions, userAnswers);
    expect(result).toHaveLength(3);
    expect(result[0].isCorrect).toBe(true);
    expect(result[1].isCorrect).toBe(true);
    expect(result[2].isCorrect).toBe(true);
  });
  it('should generate result json with incorrect answers', () => {
    const userAnswers = [0, 2, 1];
    const result = generateResultJson(questions, userAnswers);
    expect(result).toHaveLength(3);
    expect(result[0].isCorrect).toBe(true);
    expect(result[1].isCorrect).toBe(false);
    expect(result[2].isCorrect).toBe(false);
  });
  // test the Choice interface
  it('should create a choice', () => {
    const choice: Choice = {
      option: 'Paris',
      isCorrect: true,
    };
    expect(choice.option).toBe('Paris');
    expect(choice.isCorrect).toBe(true);
  });
  // test the Question interface
  it('should create a question', () => {
    const question: Question = {
      question: 'What is the capital of France?',
      choices: [
        { option: 'Paris', isCorrect: true },
        { option: 'London', isCorrect: false },
        { option: 'Berlin', isCorrect: false },
        { option: 'Madrid', isCorrect: false },
      ],
    };
    expect(question.question).toBe('What is the capital of France?');
    expect(question.choices).toHaveLength(4);
  });
});
