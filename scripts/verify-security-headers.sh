#!/bin/bash

# Script to verify COOP/COEP security headers are configured
# This validates the Spectre vulnerability mitigation measures

echo "=== COOP/COEP Security Headers Verification ==="
echo ""

# Check Caddyfile for production configuration
echo "1. Checking Caddyfile (Production Configuration)..."
if grep -q "Cross-Origin-Opener-Policy" frontend/Caddyfile && \
   grep -q "Cross-Origin-Embedder-Policy" frontend/Caddyfile; then
    echo "   ✓ COOP/COEP headers found in Caddyfile"
    echo "   - COOP: $(grep "Cross-Origin-Opener-Policy" frontend/Caddyfile | xargs)"
    echo "   - COEP: $(grep "Cross-Origin-Embedder-Policy" frontend/Caddyfile | xargs)"
else
    echo "   ✗ COOP/COEP headers NOT found in Caddyfile"
    exit 1
fi

echo ""

# Check Vite config for development configuration
echo "2. Checking vite.config.ts (Development Configuration)..."
if grep -q "Cross-Origin-Opener-Policy" frontend/vite.config.ts && \
   grep -q "Cross-Origin-Embedder-Policy" frontend/vite.config.ts; then
    echo "   ✓ COOP/COEP headers found in vite.config.ts"
    echo "   - Found in server.headers configuration"
else
    echo "   ✗ COOP/COEP headers NOT found in vite.config.ts"
    exit 1
fi

echo ""

# Check documentation exists
echo "3. Checking documentation..."
if [ -f "docs/SECURITY-HEADERS.md" ]; then
    echo "   ✓ Security headers documentation exists"
    echo "   - Path: docs/SECURITY-HEADERS.md"
else
    echo "   ✗ Security headers documentation NOT found"
    exit 1
fi

echo ""
echo "=== All Checks Passed ==="
echo ""
echo "To test the headers at runtime:"
echo "  1. Development: npm start (in frontend/)"
echo "  2. Production: docker compose --profile caddy up"
echo "  3. Check headers in browser DevTools → Network tab"
echo "  4. Verify cross-origin isolation: console.log(self.crossOriginIsolated)"
