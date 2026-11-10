// Minimal native fetch helper that keeps the HTTP client semantics callers relied on:
// default Accept header, HTTP Basic auth, JSON request bodies, JSON-or-text response
// bodies, lower-cased header objects, validateStatus (default 2xx) and timeouts.
// Rejected statuses throw HttpError with `response`; network failures and timeouts
// throw HttpError without `response` and with `code` (timeouts use ECONNABORTED).
class HttpError extends Error {
  constructor(message, { code, response, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'HttpError';
    this.code = code;
    this.response = response;
  }
}

const defaultValidateStatus = (status) => status >= 200 && status < 300;

function toNetworkError(error, timeoutMs) {
  if (error?.name === 'TimeoutError') {
    return new HttpError(`timeout of ${timeoutMs}ms exceeded`, {
      code: 'ECONNABORTED',
      cause: error,
    });
  }
  const cause = error?.cause;
  return new HttpError(cause?.message ?? error?.message ?? 'Network error', {
    code: cause?.code ?? error?.code,
    cause: error,
  });
}

async function httpRequest(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    auth,
    body,
    timeoutMs,
    validateStatus = defaultValidateStatus,
    redirect = 'follow',
  } = options;

  const finalHeaders = new Headers({ Accept: 'application/json, text/plain, */*' });
  for (const [key, value] of Object.entries(headers)) {
    finalHeaders.set(key, value);
  }
  if (auth) {
    const credentials = `${auth.username ?? ''}:${auth.password ?? ''}`;
    finalHeaders.set(
      'Authorization',
      `Basic ${Buffer.from(credentials, 'utf8').toString('base64')}`,
    );
  }

  let payload;
  if (body !== undefined && body !== null) {
    if (typeof body === 'string') {
      payload = body;
    } else {
      payload = JSON.stringify(body);
      if (!finalHeaders.has('Content-Type')) {
        finalHeaders.set('Content-Type', 'application/json');
      }
    }
  }

  let response;
  let text;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: payload,
      redirect,
      signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined,
    });
    text = await response.text();
  } catch (error) {
    throw toNetworkError(error, timeoutMs);
  }

  let data = text;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  const result = {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    data,
  };
  if (!validateStatus(result.status)) {
    throw new HttpError(`Request failed with status code ${result.status}`, { response: result });
  }
  return result;
}

module.exports = { HttpError, httpRequest };
