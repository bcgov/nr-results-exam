# Cognito Token Exchange Error Analysis

## Error Details

**Error Type:** `UserLambdaValidationException`  
**Error Code:** `PreTokenGeneration failed`  
**Root Cause:** Lambda function cannot resolve RDS proxy hostname

### Full Error Response
```json
{
    "error": "PreTokenGeneration failed with error could not translate host name \"prod-fam-cluster-fam-api-proxy-api.proxy-cf4nnpub1efl.ca-central-1.rds.amazonaws.com\" to address: System error\n. (Service: AWSCognitoIdentityProviderInternalService; Status Code: 400; Error Code: UserLambdaValidationException; Request ID: 46c87964-4642-4648-bb41-6581793e779b; Proxy: null)"
}
```

## What This Means

1. **OAuth Flow is Working Correctly:**
   - User authentication succeeds
   - Redirect URI is correct
   - Authorization code is valid
   - The issue occurs during token generation

2. **The Problem:**
   - Cognito has a **PreTokenGeneration Lambda trigger** configured
   - This Lambda function runs during token generation to customize tokens
   - The Lambda is trying to connect to an RDS proxy: `prod-fam-cluster-fam-api-proxy-api.proxy-cf4nnpub1efl.ca-central-1.rds.amazonaws.com`
   - The Lambda cannot resolve this hostname (DNS failure)

## Why This Started Recently

Possible causes:
1. **RDS Proxy endpoint changed** - The proxy was recreated or renamed
2. **Network/VPC configuration changed** - Lambda lost access to resolve the hostname
3. **DNS resolution issue** - Lambda's VPC doesn't have proper DNS configuration
4. **RDS Proxy deleted/recreated** - New proxy has different endpoint

## Impact

- **All login attempts fail** with 400 Bad Request
- Users cannot authenticate
- The application code is not at fault

## Resolution Required

This must be fixed by the team managing:
- **AWS Cognito User Pool** - PreTokenGeneration Lambda trigger
- **AWS Lambda function** - The PreTokenGeneration function
- **AWS RDS Proxy** - The database proxy endpoint
- **AWS VPC/Networking** - Lambda VPC configuration and DNS

### What Needs to Happen

1. **Verify RDS Proxy exists and is accessible:**
   - Check if `prod-fam-cluster-fam-api-proxy-api.proxy-cf4nnpub1efl.ca-central-1.rds.amazonaws.com` is still valid
   - Verify the proxy is in the correct state

2. **Check Lambda VPC Configuration:**
   - Ensure Lambda has proper VPC configuration
   - Verify DNS resolution is working in Lambda's VPC
   - Check security groups allow Lambda to reach RDS proxy

3. **Update Lambda Function:**
   - Fix the hostname if RDS proxy was recreated
   - Add error handling for DNS resolution failures
   - Consider making the database call optional or adding retry logic

4. **Alternative: Temporarily Disable PreTokenGeneration:**
   - If the Lambda isn't critical, it could be temporarily disabled
   - This would allow logins to work while the underlying issue is fixed

## Application Code Status

✅ **No code changes needed** - This is purely an infrastructure/configuration issue.

The application's OAuth flow is working correctly. The failure occurs in Cognito's Lambda trigger, which is outside the application's control.

## Related Files

- `frontend/src/contexts/AuthProvider.tsx` - Contains error logging (now shows this error)
- `frontend/src/amplifyconfiguration.ts` - OAuth configuration (working correctly)

