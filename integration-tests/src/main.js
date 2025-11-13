import dotenv from "dotenv";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import assert from "node:assert/strict";

import pkg from "lodash";

dotenv.config();

const { isEqual, omit } = pkg;

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
const apiName = process.env.API_NAME;
const BASE_URL = process.env.BASE_URL;

async function performEachMethod(BASE_URL, testCase, method, id) {
  let url = BASE_URL + testCase.path;
  if (id && (method === "GET" || method === "PUT" || method === "PATCH" || method === "DELETE")) {
    if (url.endsWith("/") === false) {
      url = url + "/" + id;
    } else {
      url = url + id;
    }
  }
  let payload;
  if (method === "POST") {
    payload = testCase.data?.post_payload;
  } else if (method === "PUT") {
    payload = testCase.data?.put_payload;
  } else if (method === "PATCH") {
    payload = testCase.data?.patch_payload;
  }
  const response = await axios({
    method: method,
    url: url,
    headers: {
      ...testCase.headers
    },
    data: payload
  });
  console.info(`Response for ${method} ${url} : ${response.status}`);
  const methodAssertion = testCase.assertions.find(assertion => assertion.method === method);
  const responseData = response.data?.data || response.data;
  if (methodAssertion) {
    if (methodAssertion.status_code) {
      assert(response.status === methodAssertion.status_code);
    }
    if (methodAssertion.body) {
      assert(isEqual(omit(responseData, testCase.data.id_field), methodAssertion.body) === true);
    }
  }
  if (method === "POST") {
    return responseData[testCase.data.id_field];
  }
}

async function performTesting(testSuite) {
  console.info(`Running test suite for : ${testSuite.api_name || "unknown suite"}`);
  for (const testCase of testSuite.tests) {
    let id = null;
    for (const method of testCase.methods) {
      const responseId = await performEachMethod(BASE_URL, testCase, method, id);
      if (responseId) {
        id = responseId;
      }
    }
  }
}

const main = async () => {
  if (!apiName) {
    throw new Error("API_NAME environment variable is required to select an integration test suite.");
  }
  const testSuitesDir = path.join(__dirname, "test_suites");
  const testSuiteFiles = await fs.promises.readdir(testSuitesDir);
  const availableSuites = [];

  for (const testSuiteFile of testSuiteFiles) {
    if (!testSuiteFile.endsWith(".json")) {
      continue;
    }
    const testSuitePath = path.join(testSuitesDir, testSuiteFile);
    let testSuite;
    try {
      const rawSuite = await fs.promises.readFile(testSuitePath, "utf-8");
      testSuite = JSON.parse(rawSuite);
    } catch (error) {
      throw new Error(`Failed to read or parse integration test suite "${testSuiteFile}": ${error instanceof Error ? error.message : String(error)}`);
    }
    if (testSuite.api_name === apiName) {
      await performTesting(testSuite);
      return;
    }
    availableSuites.push(testSuite.api_name || testSuiteFile);
  }

  throw new Error(
    `No integration test suite found for API_NAME=${apiName}. Available suites: ${availableSuites.length > 0 ? availableSuites.join(", ") : "none"}.`
  );
};

try {
  await main();
} catch (e) {
  if (e instanceof assert.AssertionError) {
    console.error(e);
    process.exit(137);
  }
  console.error(e);
  process.exit(137);
}


