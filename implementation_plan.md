# 🔒 Full API Security Audit — Production Hardening

Comprehensive security audit of all 50+ API routes in the dating app. Below are every vulnerability found, categorized by severity.

---

## User Review Required

> [!CAUTION]
> **17 CRITICAL vulnerabilities** found that MUST be fixed before going to production. Several routes are completely unauthenticated and allow any attacker to modify/delete any user's data.

> [!WARNING]
> **Your `.env` file contains real credentials (MongoDB password, API keys, SMTP password, Stripe keys) and a weak JWT secret.** This file MUST be in `.gitignore` and secrets must be rotated if they've ever been committed to git.

---

## 🚨 CRITICAL — Must Fix (Exploitable Now)

### 1. Weak/Hardcoded JWT Secret
**File**: `lib/auth.ts`
**Risk**: Anyone can forge JWTs with this predictable secret. ALL authentication is bypassed.
**Fix**: Use a 64+ char random secret.

### 2. Hardcoded MongoDB URI with Plain Password
**File**: `app/api/conversations/route.ts`
**Risk**: Database password `nihal` is hardcoded in source code.
**Fix**: Remove the hardcoded fallback entirely.

### 3. NO AUTH: Characters CRUD (GET, POST, PUT, DELETE)
| Route | Method | Issue |
|---|---|---|
| `/api/characters` | GET | Anyone can list ANY user's characters by passing `userId` |
| `/api/characters` | POST | Anyone can create characters for ANY user by passing `userId` |
| `/api/characters/[id]` | PUT | Anyone can update ANY character by passing `userId` |
| `/api/characters/[id]` | DELETE | Anyone can delete ANY character by passing `userId` |

**Risk**: Complete IDOR. No JWT check — userId is taken from request body.
**Fix**: Add `verifyToken()`, derive userId from JWT token, not from request.

### 4. NO AUTH: Profile Update
**File**: `/api/profile`
**Risk**: Anyone can update ANY user's profile (name, bio, avatar) by sending `userId`.

### 5. NO AUTH: Conversations List
**File**: `/api/conversations`
**Risk**: Anyone can read ANY user's conversation list by passing `userId` as a query param.

### 6. NO AUTH: Personas CRUD
**File**: `/api/personas` and `/api/personas/[id]`
**Fix**: Add JWT auth + verify persona belongs to `decoded.userId`.

### 7. NO AUTH: Character Like & Interact
**File**: `/api/characters/[id]/like` and `interact`
**Fix**: Add JWT auth, use `decoded.userId`.

### 8. NO AUTH: Upload Endpoint
**File**: `/api/upload`
**Fix**: Add JWT auth.

### 9. NO AUTH: AI Chat (Mock)
**File**: `/api/ai-chat`
**Fix**: Add JWT auth.

### 10. NO AUTH: Gifts Received Query
**File**: `/api/users/gifts-received`
**Fix**: Add JWT auth, ensure `decoded.userId === userId`.

### 11. NO AUTH: Admin/Setup Endpoints Exposed
**Routes**: `/api/setup`, `/api/init-profiles`, `/api/ai-profiles/seed`, `/api/characters/debug`
**Fix**: Either delete these routes or protect them with a secret admin key.

### 12. Stripe Webhook — Signature Verification DISABLED
**File**: `/api/stripe/webhook`
**Risk**: Anyone can send fake Stripe webhook events to grant themselves free subscriptions.
**Fix**: Uncomment the signature verification code.

### 13. Verify OTP Returns Full User Object
**File**: `/api/auth/verify`
**Risk**: Returns the FULL user document including hashed password, and authToken.

### 14. Google Login Stores JWT in DB + Logs Token
**File**: `/api/auth/google`
**Fix**: Remove `authToken` storage and token logging.

### 15. Error Messages Leak Internal Details
**File**: `/api/auth/google`

---

## ⚠️ HIGH — Should Fix Before Production

### 16. Missing Rate Limiting on Auth Routes
**Routes**: `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/resendotp`, `/api/auth/verify`
**Fix**: Add rate limiting.

### 17. No Password Strength Validation
**File**: `/api/auth/register`

---

## Proposed Changes

### Phase 1: Critical Auth Fixes (All IDOR vulnerabilities)
Add JWT authentication + derive userId from token for all exposed routes (`profile`, `conversations`, `personas`, `upload`, etc.)

### Phase 2: Payment & Admin Security
Enable Stripe signature verification and protect admin seed routes with an `ADMIN_SECRET`.

### Phase 3: Data Leakage & Hardening
Clean up token logging and limit data returned from Google Login / OTP Verify.

### Phase 4: API Rate Limiting for LLMs (NEW)
The current app relies heavily on paid LLM APIs (Grok, ElevenLabs) but lacks proper rate limiting on standard API routes, leaving you vulnerable to runaway costs or automated spam.

#### [NEW] `lib/rateLimit.ts`
- Create a reusable rate-limiter utility. We will use a flexible approach: if `REDIS_URL` is available, it will use `ioredis` for persistent rate tracking across multiple servers. If not, it will fall back to an in-memory `Map`.

#### [MODIFY] `app/api/grok/generate-image/route.ts`
- Apply rate limits to prevent users from spamming Grok image generation (e.g., max 5 requests per minute per user).

#### [MODIFY] `app/api/grok/generate-video/route.ts`
- Apply rate limits to prevent spamming Grok video generation (e.g., max 3 requests per minute per user).

#### [MODIFY] `server.ts`
- Replace the standalone `rateLimitMap` in the socket server with the new centralized rate limiter.

---

## Open Questions

> [!IMPORTANT]
> 1. **Should I fix the remaining critical IDOR vulnerabilities (Phase 1) first, or jump straight to the LLM rate limiters (Phase 4)?**
> 2. **Are 5 images/min and 3 videos/min acceptable limits?** Let me know if you want different thresholds.
> 3. **Redis usage:** Do you currently have a running Redis server connected via `REDIS_URL`? If not, the rate limiter will gracefully fall back to local memory.
