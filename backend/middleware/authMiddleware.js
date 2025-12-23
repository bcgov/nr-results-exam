const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Singleton JWKS client instance to avoid recreating on every request
let jwksClientInstance = null;

/**
 * Get JWKS client - creates client once and reuses it
 */
function getJwksClient() {
  if (!jwksClientInstance) {
    const USER_POOL_ID = process.env.VITE_USER_POOLS_ID;
    if (!USER_POOL_ID) {
      throw new Error('User pool ID is not configured');
    }
    const COGNITO_REGION = process.env.VITE_COGNITO_REGION || 'ca-central-1';
    const JWKS_URI = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;

    jwksClientInstance = jwksClient({
      jwksUri: JWKS_URI,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }
  return jwksClientInstance;
}

/**
 * Get the signing key from JWKS
 */
function getKey(header, callback) {
  const client = getJwksClient();
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Authentication middleware to verify JWT tokens from AWS Cognito
 * Extracts and verifies the token from the Authorization header
 * Attaches decoded user information to req.user
 */
const authenticateToken = (req, res, next) => {
  // Get the authorization header
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'No authorization header provided',
    });
  }

  // Extract the token from "Bearer <token>"
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'No token provided',
    });
  }

  // Check if Cognito configuration is available
  const USER_POOL_ID = process.env.VITE_USER_POOLS_ID;
  if (!USER_POOL_ID) {
    console.error('VITE_USER_POOLS_ID is not configured');
    return res.status(500).json({
      success: false,
      message: 'Authentication configuration error',
      error: 'User pool not configured',
    });
  }

  // Verify the token
  const handleVerification = (err, decoded) => {
    if (err) {
      console.error('Token verification error:', err.message);

      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          error: 'Your session has expired. Please log in again.',
        });
      }

      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          error: 'Invalid or expired token',
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Authentication configuration error',
        error: 'Unable to verify token',
      });
    }

    // Attach decoded token to request object for use in route handlers
    req.user = {
      email: decoded.email,
      username: decoded['custom:idp_username'] || decoded['cognito:username'],
      displayName: decoded['custom:idp_display_name'],
      idpProvider: decoded['custom:idp_name'],
      sub: decoded.sub,
      tokenPayload: decoded,
    };

    next();
  };

  try {
    jwt.verify(
      token,
      getKey,
      {
        algorithms: ['RS256'],
      },
      handleVerification,
    );
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication configuration error',
      error: 'Unable to verify token',
    });
  }
};

module.exports = {
  authenticateToken,
};
