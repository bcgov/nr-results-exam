import axios from "axios";
export const sendUserReport = async (userName: string, userEmail: string, percentage: number, testName: string) => {
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
          <p>Please do not reply to this email. If you have successfully passed the test, someone from the team will be reaching out to you with next steps.</p>
          <p>Regards,<br>RESULTS Bot</p>
        </div>
      </body>
    </html>
  `;

  
    const emailParams: any = {
      fromEmail: 'jaskiratsingh.grewal@gov.bc.ca',
      toEmails: [userEmail],
      subject: `${testName} attempt results : ${userName}`,
      mailBody: emailBody,
    };
  
    try {
      await axios.post('http://localhost:5000/api/mail', emailParams);
      console.log('User report email sent successfully');
      return 'success';
    } catch (error) {
      console.error('Error sending user report:', error);
      return 'error';
    }
  };

  export const sendAdminReport = async (userName: string, userEmail: string, percentage: number, testName: string, results: any[]) => {
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
              ${results.map(result => `
                <li>
                  <p><strong>Question:</strong> ${result.question}</p>
                  <p><strong>User Answered:</strong> ${result.userAnswered}</p>
                  <p><strong>Correct Answer:</strong> ${result.answer}</p>
                  <p><strong>Is Correct:</strong> ${result.isCorrect ? 'Yes' : 'No'}</p>
                </li>
              `).join('')}
            </ul>
            <p>Regards,<br>RESULTS Bot</p>
          </div>
        </body>
      </html>
    `;
  
    const emailParams: any = {
      fromEmail: 'jaskiratsingh.grewal@gov.bc.ca',
      toEmails: ['jaskiratsingh.grewal@gov.bc.ca','jaski.grewal@gmail.com'], // Admin's email address
      subject: `${testName} admin report : ${userName}`,
      mailBody: emailBody,
    };
  
    try {
      await axios.post('http://localhost:5000/api/mail', emailParams);
      console.log('Admin report email sent successfully');
      return 'success';
    } catch (error) {
      console.error('Error sending admin report:', error);
      return 'error';
    }
  };
  
  