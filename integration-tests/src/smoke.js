import axios from "axios";

const backendBase =
  process.env.BACKEND_URL?.replace(/\/$/, "") ??
  process.env.BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:5000";
const origin =
  process.env.SMOKE_ORIGIN ??
  process.env.FRONTEND_URL ??
  "http://localhost:3000";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT ?? 5000);
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
    throw new Error("Smoke checks failed");
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
