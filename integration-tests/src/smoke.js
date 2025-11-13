import axios from "axios";

const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const origin = process.env.SMOKE_ORIGIN ?? frontendUrl;
const DEFAULT_TIMEOUT_MS = 5000;
const MIN_TIMEOUT_MS = 1000;

const timeoutMs = (() => {
  const parsed = Number.parseInt(process.env.SMOKE_TIMEOUT ?? "", 10);
  if (Number.isFinite(parsed) && parsed >= MIN_TIMEOUT_MS) {
    return parsed;
  }
  return DEFAULT_TIMEOUT_MS;
})();

const checks = [
  {
    name: "health",
    url: `${frontendUrl}/health`,
    validate: (response) =>
      response.status === 200 && response.data?.message === "OK"
  },
  {
    name: "api root",
    url: `${frontendUrl}/api/`,
    validate: (response) =>
      response.status === 200 && response.data?.success === true
  },
  {
    name: "frontend",
    url: frontendUrl,
    validate: (response) => {
      if (response.status !== 200) {
        return false;
      }
      const contentType = response.headers["content-type"] ?? "";
      if (!contentType.includes("text/html")) {
        throw new Error("Frontend response is not HTML content");
      }
      const body = response.data;
      if (typeof body !== "string") {
        throw new Error("Frontend response did not return HTML payload");
      }
      if (!body.toLowerCase().includes("<!doctype html>")) {
        throw new Error("DOCTYPE declaration missing from frontend markup");
      }
      return body.length > 0;
    }
  },
  {
    name: "frontend security headers",
    url: frontendUrl,
    validate: (response) => {
      const headers = response.headers;
      const permissionsPolicy = headers['permissions-policy'];
      if (!permissionsPolicy) {
        throw new Error('Permissions-Policy header is missing');
      }
      // Verify that key security features are disabled
      const requiredPolicies = ['camera=()', 'microphone=()', 'geolocation=()'];
      const hasAllPolicies = requiredPolicies.every(policy => 
        permissionsPolicy.includes(policy)
      );
      if (!hasAllPolicies) {
        throw new Error(`Permissions-Policy header missing required policies. Got: ${permissionsPolicy}`);
      }
      const contentSecurityPolicy = headers['content-security-policy'];
      if (!contentSecurityPolicy) {
        throw new Error('Content-Security-Policy header is missing');
      }
      const requiredDirectives = ["default-src 'self'", "connect-src 'self'"];
      const hasDirectives = requiredDirectives.every((directive) =>
        contentSecurityPolicy.includes(directive)
      );
      if (!hasDirectives) {
        throw new Error(`Content-Security-Policy header missing required directives. Got: ${contentSecurityPolicy}`);
      }
      const requiredHeaderChecks = [
        {
          name: 'strict-transport-security',
          validator: (value) => typeof value === 'string' && value.toLowerCase().includes('max-age=31536000'),
          message: 'Strict-Transport-Security header is missing or not enforcing 1 year max-age'
        },
        {
          name: 'x-content-type-options',
          validator: (value) => value === 'nosniff',
          message: "X-Content-Type-Options header must be set to 'nosniff'"
        },
        {
          name: 'x-frame-options',
          validator: (value) => value === 'SAMEORIGIN',
          message: "X-Frame-Options header must be set to 'SAMEORIGIN'"
        }
      ];

      for (const { name, validator, message } of requiredHeaderChecks) {
        const headerValue = headers[name];
        if (!validator(headerValue)) {
          throw new Error(message);
        }
      }
      return response.status === 200;
    }
  }
];

const run = async () => {
  for (const check of checks) {
    try {
      const response = await axios.get(check.url, {
        headers: {
          Origin: origin
        },
        timeout: timeoutMs
      });

      if (!check.validate(response)) {
        throw new Error(
          `Validation failed for ${check.name}: status=${response.status}`
        );
      }

      console.info(
        `✅ ${check.name} responded with ${response.status} from ${check.url}`
      );
    } catch (error) {
      console.error(`❌ ${check.name} failed`);
      if (axios.isAxiosError(error)) {
        console.error(
          `Request error: ${error.message} (status: ${error.response?.status ?? "n/a"})`
        );
        if (error.response?.data) {
          console.error("Response body:", error.response.data);
        }
      } else {
        console.error(error);
      }
      process.exitCode = 1;
      break;
    }
  }

  if (process.exitCode === 1) {
    console.error("Smoke checks failed");
    return;
  }

  console.info("✅ All smoke checks passed");
};

run().catch((error) => {
  if (process.exitCode !== 1) {
    console.error(error);
  }
  process.exit(process.exitCode ?? 1);
});
