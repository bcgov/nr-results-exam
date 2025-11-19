import React, { useState, useEffect } from 'react';
import { sendAdminReport, sendUserReport } from '../services/EmailService';
import { Loading } from "@carbon/react";
import {
  getRandomQuestions,
  calculateScorePercentage,
  isPassing,
  generateResultJson,
  Question
} from '../utils/examCalculations';
import EmailNotification from './EmailNotifications';
import { FamLoginUser, getAuthIdToken } from '../services/AuthService';

interface ComponentProps {
  user: FamLoginUser;
  testName: string;
  questionFileName: string;
}

const areAnswersComplete = (answers: Array<number | undefined>): answers is number[] =>
  !answers.some((answer) => answer === undefined);

const TestComponent: React.FC<ComponentProps> = ({ user, testName, questionFileName }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Array<number | undefined>>([]);
  const [emailStatus, setEmailStatus] = useState<'success' | 'error' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const token = getAuthIdToken();
      const requestUrl = `/api/questions/questions${questionFileName}`;
      if (!token) {
        console.warn('No authentication token available for questions request');
      }
      const fetchOptions = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await fetch(requestUrl, fetchOptions);
      const data = await response.json();
      const randomizedQuestions = getRandomQuestions(data, 10);
      setQuestions(randomizedQuestions);
      setUserAnswers(new Array(randomizedQuestions.length).fill(undefined));
    } catch (errorFetch) {
      console.error('Error fetching questions:', errorFetch);
      setError(true);
    }
  };

  const handleAnswer = (questionIndex: number, selectedChoiceIndex: number) => {
    setUserAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[questionIndex] = selectedChoiceIndex;
      return updatedAnswers;
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    window.scrollTo(0, 0);

    if (!areAnswersComplete(userAnswers)) {
      alert('Please answer all the questions before submitting.');
      return;
    }

    setIsSubmitted(true);
    setIsLoading(true);

    const results = generateResultJson(questions, userAnswers);
    const percentage = calculateScorePercentage(questions, userAnswers);
    const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
    const userEmail = user.email || '';
    const userReportStatus = await sendUserReport(displayName, userEmail, percentage, testName);
    const adminReportStatus = await sendAdminReport(displayName, userEmail, percentage, testName, results);

    setEmailStatus(userReportStatus === 'success' && adminReportStatus === 'success' ? 'success' : 'error');
    setIsLoading(false);
  };

  const renderPassFailMessage = () => {
    if (isSubmitted && areAnswersComplete(userAnswers)) {
      const scorePercentage = calculateScorePercentage(questions, userAnswers);
      return (
        <p className={isPassing(questions, userAnswers) ? 'text-success' : 'text-danger'}>
          {isPassing(questions, userAnswers) ? 'Congratulations! You have passed' : 'Sorry! You have failed'} with {scorePercentage}%.
        </p>
      );
    }
    return null;
  };

  return (
    <>
      {!loading ? (
        <>
          {questions.length > 0 ? (
            <div className="container mb-5">
              {emailStatus && (<EmailNotification emailStatus={emailStatus} />)}
              <h4 className='pt-2'>Hello <span className='fw-bold'>{user.firstName} {user.lastName}</span>, welcome to the {testName} for the RESULTS application access.</h4>
              <h1 className="mt-4">Online Test</h1>
              <form data-testid="online-test-form" onSubmit={handleSubmit}>
                {renderPassFailMessage()}
                {questions.map((question, index) => (
                  <div key={index} className="mt-5 unselectable">
                    <h3>{`Question ${index + 1}`}</h3>
                    <div className="d-flex flex-row">
                      <p className='pb-2 pt-3'>{question.question}</p>
                      {isSubmitted && userAnswers[index] !== undefined && (
                        <p className="fw-bold mx-2 pb-2 pt-3">
                          {userAnswers[index] === question.choices.findIndex((choice) => choice.isCorrect)
                            ? '(Your answer is right!)'
                            : '(Your answer is wrong!)'}
                        </p>
                      )}
                    </div>
                    <ul className="list-group">
                      {question.choices.map((choice, choiceIndex) => (
                        <li key={choiceIndex} className={`list-group-item ${isSubmitted && userAnswers[index] === choiceIndex ? (choice.isCorrect ? 'list-group-item-success' : 'list-group-item-danger') : ''}`}>
                          <label>
                            <input
                              type="radio"
                              name={`question_${index}`}
                              value={choiceIndex}
                              onChange={() => handleAnswer(index, choiceIndex)}
                              checked={userAnswers[index] === choiceIndex}
                              disabled={isSubmitted}
                              className="form-check-input me-2"
                              required
                            />
                            <span className={userAnswers[index] === choiceIndex ? 'fw-bold' : ''}>
                              {choice.option}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!isSubmitted && (
                  <button className="btn btn-primary mt-4" type="submit">
                    Submit
                  </button>
                )}
              </form>
            </div>
          ) : error ? (
            <div className='container mb-5'>
              <h4 className='pt-2'>Sorry, failed to fetch the questions. Please try again.</h4>
            </div>
          ) : (
            <Loading className={'some-class'} withOverlay={true} />
          )}
        </>
      ) : (
        <Loading className={'some-class'} withOverlay={true} />
      )}
    </>
  );
};

export default TestComponent;
