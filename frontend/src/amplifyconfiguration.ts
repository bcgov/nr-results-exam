import { env } from './env';

const ZONE = (env.VITE_ZONE ?? "DEV").toLocaleLowerCase();
const redirectUri = window.location.origin;
const logoutDomain = `https://logon${ZONE === "prod" ? '' : 'test'}7.gov.bc.ca`;
const returnUrlHost = ZONE === "prod" ? "loginproxy" : ZONE === "test" ? "test.loginproxy" : "dev.loginproxy";
const retUrl = `https://${returnUrlHost}.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout`;

const redirectSignOut =
  env.VITE_REDIRECT_SIGN_OUT && env.VITE_REDIRECT_SIGN_OUT.trim() !== ""
    ? env.VITE_REDIRECT_SIGN_OUT
    : `${logoutDomain}/clp-cgi/logoff.cgi?retnow=1&returl=${retUrl}?redirect_uri=${redirectUri}/`;

type verificationMethodsType = 'code' | 'token';
const verificationMethods: verificationMethodsType = 'code';

// Construct redirect URI - try to use format without -frontend suffix for Lambda compatibility
// If the current origin has -frontend, try to construct the redirect-from URL format
// This works because Caddy redirects the redirect-from URL to the main URL
const getRedirectSignInUri = (): string => {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // Check if hostname contains -frontend suffix (e.g., nr-results-exam-48-frontend.apps.silver.devops.gov.bc.ca)
  const frontendMatch = hostname.match(/^(.+)-frontend\.(.+)$/);
  if (frontendMatch) {
    // Construct redirect-from URL format (without -frontend)
    // This format might be what the Lambda expects
    const redirectFromHostname = `${frontendMatch[1]}.${frontendMatch[2]}`;
    const redirectFromOrigin = `${window.location.protocol}//${redirectFromHostname}`;
    console.log('Using redirect-from URL format for OAuth:', redirectFromOrigin);
    return `${redirectFromOrigin}/dashboard`;
  }
  
  // Use current origin if no -frontend suffix
  return `${origin}/dashboard`;
};

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
          redirectSignIn: [ getRedirectSignInUri() ],
          redirectSignOut: [ redirectSignOut ],
          responseType: verificationMethods
        }
      }
    }
  }
};

export default amplifyconfig;
