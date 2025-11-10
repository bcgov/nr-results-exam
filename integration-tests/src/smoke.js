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
const DEFAULT_RETRIES = 5;
const MIN_RETRIES = 1;
const DEFAULT_RETRY_DELAY_MS = 2000;
const MIN_RETRY_DELAY_MS = 0;

const timeoutMs = (() => {
  const parsed = Number.parseInt(process.env.SMOKE_TIMEOUT ?? "", 10);
  if (Number.isFinite(parsed) && parsed >= MIN_TIMEOUT_MS) {
    return parsed;
  }
  return DEFAULT_TIMEOUT_MS;
})();

const retries = (() => {
  const parsed = Number.parseInt(process.env.SMOKE_RETRIES ?? "", 10);
  if (Number.isFinite(parsed) && parsed >= MIN_RETRIES) {
    return parsed;
  }
  return DEFAULT_RETRIES;
})();

const retryDelayMs = (() => {
  const parsed = Number.parseInt(process.env.SMOKE_RETRY_DELAY_MS ?? "", 10);
  if (Number.isFinite(parsed) && parsed >= MIN_RETRY_DELAY_MS) {
    return parsed;
  }
  return DEFAULT_RETRY_DELAY_MS;
})();

const delay = async (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
}

const run = async () => {
  for (const check of checks) {
    let attempt = 0;
    let success = false;

    while (attempt < retries && !success) {
      attempt += 1;
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
          `✅ ${check.name} responded with ${response.status} from ${check.url} (attempt ${attempt}/${retries})`
        );
        success = true;
      } catch (error) {
        const attemptMsg = `attempt ${attempt}/${retries}`;
        const reason = axios.isAxiosError(error)
          ? `Request error: ${error.message} (status: ${error.response?.status ?? "n/a"})`
          : String(error);

        if (attempt < retries) {
          console.warn(
            `WARN ${check.name} ${attemptMsg} failed (${reason}). Retrying after ${retryDelayMs}ms...`
          );
          if (axios.isAxiosError(error) && error.response?.data) {
            console.warn("Response body:", error.response.data);
          }
          if (retryDelayMs > 0) {
            await delay(retryDelayMs);
          }
        } else {
          console.error(`❌ ${check.name} failed (${attemptMsg})`);
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
        }
      }
    }

    if (!success) {
      console.error("Smoke checks failed");
      break;
    }
  }

  if (process.exitCode === 1) {
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
