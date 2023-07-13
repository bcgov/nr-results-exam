import React, { useState, useEffect } from 'react';
import yaml from 'yaml';

const TestComponent = () => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const getRandomQuestions = (questions, count) => {
    const shuffledQuestions = questions.sort(() => Math.random() - 0.5);
    return shuffledQuestions.slice(0, count);
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/questions.yaml');
      const data = await response.text();
      const parsedQuestions = yaml.parse(data);
      const randomQuestions = getRandomQuestions(parsedQuestions, 5);
      setQuestions(randomQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const handleAnswer = (questionIndex, selectedChoiceIndex) => {
    setUserAnswers((prevAnswers) => {
      const updatedAnswers = [...prevAnswers];
      updatedAnswers[questionIndex] = selectedChoiceIndex;
      return updatedAnswers;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    window.scrollTo(0,0)
    const unansweredQuestions = userAnswers.filter((answer) => answer === undefined);
    if (unansweredQuestions.length > 0) {
      alert('Please answer all the questions before submitting.');
      return;
    }
    setIsSubmitted(true);
    generateResultJson(); // Call the function to generate the result JSON
  };

  const getChoiceClassName = (questionIndex, choiceIndex) => {
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

  const calculateScorePercentage = () => {
    const totalQuestions = questions.length;
    const totalAnswered = userAnswers.filter((answer) => answer !== undefined).length;
    const correctAnswers = userAnswers.reduce((count, answer, index) => {
      const isCorrect = questions[index].choices[answer]?.isCorrect;
      return count + (isCorrect ? 1 : 0);
    }, 0);
    return Math.round((correctAnswers / totalAnswered) * 100);
  };

  const isPassing = () => {
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

  const isRadioChecked = (questionIndex, choiceIndex) => {
    return userAnswers[questionIndex] === choiceIndex;
  };

  const generateResultJson = () => {
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
  };
  
  

  return (
    <div className="container mb-5 ">
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
            <ul className="list-group ">
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
  );
};

export default TestComponent;
