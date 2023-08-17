import React, { useState, useEffect } from 'react';
import yaml from 'yaml';
import { sendAdminReport, sendUserReport } from '../services/EmailService';
import { InlineNotification } from "@carbon/react";

interface Choice {
  option: string;
  isCorrect: boolean;
}

interface Question {
  question: string;
  choices: Choice[];
}

interface ComponentProps {
  user: any;
  testName:string;
  questionFileName:string;
}

const TestComponent = ({ user, testName, questionFileName }: ComponentProps): JSX.Element => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [emailStatus, setEmailStatus] = useState<'success' | 'error' | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const getRandomQuestions = (questions: Question[], count: number): Question[] => {
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    return shuffledQuestions.slice(0, count);
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/${questionFileName}`);
      const data = await response.text();
      const parsedQuestions: Question[] = yaml.parse(data);
      const randomQuestions = getRandomQuestions(parsedQuestions, 5);
      setQuestions(randomQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
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
    const unansweredQuestions = userAnswers.filter((answer) => answer === undefined);
    if (unansweredQuestions.length > 0) {
      alert('Please answer all the questions before submitting.');
      return;
    }
    setIsSubmitted(true);
    const results = await generateResultJson();
    const percentage = calculateScorePercentage()
    const userReportStatus = await sendUserReport(user.displayName, user.email, percentage, testName);
    const adminReportStatus = await sendAdminReport(user.displayName, user.email, percentage, testName, results);
    if (userReportStatus === 'success' && adminReportStatus === 'success') {
      setEmailStatus('success');
    } else {
      setEmailStatus('error');
    }
  };

  const getChoiceClassName = (questionIndex: number, choiceIndex: number): string => {
    if (!isSubmitted) return '';
    const userAnswer = userAnswers[questionIndex];
    const isCorrect = questions[questionIndex].choices[choiceIndex].isCorrect;
    if (isSubmitted && userAnswer !== undefined) {
      if (userAnswer === choiceIndex) {
        return isCorrect ? 'list-group-item-success' : 'list-group-item-danger';
      }
    }
    return '';
  };

  const calculateScorePercentage = (): number => {
    const totalQuestions = questions.length;
    const totalAnswered = userAnswers.filter((answer) => answer !== undefined).length;
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      const isCorrect = questions[index].choices[answer]?.isCorrect;
      return count + (isCorrect ? 1 : 0);
    }, 0);
    return Math.round((correctAnswers / totalAnswered) * 100);
  };

  const isPassing = (): boolean => {
    const scorePercentage = calculateScorePercentage();
    return scorePercentage >= 50;
  };

  const renderPassFailMessage = () => {
    const scorePercentage = calculateScorePercentage();
    if (isSubmitted) {
      return (
        <p className={isPassing() ? 'text-success' : 'text-danger'}>
          {isPassing() ? 'Congratulations! You have passed the test' : 'Sorry! You have failed the test'} with a percentage of {scorePercentage} %.
        </p>
      );
    }
    return null;
  };

  const isRadioChecked = (questionIndex: number, choiceIndex: number): boolean => {
    return userAnswers[questionIndex] === choiceIndex;
  };

  const generateResultJson = async () => {
    const result = questions.map((question, index) => ({
      question: question.question,
      answer: question.choices[question.choices.findIndex((choice) => choice.isCorrect)].option,
      userAnswered: question.choices[userAnswers[index]].option,
      isCorrect: userAnswers[index] === question.choices.findIndex((choice) => choice.isCorrect),
    }));
    const totalQuestions = questions.length;
    const totalAnswered = userAnswers.filter((answer) => answer !== undefined).length;
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      const isCorrect = questions[index].choices[answer]?.isCorrect;
      return count + (isCorrect ? 1 : 0);
    }, 0);
    const scorePercentage = Math.round((correctAnswers / totalAnswered) * 100);
    const questionsWrong = totalAnswered - correctAnswers;

    console.log('Result JSON:', JSON.stringify(result, null, 2));
    console.log('Total Percentage:', scorePercentage + '%');
    console.log('Questions Answered Rightly:', correctAnswers);
    console.log('Questions Answered Wrongly:', questionsWrong);
    return result;
  };

  const emailNotification = <>
  {/* ... your existing JSX */}
  <div className="mt-3">
        {emailStatus === 'success' ? (
          <InlineNotification
            iconDescription="describes the close button"
            subtitle={
              <span>Email report sent successfully to the admin, you are safe to close this browser window now.</span>
            }
            title={<span className="fw-bold">Success</span>}
            kind="success"
            lowContrast
            className="w-100"
          />
        ) : emailStatus === 'error' ? (
          <InlineNotification
            iconDescription="describes the close button"
            subtitle={
              <span>
                Failed to send the email report, please take a screenshot of the results and timestamp for your
                reference.
              </span>
            }
            title={<span className="fw-bold">Error</span>}
            kind="error"
            lowContrast
            className="w-100"
          />
        ) : null}
    </div>
  </>

  return (
    <>
    {questions.length>0 ?
    <div className="container mb-5">
      {emailNotification}
      <h4 className='pt-2'>Hello <span className='fw-bold'>{user.displayName}</span>, welcome to the {testName} for the RESULTS application access.</h4>
      <h1 className="mt-4">Online Test</h1>
      <form onSubmit={handleSubmit}>
        {renderPassFailMessage()}
        {questions.map((question, index) => (
          <div key={index} className="mt-4">
            <h3>{`Question ${index + 1}`}</h3>
            <div className="d-flex flex-row">
              <p>{question.question}</p>
              {isSubmitted && userAnswers[index] !== undefined && (
                <p className="fw-bold mx-2">
                  {userAnswers[index] === questions[index].choices.findIndex((choice) => choice.isCorrect)
                    ? '(Your answer is right!)'
                    : '(Your answer is wrong!)'}
                </p>
              )}
            </div>
            <ul className="list-group">
              {question.choices.map((choice, choiceIndex) => (
                <li
                  key={choiceIndex}
                  className={`list-group-item ${getChoiceClassName(index, choiceIndex)}`}
                >
                  <label>
                    <input
                      type="radio"
                      name={`question_${index}`}
                      value={choiceIndex}
                      onChange={() => handleAnswer(index, choiceIndex)}
                      checked={isRadioChecked(index, choiceIndex)}
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
    :
    <div className='container mb-5'>
      <h4 className='pt-2'>Sorry failed to fetch the questions please try again.</h4>
    </div>}
    </>
  );
};

export default TestComponent;
