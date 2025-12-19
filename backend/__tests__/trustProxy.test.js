const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveTrustProxy } = require('../config/trustProxy');

test('resolveTrustProxy defaults to 1 when value is undefined', () => {
  assert.equal(resolveTrustProxy(undefined), 1);
});

test('resolveTrustProxy parses boolean strings', () => {
  assert.equal(resolveTrustProxy('true'), true);
  assert.equal(resolveTrustProxy('false'), false);
});

test('resolveTrustProxy parses numeric strings', () => {
  assert.equal(resolveTrustProxy('2'), 2);
  assert.equal(resolveTrustProxy('0'), 0);
});

test('resolveTrustProxy returns original value for other inputs', () => {
  assert.equal(resolveTrustProxy('loopback'), 'loopback');
});

