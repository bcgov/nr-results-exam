import { env } from './env';

const ZONE = (env.VITE_ZONE ?? "DEV").toLocaleLowerCase();
const logoutDomain = `https://logon${ZONE === "prod" ? '' : 'test'}7.gov.bc.ca`;
const returnUrlHost = ZONE === "prod" ? "loginproxy" : ZONE === "test" ? "test.loginproxy" : "dev.loginproxy";
const retUrl = `https://${returnUrlHost}.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout`;

/**
 * Constructs the OAuth redirect URI using the redirect-from URL format (without -frontend suffix).
 * This ensures the redirect URI matches Cognito's allowlist, which likely only includes
 * the redirect-from URL format (e.g., nr-results-exam-48.apps.silver.devops.gov.bc.ca)
 * rather than the main URL format (e.g., nr-results-exam-48-frontend.apps.silver.devops.gov.bc.ca).
 * 
 * The redirect-from URL is configured in OpenShift to redirect to the main URL, so this works
 * regardless of which URL the user initially accessed.
 */
const getRedirectSignInUri = (): string => {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // Check if hostname contains -frontend suffix (e.g., nr-results-exam-48-frontend.apps.silver.devops.gov.bc.ca)
  const frontendMatch = hostname.match(/^(.+)-frontend\.(.+)$/);
  if (frontendMatch) {
    // Construct redirect-from URL format (without -frontend)
    // This format should match what's in Cognito's allowlist
    const redirectFromHostname = `${frontendMatch[1]}.${frontendMatch[2]}`;
    const redirectFromOrigin = `${window.location.protocol}//${redirectFromHostname}`;
    console.log('Using redirect-from URL format for OAuth redirect URI:', redirectFromOrigin);
    return `${redirectFromOrigin}/dashboard`;
  }
  
  // Use current origin if no -frontend suffix (already in redirect-from format)
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
