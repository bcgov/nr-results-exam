const asyncHandler = require("express-async-handler");
const axios = require("axios");

async function requestToken() {
  try {
    // Replace 'YOUR_SERVICE_CLIENT_ID' and 'YOUR_SERVICE_CLIENT_SECRET' with the actual values
    const clientId = process.env.CHES_CLIENT_ID;
    const clientSecret = process.env.CHES_CLIENT_SECRET;
    const authHost = 'https://test.loginproxy.gov.bc.ca';

    const tokenEndpoint = `${authHost}/auth/realms/comsvcauth/protocol/openid-connect/token`;

    // Set up the request payload
    const payload = 'grant_type=client_credentials';

    // Set the headers for x-www-form-urlencoded content type
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    // Set up the basic authentication credentials
    const auth = {
      username: clientId,
      password: clientSecret,
    };

    // Send the POST request using Axios to get the token
    const response = await axios.post(tokenEndpoint, payload, { headers, auth });

    // Extract the access_token and session_tag from the response
    const access_token = response.data.access_token;
    return access_token;
  } catch (error) {
    // Handle errors gracefully
    console.error("Error fetching token:", error.message);
    throw new Error("Failed to fetch token");
  }
}

async function sendEmail(token, emailDetails) {
  try {
    const session_tag = "0b7565ca";
    // Set up the email sending endpoint URL
    const emailEndpoint = "https://ches-test.api.gov.bc.ca/api/v1/email";

    // Construct the email payload using the emailDetails object
    const emailPayload = {
      bcc: [],
      bodyType: "html",
      body: emailDetails.mailBody,
      cc: [],
      delayTS: 0,
      encoding: "utf-8",
      from: emailDetails.from,
      priority: "normal",
      subject: emailDetails.subject,
      to: emailDetails.to,
      tag: `email_${session_tag}`,
    };

    // Set the headers for the request
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    // Send the POST request using Axios to send the email
    const response = await axios.post(emailEndpoint, emailPayload, { headers });

    // Handle the response here if needed
    console.log("Email sent successfully:", response.data);
    return response.data;
  } catch (error) {
    // Handle errors gracefully
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
}


// @desc    Send Email report to both user and admin
// @route   POST /api/mail
// @access  Public
const sendMail = asyncHandler(async (req, res) => {
  try {
    const accessToken = await requestToken();
    const emailDetails = {
      from: req.body.fromEmail,
      to: req.body.toEmails,
      subject: req.body.subject,
      mailBody: req.body.mailBody,
    };
    
    const sentEmail = await sendEmail(accessToken, emailDetails);

    res.json({
      status: 200,
      message: "Email sent successfully",
      success: true,
      emailSent: sentEmail,
    });
  } catch (error) {
    console.error("Error sending email:", error.message);
    res.status(500).json({
      status: 500,
      message: "Failed to send email",
      success: false,
      error: error.message,
    });
  }
});

module.exports = { sendMail };
