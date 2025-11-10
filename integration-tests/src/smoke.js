import axios from "axios";

const backendBase =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:5000";
const origin =
  process.env.SMOKE_ORIGIN ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";
const DEFAULT_TIMEOUT_MS = 5000;
const MIN_TIMEOUT_MS = 1000;

const timeoutMs = (() => {
  const parsed = Number.parseInt(process.env.SMOKE_TIMEOUT ?? "", 10);
  if (Number.isFinite(parsed) && parsed >= MIN_TIMEOUT_MS) {
    return parsed;
  }
  return DEFAULT_TIMEOUT_MS;
})();
const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");

const checks = [
  {
    name: "health",
    url: `${backendBase}/health`,
    validate: (response) =>
      response.status === 200 && response.data?.message === "OK"
  },
  {
    name: "api root",
    url: `${backendBase}/api/`,
    validate: (response) =>
      response.status === 200 && response.data?.success === true
  }
];

if (frontendUrl) {
  checks.push({
    name: "frontend",
    url: frontendUrl,
    validate: (response) => response.status === 200
  });
  checks.push({
    name: "frontend security headers",
    url: frontendUrl,
    validate: (response) => {
      const permissionsPolicy = response.headers['permissions-policy'];
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
      return response.status === 200;
    }
  });
}

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
