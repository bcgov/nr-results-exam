const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Singleton JWKS client instance to avoid recreating on every request
let jwksClientInstance = null;
let currentJwksUri = null;

/**
 * Normalizes identity provider name.
 * Keycloak IDIR-MFA emits 'azureidir', which must be normalized to 'IDIR'
 * to preserve audit string compatibility.
 */
function normalizeIdpProvider(provider) {
  if (!provider) return '';
  const upper = String(provider).toUpperCase();
  if (upper === 'AZUREIDIR' || upper === 'IDIR') {
    return 'IDIR';
  }
  if (upper === 'BCEIDBUSINESS' || upper === 'BCEID_BUSINESS' || upper.startsWith('BCEID')) {
    return 'BCEIDBUSINESS';
  }
  return upper;
}

/**
 * Get JWKS client - creates client once and reuses it for the same issuer
 */
function getJwksClient() {
  const ISSUER = process.env.KEYCLOAK_ISSUER_URI;
  if (!ISSUER) {
    throw new Error('Keycloak issuer URI is not configured');
  }

  const JWKS_URI = `${ISSUER.replace(/\/$/, '')}/protocol/openid-connect/certs`;

  if (!jwksClientInstance || currentJwksUri !== JWKS_URI) {
    jwksClientInstance = jwksClient({
      jwksUri: JWKS_URI,
      cache: true,
      cacheMaxAge: 600000, // 10 minutes
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
    currentJwksUri = JWKS_URI;
  }
  return jwksClientInstance;
}

/**
 * Get the signing key from JWKS
 */
function getKey(header, callback) {
  try {
    const client = getJwksClient();
    client.getSigningKey(header.kid, (err, key) => {
      if (err) {
        callback(err);
        return;
      }
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    });
  } catch (err) {
    callback(err);
  }
}

/**
 * Authentication middleware to verify JWT tokens from BC Gov SSO (Keycloak)
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
  const token = authHeader.replace(/^Bearer\s*/i, '').trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      error: 'No token provided',
    });
  }

  const ISSUER = process.env.KEYCLOAK_ISSUER_URI;
  if (!ISSUER) {
    console.error('KEYCLOAK_ISSUER_URI is not configured');
    return res.status(500).json({
      success: false,
      message: 'Authentication configuration error',
      error: 'Keycloak issuer URI not configured',
    });
  }

  const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
  if (!CLIENT_ID) {
    console.error('KEYCLOAK_CLIENT_ID is not configured');
    return res.status(500).json({
      success: false,
      message: 'Authentication configuration error',
      error: 'Keycloak client ID not configured',
    });
  }

  const normalizedIssuer = ISSUER.replace(/\/$/, '');

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

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Invalid or expired token',
      });
    }

    // BC Gov SSO standard realm is shared across applications.
    // Verify that the token was authorized for this client (azp check).
    if (decoded.azp !== CLIENT_ID) {
      console.error('Token verification error: authorized party does not match client ID');
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Invalid or expired token',
      });
    }

    // Extract and normalize identity claims
    const idpProvider = normalizeIdpProvider(decoded.identity_provider);

    // Leave username exactly as issued (IDIR or BCeID)
    const username =
      decoded.idir_username || decoded.bceid_username || decoded.preferred_username || '';

    // GUID is uppercase wherever used as identity
    const rawGuid = decoded.idir_user_guid || decoded.bceid_user_guid;
    const userGuid = rawGuid ? String(rawGuid).toUpperCase() : undefined;

    const displayName = decoded.display_name || decoded.name || '';

    // Extract roles from client_roles or resource_access.<CLIENT_ID>.roles or roles
    const clientRoles = Array.isArray(decoded.client_roles) ? decoded.client_roles : [];
    const resourceRoles = Array.isArray(decoded.resource_access?.[CLIENT_ID]?.roles)
      ? decoded.resource_access[CLIENT_ID].roles
      : [];
    const realmRoles = Array.isArray(decoded.roles) ? decoded.roles : [];
    const combinedRoles = [...new Set([...clientRoles, ...resourceRoles, ...realmRoles])];
    // Filter out FAM: bookkeeping roles (e.g. FAM:EXPIRES:...)
    const roles = combinedRoles.filter(
      (role) => typeof role === 'string' && !role.startsWith('FAM:'),
    );

    // Attach decoded token to request object for use in route handlers
    req.user = {
      email: decoded.email,
      username,
      displayName,
      idpProvider,
      userGuid,
      roles,
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
        issuer: normalizedIssuer,
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
  normalizeIdpProvider,
};
