import { env } from './env';

const ZONE = (env.VITE_ZONE ?? "DEV").toLocaleLowerCase();
const logoutDomain = `https://logon${ZONE === "prod" ? '' : 'test'}7.gov.bc.ca`;
const returnUrlHost = ZONE === "prod" ? "loginproxy" : ZONE === "test" ? "test.loginproxy" : "dev.loginproxy";
const retUrl = `https://${returnUrlHost}.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout`;

/**
 * Constructs the OAuth redirect URI using the -frontend URL format.
 * Cognito's allowlist includes URLs with the -frontend suffix
 * (e.g., nr-results-exam-48-frontend.apps.silver.devops.gov.bc.ca).
 * 
 * If the user accessed via the redirect-from URL (without -frontend),
 * we need to add the -frontend suffix to match Cognito's allowlist.
 */
const getRedirectSignInUri = (): string => {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // Check if hostname does NOT contain -frontend suffix (redirect-from URL format)
  // e.g., nr-results-exam-48.apps.silver.devops.gov.bc.ca
  if (!hostname.includes('-frontend.')) {
    // Add -frontend suffix to match Cognito's allowlist
    // Insert -frontend before the first dot in the domain part
    const parts = hostname.split('.');
    if (parts.length > 0) {
      const mainHostname = parts[0];
      const domain = parts.slice(1).join('.');
      const frontendHostname = `${mainHostname}-frontend.${domain}`;
      const frontendOrigin = `${window.location.protocol}//${frontendHostname}`;
      console.log('Using -frontend URL format for OAuth redirect URI:', frontendOrigin);
      return `${frontendOrigin}/dashboard`;
    }
  }
  
  // Use current origin if it already has -frontend suffix
  return `${origin}/dashboard`;
};

const redirectSignInUri = getRedirectSignInUri();
const redirectUri = new URL(redirectSignInUri).origin;

const redirectSignOut =
  env.VITE_REDIRECT_SIGN_OUT && env.VITE_REDIRECT_SIGN_OUT.trim() !== ""
    ? env.VITE_REDIRECT_SIGN_OUT
    : `${logoutDomain}/clp-cgi/logoff.cgi?retnow=1&returl=${retUrl}?redirect_uri=${redirectUri}/`;

type verificationMethodsType = 'code' | 'token';
const verificationMethods: verificationMethodsType = 'code';

// https://docs.amplify.aws/javascript/build-a-backend/auth/set-up-auth/
const amplifyconfig = {
  Auth: {
    Cognito: {
      userPoolId: env.VITE_USER_POOLS_ID,
      userPoolClientId: env.VITE_USER_POOLS_WEB_CLIENT_ID,
      signUpVerificationMethod: verificationMethods, // 'code' | 'link'
      loginWith: {
        oauth: {
          domain: env.VITE_AWS_DOMAIN || "prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com",
          scopes: [ 'openid' ],
          redirectSignIn: [ redirectSignInUri ],
          redirectSignOut: [ redirectSignOut ],
          responseType: verificationMethods
        }
      }
    }
  }
};

export default amplifyconfig;
