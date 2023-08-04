const asyncHandler = require("express-async-handler");
const axios = require("axios");

async function requestToken() {
  try {
    // Replace 'YOUR_SERVICE_CLIENT_ID' and 'YOUR_SERVICE_CLIENT_SECRET' with the actual values
    const clientId = process.env.CHES_CLIENT_ID;
    const clientSecret = process.env.CHES_CLIENT_SECRET;
    console.log('id:'+process.env.CHES_CLIENT_ID)
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

    // console.log("Access Token:", access_token);
    return access_token;
  } catch (error) {
    // Handle errors gracefully
    console.error("Error fetching token:", error.message);
    throw new Error("Failed to fetch token");
  }
}




// @desc    Send Email report to both user and admin
// @route   POST /api/mail
// @access  Public
const sendMail = asyncHandler(async (req, res) => {
    const accessToken = await requestToken();
    console.log("result="+accessToken);
  try {
    // Set up the API endpoint to fetch the health status
    const healthUrl = "https://ches-test.api.gov.bc.ca/api/v1/health";

    // Set the Authorization header with the bearer token
    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    // Send the GET request using Axios to fetch the health status
    const response = await axios.get(healthUrl, {headers});

    console.log("response:")
    console.log(response)

    // Return the JSON results in the response
    res.json({
      status: 200,
      message: "Health status fetched successfully",
      success: true,
      healthStatus: response.data,
    });
  } catch (error) {
    // Handle errors gracefully
    console.error("Error fetching health status:", error.message);
    res.status(500).json({
      status: 500,
      message: "Failed to fetch health status",
      success: false,
    });
  }
});

module.exports = { sendMail };
