function resolveTrustProxy(value) {
  if (value === undefined) return 1;
  if (value === 'true') return true;
  if (value === 'false') return false;

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return value;
}

module.exports = {
  resolveTrustProxy
};

