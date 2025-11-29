const Minio = require('minio');
const dotenv = require('dotenv');
dotenv.config({
  path: './.env'
});
// Define the S3 credentials
const endPoint = process.env.S3_ENDPOINT;
const accessKey = process.env.S3_ACCESSKEY;
const secretKey = process.env.S3_SECRETKEY;
const bucketName = process.env.S3_BUCKETNAME;

// Create a Minio client instance
const minioClient = new Minio.Client({
  endPoint,
  useSSL: true,
  accessKey,
  secretKey
});

// Controller function to read a file from S3 and return its contents
async function getFileFromS3(req, res) {
  // Extract file name from request parameters
  const { fileName } = req.params;
  // Specify the json fileName to retrieve
  const key = `${fileName}.json`;

  try {
    // Get a full object.
    const dataStream = await minioClient.getObject(bucketName, key);

    let fileData = '';

    // Read the data from the stream
    dataStream.on('data', function (chunk) {
      fileData += chunk.toString(); // Accumulate data chunks
    });

    dataStream.on('end', function () {
      // Parse the JSON data
      try {
        const jsonData = JSON.parse(fileData);
        // Return the JSON data in the response
        res.json(jsonData);
      } catch (parseError) {
        // Handle invalid JSON payloads from S3 gracefully
        res.status(500).json({ error: 'Invalid questions JSON payload' });
      }
    });

    dataStream.on('error', function (err) {
      res.status(500).json({ error: err.message }); // Send error message in response
    });
  } catch (error) {
    // Send the error message returned by the Minio client
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { getFileFromS3 };
