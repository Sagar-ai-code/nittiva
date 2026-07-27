#!/usr/bin/env bash
# Smoke test the Nittiva live API.
# Usage:
#   ./scripts/smoke-test.sh
#   BASE_URL=http://localhost:8000 ./scripts/smoke-test.sh
#   ADMIN_EMAIL=foo@bar ADMIN_PASSWORD=baz ./scripts/smoke-test.sh
# Requires: curl, jq

set -uo pipefail

API_URL="${API_URL:-https://nittiva-backend.onrender.com/api}"
ROOT_URL="${ROOT_URL:-https://nittiva-backend.onrender.com}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@nittiva.local}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@123}"

LOG_FILE="${LOG_FILE:-smoke-test.log}"
: > "$LOG_FILE"

pass=0
fail=0
failures=()

# check NAME EXPECTED METHOD URL [DATA] [AUTH_HEADER]
check() {
  local name="$1" expected="$2" method="$3" url="$4" data="${5:-}" auth="${6:-}"
  local args=(-s -o /tmp/smoke_body -w "%{http_code}" -X "$method" \
              -H "Content-Type: application/json" -H "Accept: application/json" \
              "$url")
  [[ -n "$auth" ]] && args+=(-H "Authorization: Bearer $auth")
  [[ -n "$data" ]] && args+=(-d "$data")
  local code
  code=$(curl "${args[@]}" 2>>"$LOG_FILE") || code="000"
  local body
  body=$(cat /tmp/smoke_body 2>/dev/null | head -c 200)
  if [[ "$code" == "$expected" ]]; then
    printf "  \033[32m✓\033[0m %-40s [%s]\n" "$name" "$code"
    pass=$((pass+1))
  else
    printf "  \033[31m✗\033[0m %-40s [got %s, want %s]\n" "$name" "$code" "$expected"
    printf "      body: %s\n" "$body"
    fail=$((fail+1))
    failures+=("$name (got $code, want $expected)")
  fi
}

echo "Nittiva smoke test - $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "API URL:  $API_URL"
echo "Root URL: $ROOT_URL"

# Health (no auth)
echo
echo "Health"
check "GET /healthz"  200 GET "$API_URL/healthz"
check "GET /readyz"   200 GET "$API_URL/readyz"
check "GET / (root)"  200 GET "$ROOT_URL/"

# Login
echo
echo "Auth"
login_body=$(jq -nc --arg e "$ADMIN_EMAIL" --arg p "$ADMIN_PASSWORD" \
              '{email:$e, password:$p, company_id:"ADMIN"}')
check "POST /auth/login" 200 POST "$API_URL/auth/login" "$login_body"

# Token is at .data.access (JWT simplejwt pattern), with fallbacks
TOKEN=$(jq -r '.data.access // .access // .data.access_token // .access_token // .token // empty' \
        /tmp/smoke_body 2>/dev/null)
REFRESH=$(jq -r '.data.refresh // .refresh // .data.refresh_token // .refresh_token // empty' \
        /tmp/smoke_body 2>/dev/null)
if [[ -z "$TOKEN" ]]; then
  echo "  ✗ Could not extract access token from /auth/login response"
  echo "      body: $(cat /tmp/smoke_body | head -c 400)"
  exit 1
fi
echo "  (token acquired, ${#TOKEN} chars)"

# Token refresh — simplejwt's TokenRefreshView expects {refresh: "..."}
echo
echo "JWT"
if [[ -n "$REFRESH" ]]; then
  check "POST /auth/token/refresh/" 200 POST "$API_URL/auth/token/refresh/" \
    "$(jq -nc --arg r "$REFRESH" '{refresh:$r}')"
else
  printf "  \033[33m⊘\033[0m %-40s [no refresh token in login response]\n" \
    "POST /auth/token/refresh/"
fi

