import { afterEach, describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { HttpError, httpRequest } from "./http.js";

const respond = (status, body, headers) =>
  mock.method(globalThis, "fetch", async () => new Response(body, { status, headers }));

describe("httpRequest", () => {
  afterEach(() => mock.restoreAll());

  it("sends headers, follows redirects by default and returns lower-cased headers", async () => {
    const fetchMock = respond(200, JSON.stringify({ status: "ok" }), {
      "Content-Type": "application/json",
    });
    const res = await httpRequest("https://x/health", {
      headers: { Origin: "https://x" },
      timeoutMs: 1000,
    });
    assert.equal(res.status, 200);
    assert.deepEqual(res.data, { status: "ok" });
    assert.equal(res.headers["content-type"], "application/json");
    const [url, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, "https://x/health");
    assert.equal(init.method, "GET");
    assert.equal(init.redirect, "follow");
    assert.equal(init.headers.get("origin"), "https://x");
    assert.equal(init.headers.get("accept"), "application/json, text/plain, */*");
    assert.ok(init.signal instanceof AbortSignal);
  });

  it("returns HTML bodies as text", async () => {
    respond(200, "<!DOCTYPE html><html></html>", { "Content-Type": "text/html" });
    const res = await httpRequest("https://x");
    assert.equal(res.data, "<!DOCTYPE html><html></html>");
  });

  it("throws HttpError with the response for statuses validateStatus rejects", async () => {
    respond(503, JSON.stringify({ error: "down" }));
    await assert.rejects(httpRequest("https://x"), (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.message, "Request failed with status code 503");
      assert.equal(error.response.status, 503);
      assert.deepEqual(error.response.data, { error: "down" });
      return true;
    });
  });

  it("accepts statuses allowed by a custom validateStatus", async () => {
    respond(401, "");
    const res = await httpRequest("https://x", { validateStatus: (status) => status === 401 });
    assert.equal(res.status, 401);
    assert.equal(res.data, "");
  });

  it("returns redirects without following them when redirect is manual", async () => {
    const fetchMock = respond(308, null, { Location: "https://frontend/" });
    const res = await httpRequest("https://old", {
      redirect: "manual",
      validateStatus: (status) => status >= 200 && status < 400,
    });
    assert.equal(res.status, 308);
    assert.equal(res.headers.location, "https://frontend/");
    assert.equal(fetchMock.mock.calls[0].arguments[1].redirect, "manual");
  });

  it("maps timeouts to ECONNABORTED and network failures to the cause code", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new DOMException("The operation was aborted due to timeout", "TimeoutError");
    });
    await assert.rejects(httpRequest("https://x", { timeoutMs: 15000 }), (error) => {
      assert.ok(error instanceof HttpError);
      assert.equal(error.code, "ECONNABORTED");
      assert.equal(error.message, "timeout of 15000ms exceeded");
      assert.equal(error.response, undefined);
      return true;
    });
    mock.restoreAll();
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed", {
        cause: Object.assign(new Error("connect ECONNREFUSED 127.0.0.1:3000"), { code: "ECONNREFUSED" }),
      });
    });
    await assert.rejects(httpRequest("https://x"), (error) => {
      assert.equal(error.code, "ECONNREFUSED");
      assert.equal(error.message, "connect ECONNREFUSED 127.0.0.1:3000");
      assert.equal(error.response, undefined);
      return true;
    });
  });
});
