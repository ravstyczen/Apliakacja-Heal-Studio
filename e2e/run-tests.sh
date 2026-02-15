#!/bin/bash
#
# Run E2E tests against a deployment URL.
#
# Usage:
#   ./e2e/run-tests.sh                                    # test production
#   ./e2e/run-tests.sh https://your-preview-url.vercel.app # test specific deployment
#
# First-time setup:
#   1. npm install
#   2. npx playwright install chromium
#   3. npx playwright test --project=auth-setup --headed
#      (This opens a browser for you to log in via Google OAuth)
#   4. ./e2e/run-tests.sh
#
# The auth session is saved in e2e/.auth/user.json and reused
# for ~7 days before needing re-authentication.
#

set -e

BASE_URL="${1:-https://apliakacja-heal-studio.vercel.app}"

echo "============================================"
echo " Heal Pilates Studio - E2E Tests"
echo " Testing: $BASE_URL"
echo "============================================"
echo ""

# Check if auth file exists
if [ ! -f "e2e/.auth/user.json" ]; then
  echo "No auth session found. Running first-time login..."
  echo "A browser will open - please log in with Google."
  echo ""
  BASE_URL="$BASE_URL" npx playwright test --project=auth-setup --headed
  echo ""
fi

# Run smoke tests first (fastest, catches critical issues)
echo "--- Running smoke tests ---"
BASE_URL="$BASE_URL" npx playwright test smoke.spec.ts --project=e2e
echo ""

# Run feature tests
echo "--- Running calendar tests ---"
BASE_URL="$BASE_URL" npx playwright test calendar.spec.ts --project=e2e
echo ""

echo "--- Running client tests ---"
BASE_URL="$BASE_URL" npx playwright test clients.spec.ts --project=e2e
echo ""

echo "--- Running instructor tests ---"
BASE_URL="$BASE_URL" npx playwright test instructors.spec.ts --project=e2e
echo ""

echo "--- Running settlement tests ---"
BASE_URL="$BASE_URL" npx playwright test settlements.spec.ts --project=e2e
echo ""

echo "============================================"
echo " All tests passed!"
echo " Report: npx playwright show-report"
echo "============================================"