# New viewsets
echo
echo "Round 3 - Note / Todo / Meeting"
check "GET /notes/"          200 GET "$API_URL/notes/"                  "" "$TOKEN"
check "GET /todos/"          200 GET "$API_URL/todos/"                  "" "$TOKEN"
check "GET /meetings/"       200 GET "$API_URL/meetings/"               "" "$TOKEN"

echo
echo "Round 4 - LeaveRequest / Notification"
check "GET /leave-requests/" 200 GET "$API_URL/leave-requests/"         "" "$TOKEN"
check "GET /notifications/"  200 GET "$API_URL/notifications/"          "" "$TOKEN"
check "GET /notifications/unread_count/" 200 GET "$API_URL/notifications/unread_count/" "" "$TOKEN"

echo
echo "Round 5 - Chat / Invoice"
check "GET /chat/rooms/"     200 GET "$API_URL/chat/rooms/"             "" "$TOKEN"
check "GET /invoices/"       200 GET "$API_URL/invoices/"               "" "$TOKEN"

echo
echo "Round 6 - Mentions + Task Subscribers"
check "GET /task-subscribers/" 200 GET "$API_URL/task-subscribers/"     "" "$TOKEN"

# Sanity: pre-existing viewsets
echo
echo "Sanity - pre-existing viewsets"
check "GET /users/me/"       200 GET "$API_URL/users/me/"               "" "$TOKEN"
check "GET /projects/"       200 GET "$API_URL/projects/"               "" "$TOKEN"
check "GET /tasks/"          200 GET "$API_URL/tasks/"                  "" "$TOKEN"
check "GET /clients/"        200 GET "$API_URL/clients/"                "" "$TOKEN"
check "GET /sprints/"        200 GET "$API_URL/sprints/"                "" "$TOKEN"
check "GET /goals/"          200 GET "$API_URL/goals/"                  "" "$TOKEN"
check "GET /comments/"       200 GET "$API_URL/comments/"               "" "$TOKEN"
check "GET /attachments/"    200 GET "$API_URL/attachments/"            "" "$TOKEN"
check "GET /time-logs/"      200 GET "$API_URL/time-logs/"              "" "$TOKEN"
check "GET /task-statuses/"  200 GET "$API_URL/task-statuses/"          "" "$TOKEN"
check "GET /task-priorities/" 200 GET "$API_URL/task-priorities/"       "" "$TOKEN"

# PDF content-type check
echo
echo "PDF"
INVOICE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
             "$API_URL/invoices/" | jq -r '.[0].id // .results[0].id // empty' 2>/dev/null)
if [[ -n "$INVOICE_ID" ]]; then
  check "GET /invoices/$INVOICE_ID/pdf/  (status 200)" 200 \
    "GET" "$API_URL/invoices/$INVOICE_ID/pdf/" "" "$TOKEN"
  ct=$(curl -s -o /dev/null -w "%{content_type}" \
       -H "Authorization: Bearer $TOKEN" \
       "$API_URL/invoices/$INVOICE_ID/pdf/")
  if [[ "$ct" == application/pdf* ]]; then
    printf "  \033[32m✓\033[0m %-40s [%s]\n" "PDF content-type is application/pdf" "$ct"
    pass=$((pass+1))
  else
    printf "  \033[31m✗\033[0m %-40s [got %s]\n" "PDF content-type" "$ct"
    fail=$((fail+1))
    failures+=("PDF content-type (got $ct)")
  fi
else
  printf "  \033[33m⊘\033[0m %-40s [no invoices in DB to test]\n" "GET /invoices/<id>/pdf/"
fi

# Summary
echo
echo "==============================================="
printf "Result: %d passed, %d failed\n" "$pass" "$fail"
echo "==============================================="

if (( fail > 0 )); then
  echo "Failures:"
  for f in "${failures[@]}"; do echo "  - $f"; done
  echo "Full log: $LOG_FILE"
  exit 1
fi
echo "All good."
