# ZAP Dangerous JS Functions Audit Report

## Issue Summary
ZAP (OWASP Zed Attack Proxy) reported `Dangerous JS Functions [10110]` alert on the frontend JavaScript bundle, flagging the use of `eval()` which poses a potential security risk.

## Investigation Details

### Alert Information
- **Alert ID**: 10110 - Dangerous JS Functions
- **Risk Level**: Medium
- **Detected In**: Built JavaScript bundle (`index-*.js`)
- **Flagged Function**: `eval()`

### Root Cause Analysis

#### Source of eval() Usage
The `eval()` function was traced to the `lottie-web` library (v5.13.0), which is used through the `lottie-react` wrapper.

**Location**: `node_modules/lottie-web/build/player/lottie.js:14422`

**Code Context**:
```javascript
var expression_function = eval('[function _expression_function(){' + val + ';scoped_bm_rt=$bm_rt}]')[0];
```

**Purpose**: This code is part of Lottie's expression engine, which allows After Effects animations to include dynamic expressions. The `eval()` is used to parse and execute animation expressions from the Lottie JSON data.

#### Risk Assessment

**Potential Risk**: ⚠️ Medium
- `eval()` can execute arbitrary JavaScript code
- If animation data came from untrusted sources, malicious code could be injected
- ZAP correctly identified this as a security concern

**Actual Risk**: ✅ Low (Mitigated)
- Application uses **static** animation files bundled at build time
- Animation file (`silva-logo-lottie-1.json`) contains **no expressions**
- **No user-supplied data** reaches the eval execution path
- Animation data is from trusted sources only (developer-controlled assets)

### Animation File Verification

Verified that the application's Lottie animation file does not contain any expressions:
```bash
$ grep -i "expression\|expr" src/assets/lotties/silva-logo-lottie-1.json
# No results - animation contains no expressions
```

## Mitigation Implemented

### Solution: Use Lottie Light Build

Switched to `lottie-web`'s "light" build variant which excludes expression support entirely.

**Benefits**:
1. ✅ Completely removes `eval()` from the bundle
2. ✅ Reduces bundle size by ~237KB (38% reduction from 625KB to 388KB)
   > **Note:** Previous documentation stated a reduction of ~438KB (70%), but the actual reduction observed in the PR/build artifacts is ~237KB (from 625KB to 388KB). This clarifies the true bundle size impact.
3. ✅ Maintains full functionality since animations don't use expressions
4. ✅ Eliminates ZAP security warning
5. ✅ No code changes required in components

### Implementation

Modified `frontend/vite.config.ts` to alias `lottie-web` to the light build:

```typescript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    // Use lottie-web light version to avoid eval() security issues
    // Light version excludes expression support which requires eval
    'lottie-web': 'lottie-web/build/player/lottie_light'
  }
}
```

### Verification

**Build Output - Before**:
```
node_modules/lottie-web/build/player/lottie.js (14422:32): 
Use of eval in "node_modules/lottie-web/build/player/lottie.js" is strongly discouraged
```

**Build Output - After**:
```
✓ built in 12.93s
# No eval warnings
```

**Bundle Analysis**:
```bash
$ grep -c "eval(" build/assets/index-*.js
0  # No eval found in bundle
```

**Test Results**:
- ✅ All 73 frontend tests pass
- ✅ No functionality regressions
- ✅ Lottie animations render correctly

## Additional Security Considerations

### Current State
- **Static Assets Only**: All animation files are bundled at build time
- **No Dynamic Loading**: Application does not load animations from external sources
- **No User Input**: Users cannot upload or provide animation data

### Recommendations for Future

If the application needs to support dynamic animations in the future:

1. **Do NOT load animations from untrusted sources**
2. **Sanitize animation JSON** before rendering if accepting external data
3. **Consider CSP (Content Security Policy)** headers to prevent eval execution
4. **Use the light build** unless expressions are explicitly required
5. **If expressions are needed**:
   - Validate animation sources are trusted
   - Implement strict input validation
   - Consider sandboxing animation rendering

## Lottie-Web Build Variants

For future reference, lottie-web provides several build variants:

| Build | Size | Expressions | Use Case |
|-------|------|-------------|----------|
| `lottie.js` | 625KB | ✅ Yes (uses eval) | Full features, trusted sources only |
| `lottie_light.js` | 388KB | ❌ No | **Recommended** - Most animations |
| `lottie_svg.js` | 513KB | ✅ Yes | SVG renderer only |
| `lottie_canvas.js` | 557KB | ✅ Yes | Canvas renderer only |
| `lottie_light_canvas.js` | 457KB | ❌ No | Canvas, no expressions |
| `lottie_light_html.js` | 434KB | ❌ No | HTML, no expressions |

## References

- [OWASP ZAP - Dangerous JS Functions](https://www.zaproxy.org/docs/alerts/10110/)
- [Lottie Web GitHub](https://github.com/airbnb/lottie-web)
- [Lottie Expressions Documentation](https://github.com/bodymovin/bodymovin/wiki/Expressions)
- [MDN - eval() Security Risks](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!)

## Conclusion

The ZAP alert was valid and correctly identified a potential security risk. However, through investigation we determined:

1. The application's use of `eval()` was inherited from a dependency (lottie-web)
2. No user-controlled data reaches the eval execution path
3. The eval functionality (expressions) is not needed by the application
4. Mitigation was successfully implemented by using the light build variant
5. The security concern is now **fully resolved**

**Status**: ✅ **RESOLVED** - No dangerous functions in production bundle
