// utils/examCalculations.ts
export interface Choice {
  option: string;
  isCorrect: boolean;
}

export interface Question {
  question: string;
  choices: Choice[];
}

export const getRandomQuestions = (
  questions: Question[],
  count: number
): Question[] => {
  const shuffledQuestions = [...questions];

  // Fisher-Yates shuffle with crypto.getRandomValues
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    const j = randomValues[0] % (i + 1);

    [shuffledQuestions[i], shuffledQuestions[j]] = [
      shuffledQuestions[j],
      shuffledQuestions[i]
    ];
  }

  return shuffledQuestions.slice(0, count);
};

export const calculateScorePercentage = (
  questions: Question[],
  userAnswers: number[]
): number => {
  const totalAnswered = userAnswers.filter(
    (answer) => answer !== undefined
  ).length;
  if (totalAnswered === 0) return 0; // Prevent division by zero

  const correctAnswers = userAnswers.reduce((count, answer, index) => {
    return count + (questions[index].choices[answer]?.isCorrect ? 1 : 0);
  }, 0);

  return Math.round((correctAnswers / totalAnswered) * 100);
};

export const isPassing = (
  questions: Question[],
  userAnswers: number[]
): boolean => {
  return calculateScorePercentage(questions, userAnswers) >= 50;
};

export const generateResultJson = (
  questions: Question[],
  userAnswers: number[]
) => {
  return questions.map((question, index) => ({
    question: question.question,
    answer:
      question.choices.find((choice) => choice.isCorrect)?.option || "N/A",
    userAnswered: question.choices[userAnswers[index]]?.option || "N/A",
    isCorrect:
      userAnswers[index] ===
      question.choices.findIndex((choice) => choice.isCorrect)
  }));
};
