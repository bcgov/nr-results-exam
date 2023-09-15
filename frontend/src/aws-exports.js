import { env } from './env';
const awsconfig = {
    aws_cognito_region: 'ca-central-1',
    aws_user_pools_id: env.VITE_USER_POOLS_ID,
    aws_user_pools_web_client_id: env.VITE_USER_POOLS_WEB_CLIENT_ID,
    aws_mandatory_sign_in: 'enable',
    oauth: {
        domain: 'test-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com',
        scope: ['openid'],
        redirectSignIn: "http://localhost:3000/dashboard",
        redirectSignOut: "https://logontest7.gov.bc.ca/clp-cgi/logoff.cgi?retnow=1&returl=https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/logout?redirect_uri=http://localhost:3000/",
        responseType: 'code',
    },
    federationTarget: 'COGNITO_USER_POOLS',
};

export default awsconfig;