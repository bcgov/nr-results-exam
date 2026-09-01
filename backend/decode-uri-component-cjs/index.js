'use strict';

// query-string@7 requires a callable CJS export; decode-uri-component@0.5.0 is ESM-only.
module.exports = require('decode-uri-component-fixed').default;
