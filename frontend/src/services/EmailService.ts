import axios from 'axios';
import { env } from '../env';
import { getAuthIdToken } from './AuthService';

const backendUrl = (env.VITE_BACKEND_URL || '').replace(/\/$/, '');

interface EmailParams {
  fromEmail: string;
  toEmails: string[];
  subject: string;
  mailBody: string;
}

export const sendUserReport = async (
  userName: string,
  userEmail: string,
  percentage: number,
  testName: string,
) => {
  const passOrFail = percentage >= 50 ? 'Passed' : 'Failed';
  const passOrFailColor = passOrFail === 'Passed' ? 'green' : 'red';

  const emailBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          .result { color: ${passOrFailColor}; }
          .container { margin: 20px auto; padding: 20px; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Test Result</h1>
          <p>Hello ${userName},</p>
          <p>Thanks for taking the ${testName} for access to the RESULTS application. Please review your result below:</p>
          <p class="result">
            ${passOrFail === 'Passed' ? 'Congratulations! You have passed the test' : 'Sorry! You have failed the test'} with a percentage of ${percentage} %.
          </p>
          ${passOrFail === 'Passed' ? '<p>To continue the access request process, please go to the <a href="https://extranet.for.gov.bc.ca/escripts/efm/access/results/access.asp">Online access request form</a>.</p>' : ''}
          ${passOrFail === 'Failed' ? '<p>Without a passing score we unfortunately cannot proceed any further.  Please try the test again when you are ready. Contact RESULTSAccess@gov.bc.ca for more information.</p>' : ''}
          <p>Please do not reply to this email.</p>
          <p>Regards,<br>RESULTS Bot</p>
        </div>
      </body>
    </html>
  `;

  const fromEmail = env.VITE_CHES_FROM_EMAIL || 'resultsaccess@gov.bc.ca';

  const emailParams: EmailParams = {
    fromEmail,
    toEmails: [userEmail],
    subject: `${testName} user attempt report : ${userName}`,
    mailBody: emailBody,
  };

  try {
    const token = getAuthIdToken();
    if (!token) {
      console.warn('No authentication token available for user mail request');
    }
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await axios.post(`${backendUrl}/api/mail`, emailParams, config);
    return 'success';
  } catch (error) {
    console.error('Error sending user report email:', error);
    return 'error';
  }
};

interface ResultItem {
  question: string;
  userAnswered: string;
  answer: string;
  isCorrect: boolean;
}

export const sendAdminReport = async (
  userName: string,
  userEmail: string,
  percentage: number,
  testName: string,
  results: ResultItem[],
) => {
  // Only send admin emails in PROD and TEST environments, not in PR (dev) environments
  const zone = String(env.VITE_ZONE || '').toLowerCase();
  const isProdOrTest = zone === 'prod' || zone === 'test';

  if (!isProdOrTest) {
    return 'success';
  }

  const passOrFail = percentage >= 50 ? 'Passed' : 'Failed';
  const passOrFailColor = passOrFail === 'Passed' ? 'green' : 'red';

  const emailBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .result { color: ${passOrFailColor}; }
            .container { margin: 20px auto; padding: 20px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Test Result for Admin</h1>
            <p>Hello Admin,</p>
            <p>Below are the results of the test taken by ${userName} (${userEmail}) for the ${testName}:</p>
            <p class="result">
              ${passOrFail === 'Passed' ? 'The user has passed the test' : 'The user has failed the test'} with a percentage of ${percentage} %.
            </p>
            <h2>Questions Answered:</h2>
            <ul>
              ${results
                .map(
                  (result) => `
                <li>
                  <p><strong>Question:</strong> ${result.question}</p>
                  <p><strong>User Answered:</strong> ${result.userAnswered}</p>
                  <p><strong>Correct Answer:</strong> ${result.answer}</p>
                  <p><strong>Is Correct:</strong> ${result.isCorrect ? 'Yes' : 'No'}</p>
                </li>
              `,
                )
                .join('')}
            </ul>
            <p>Regards,<br>RESULTS Bot</p>
          </div>
        </body>
      </html>
    `;

  const fromEmail = env.VITE_CHES_FROM_EMAIL || 'resultsaccess@gov.bc.ca';
  const adminEmail = env.VITE_CHES_ADMIN_EMAIL || 'resultsaccess@gov.bc.ca';

  // In TEST environment, send admin report to test taker's email
  // In PROD environment, send to admin email address
  const recipientEmail = zone === 'test' ? userEmail : adminEmail;

  const emailParams: EmailParams = {
    fromEmail,
    toEmails: [recipientEmail],
    subject: `${testName} admin report : ${userName}`,
    mailBody: emailBody,
  };

  try {
    const token = getAuthIdToken();
    if (!token) {
      console.warn('No authentication token available for admin mail request');
    }
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    await axios.post(`${backendUrl}/api/mail`, emailParams, config);
    return 'success';
  } catch (error) {
    console.error('Error sending admin report email:', error);
    return 'error';
  }
};
