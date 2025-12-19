import React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TestComponent from '../../components/TestComponent';
import { env } from '../../env';
import type { FamLoginUser } from '../../services/AuthService';
import type { Question } from '../../utils/examCalculations';
import {
  sendAdminReport,
  sendUserReport
} from '../../services/EmailService';
import {
  calculateScorePercentage,
  generateResultJson,
  getRandomQuestions,
  isPassing
} from '../../utils/examCalculations';

type FetchMock = ReturnType<typeof vi.fn>;

type EmailStatus = 'success' | 'error';

declare global {
  interface Window {
    scrollTo: (x: number, y: number) => void;
  }
}

const mockQuestionBank: Question[] = [
  {
    question: 'What is the capital of BC?',
    choices: [
      { option: 'Victoria', isCorrect: true },
      { option: 'Vancouver', isCorrect: false }
    ]
  },
  {
    question: 'How many letters are in the word RESULTS?',
    choices: [
      { option: '6', isCorrect: false },
      { option: '7', isCorrect: true }
    ]
  },
  {
    question: 'Which colour is featured on the BC flag?',
    choices: [
      { option: 'Blue', isCorrect: true },
      { option: 'Orange', isCorrect: false }
    ]
  }
];

vi.mock('../../services/EmailService', () => ({
  sendUserReport: vi.fn(),
  sendAdminReport: vi.fn()
}));

vi.mock('../../utils/examCalculations', () => {
  const computeScore = vi.fn((questions: Question[], answers: number[]) => {
    const correct = questions.reduce((total, question, index) => {
      const expected = question.choices.findIndex((choice) => choice.isCorrect);
      return total + (answers[index] === expected ? 1 : 0);
    }, 0);
    return questions.length === 0
      ? 0
      : Math.round((correct / questions.length) * 100);
  });

  return {
    getRandomQuestions: vi.fn(() => mockQuestionBank),
    calculateScorePercentage: computeScore,
    isPassing: vi.fn((questions: Question[], answers: number[]) => computeScore(questions, answers) >= 70),
    generateResultJson: vi.fn((questions: Question[], answers: number[]) =>
      questions.map((question, index) => ({
        question: question.question,
        userAnswered: answers[index] ?? null,
        answer: question.choices.find((choice) => choice.isCorrect)?.option ?? '',
        isCorrect: answers[index] === question.choices.findIndex((choice) => choice.isCorrect)
      }))
    )
  };
});

const user: FamLoginUser = {
  firstName: 'Jane',
  lastName: 'Doe',
  userName: 'jane.doe',
  email: 'jane.doe@gov.bc.ca',
  displayName: 'Jane Doe',
  groups: []
};

const renderComponent = () =>
  render(<TestComponent user={user} questionFileName="A" testName="Access" />);

const resolveFetchWithQuestions = (fetchMock: FetchMock) => {
  fetchMock.mockResolvedValue({
    json: vi.fn().mockResolvedValue(mockQuestionBank)
  });
};

const expectRadioSelections = (answers: Array<number | undefined>) => {
  answers.forEach((choiceIndex, questionIndex) => {
    if (choiceIndex === undefined) {
      return;
    }
    const choiceText = mockQuestionBank[questionIndex].choices[choiceIndex].option;
    fireEvent.click(screen.getByLabelText(choiceText));
  });
};

describe('TestComponent', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn();
    global.fetch = vi.fn() as unknown as FetchMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches questions and completes a successful submission', async () => {
    resolveFetchWithQuestions(global.fetch as FetchMock);

    (sendUserReport as ReturnType<typeof vi.fn>).mockResolvedValue('success');
    (sendAdminReport as ReturnType<typeof vi.fn>).mockResolvedValue('success');

    renderComponent();

    await screen.findByText('Online Test');
    expect(getRandomQuestions).toHaveBeenCalledWith(mockQuestionBank, 10);
    expect(global.fetch).toHaveBeenCalledWith('/api/questions/questionsA', expect.objectContaining({}));

    expectRadioSelections([0, 1, 0]);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(sendUserReport).toHaveBeenCalledTimes(1);
      expect(sendAdminReport).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Congratulations! You have passed/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Email report sent successfully/i)
    ).toBeInTheDocument();
    expect(generateResultJson).toHaveBeenCalled();
    expect(calculateScorePercentage).toHaveBeenCalled();
    expect(isPassing).toHaveBeenCalled();
  });

  it('shows an error when email reports fail', async () => {
    resolveFetchWithQuestions(global.fetch as FetchMock);

    (sendUserReport as ReturnType<typeof vi.fn>).mockResolvedValue('success');
    (sendAdminReport as ReturnType<typeof vi.fn>).mockResolvedValue('error');

    renderComponent();

    await screen.findByText('Online Test');

    expectRadioSelections([1, 0, 1]);

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(sendAdminReport).toHaveBeenCalled();
    });

    expect(screen.getByText(/Failed to send the email report/i)).toBeInTheDocument();
    expect(screen.getByText(/Sorry! You have failed/i)).toBeInTheDocument();
  });

  it('prompts the user to answer all questions before submitting', async () => {
    resolveFetchWithQuestions(global.fetch as FetchMock);
    (sendUserReport as ReturnType<typeof vi.fn>).mockResolvedValue('success');
    (sendAdminReport as ReturnType<typeof vi.fn>).mockResolvedValue('success');
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    renderComponent();
    await screen.findByText('Online Test');

    expectRadioSelections([0, undefined, undefined]);

    const form = screen.getByTestId('online-test-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Please answer all the questions before submitting.');
    });
    expect(sendUserReport).not.toHaveBeenCalled();
    expect(sendAdminReport).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('renders an error message when fetching questions fails', async () => {
    (global.fetch as FetchMock).mockRejectedValue(new Error('Network error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Sorry, failed to fetch the questions/i)).toBeInTheDocument();
    });
  });
});
