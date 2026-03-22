# Implementation Plan: Argentum Refinements

## Overview

Implementation is ordered by dependency: schema/types first, then server-side libraries, then API routes, then UI components, then tests and error handling. Each task builds on the previous so there is no orphaned code.

The codebase is TypeScript / Next.js 16 App Router with Supabase. All new server code lives in API route handlers or Supabase Edge Functions.

## Tasks

- [x] 1. Database schema migrations and TypeScript type updates
  - [x] 1.1 Create `collab_requests` table migration SQL
    - Write SQL: `CREATE TABLE collab_requests (id uuid PK, post_id uuid FK posts, applicant_id uuid FK users, message text, status text CHECK('pending','accepted','declined') DEFAULT 'pending', created_at timestamptz, UNIQUE(post_id, applicant_id))`
    - _Requirements: 4.2, 4.3_
  - [x] 1.2 Create `reports` table migration SQL
    - Write SQL: `CREATE TABLE reports (id uuid PK, reporter_id uuid FK users, target_post_id uuid FK posts nullable, target_user_id uuid FK users nullable, reason text, details text, severity text CHECK('low','medium','high'), status text CHECK('pending','resolved'), resolution text nullable, resolved_at timestamptz nullable, created_at timestamptz)`
    - _Requirements: 9.1_
  - [x] 1.3 Add `ip_address` column to `admin_audit_log` and extend `notifications.type`
    - Write SQL: `ALTER TABLE admin_audit_log ADD COLUMN IF NOT EXISTS ip_address text`
    - Write SQL to add `'collab_request'` to the notifications type check constraint or enum
    - _Requirements: 10.1, 4.4_
  - [x] 1.4 Update `src/types/database.ts` with new tables and updated types
    - Add `collab_requests` Row/Insert/Update types
    - Add `reports` Row/Insert/Update types
    - Add `ip_address: string | null` to `admin_audit_log` Row/Insert/Update
    - Extend `notifications.type` union to include `'collab_request'`
    - _Requirements: 4.2, 9.1, 10.1_

- [x] 2. Blockchain / Proof of Build — server-side libraries
  - [x] 2.1 Install `@hashgraph/sdk` and create `src/lib/hedera/hcs.ts`
    - Run `npm install @hashgraph/sdk`
    - Implement `submitToHCS({ postId, userId, contentHash }): Promise<{ sequenceNumber: number }>`
    - Read `HEDERA_OPERATOR_ID`, `HEDERA_OPERATOR_KEY`, `HEDERA_TOPIC_ID` from `process.env`
    - Implement retry loop: up to 3 attempts with exponential backoff (1 s, 2 s, 4 s)
    - _Requirements: 1.1, 1.3, 1.4, 1.5_
  - [x] 2.2 Create `src/lib/hedera/nft.ts`
    - Implement `mintBuildNFT({ postId, contentHash, recipientWallet }): Promise<{ tokenId: string }>`
    - Fall back to treasury account when `recipientWallet` is null
    - Log errors and do not throw on failure
    - _Requirements: 2.1, 2.4, 2.5_
  - [x] 2.3 Create `src/app/api/blockchain/submit/route.ts`
    - POST handler: authenticate user, call `submitToHCS`, update post with `hcs_sequence_num` and `verification_status = 'pending'`
    - On HCS success set `verification_status = 'verified'` and `verified_at = now()`, then call `mintBuildNFT`
    - On HCS final failure set `verification_status = 'unverified'`
    - On NFT failure log error, leave `nft_token_id = null`, do not revert `verification_status`
    - Return `{ status, hcs_sequence_num?, nft_token_id?, error? }` — never 5xx to client
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 2.1, 2.2, 2.3_
  - [ ]* 2.4 Write property test for verification status monotonicity
    - **Property 5: Verification Status Monotonicity**
    - **Validates: Requirements 1.6, 8.2**
    - Test that once a post row has `verification_status = 'verified'`, the submit route logic cannot set it back to `'unverified'` without an explicit admin override flag

- [x] 3. Blockchain / Proof of Build — VerificationBadge UI
  - [x] 3.1 Create `src/components/VerificationBadge.tsx`
    - Accept props: `verificationStatus`, `hcsSequenceNum`, `nftTokenId`, `contentHash`, `verifiedAt`, `topicId`
    - When `verified`: show `hcs_sequence_num`, `nft_token_id`, `content_hash` truncated to 16 chars with copy-to-clipboard button, `verified_at`, Hashscan links for topic message and NFT token
    - When `pending` or `unverified`: show status badge with human-readable explanation
    - Hashscan topic URL format: `https://hashscan.io/mainnet/topic/{topicId}?sequenceNumber={seqNum}`
    - Hashscan NFT URL format: `https://hashscan.io/mainnet/token/{nftTokenId}`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 3.2 Integrate `VerificationBadge` into `src/app/post/[id]/page.tsx`
    - Import and render `<VerificationBadge>` below the post content, passing post fields
    - Call `/api/blockchain/submit` after post creation when `status = 'published'`
    - _Requirements: 3.1, 1.1_

- [x] 4. Checkpoint — Blockchain feature
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Collab Feature — API routes
  - [x] 5.1 Create `src/app/api/collab/apply/route.ts`
    - POST: authenticate user, verify post `is_collab = true` and user is not the author
    - Insert into `collab_requests`; return 409 if `(post_id, applicant_id)` already exists
    - Insert notification for post author with `type = 'collab_request'`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 5.2 Write property test for collab request uniqueness
    - **Property 3: Collab Request Uniqueness**
    - **Validates: Requirements 4.3**
    - Test that calling the apply route twice with the same `(post_id, applicant_id)` results in exactly one DB record and a 409 on the second call
  - [x] 5.3 Create `src/app/api/collab/respond/route.ts`
    - PATCH: authenticate user, verify user is the post author
    - Update `collab_requests.status` to `'accepted'` or `'declined'`
    - Insert notification for applicant
    - _Requirements: 5.2, 5.3_

- [x] 6. Collab Feature — UI components
  - [x] 6.1 Create `src/components/CollabApplyButton.tsx`
    - Show "Apply to Collaborate" when `is_collab = true`, viewer is authenticated and not the author, and no existing request
    - Show "Application Pending" when a pending request exists; disable button
    - Show "Accepted" when request is accepted
    - POST to `/api/collab/apply` on click
    - _Requirements: 4.1, 4.3_
  - [x] 6.2 Create `src/components/CollabRequestsPanel.tsx`
    - Shown to post authors on their own collab posts
    - List pending requests with applicant avatar, username, and message
    - Accept/Decline buttons that PATCH `/api/collab/respond`
    - "Message" button that navigates to `/messages` with collaborator pre-selected
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 6.3 Integrate collab components into post detail page and post cards
    - Render `<CollabApplyButton>` on `src/app/post/[id]/page.tsx` and `src/components/PostCard.tsx` when `post.is_collab = true`
    - Render `<CollabRequestsPanel>` on `src/app/post/[id]/page.tsx` when viewer is the post author
    - Display pending request count badge on post cards
    - _Requirements: 4.1, 4.5, 5.1_

- [x] 7. Disappearing Messages — UI controls
  - [x] 7.1 Create `src/app/api/messages/settings/route.ts`
    - PATCH: authenticate user, verify user is a participant in the conversation
    - Update `conversations.disappearing_messages`
    - Insert a system message into the conversation indicating the change and who made it
    - _Requirements: 6.2_
  - [x] 7.2 Create `src/components/DisappearingMessageSettings.tsx`
    - Dropdown with options: `off`, `24h`, `7d`
    - Display current setting from conversation data
    - On change, PATCH `/api/messages/settings` and update local state
    - _Requirements: 6.1, 6.2_
  - [x] 7.3 Create `src/components/MessageExpiryIndicator.tsx`
    - Accept `expiresAt: string | null` prop
    - Use `useEffect` interval to check if `expires_at < Date.now()`
    - When expired, replace message content with "This message has expired."
    - Render a countdown badge when not yet expired
    - _Requirements: 6.3, 6.4_
  - [x] 7.4 Integrate disappearing message components into `src/app/messages/[conversationId]/page.tsx`
    - Render `<DisappearingMessageSettings>` in the conversation header/settings panel
    - Display active setting as a persistent badge in the conversation header
    - Wrap each message with `<MessageExpiryIndicator>` when `expires_at` is set
    - _Requirements: 6.1, 6.3, 6.5_

- [x] 8. Disappearing Messages — Expiry Worker
  - [x] 8.1 Create `supabase/functions/expiry-worker/index.ts`
    - Query `messages` where `expires_at IS NOT NULL AND expires_at < NOW()`
    - Delete matching rows inside a transaction
    - Log count of deleted messages and execution timestamp
    - On DB error: log error with timestamp and exit without partial deletion
    - _Requirements: 7.1, 7.2, 7.4, 7.5_
  - [x] 8.2 Configure cron schedule for expiry-worker
    - Add `supabase/functions/expiry-worker/config.toml` with `schedule = "0 * * * *"` (every 60 min)
    - _Requirements: 7.3_

- [x] 9. Checkpoint — Collab and Disappearing Messages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Admin Panel — Posts page enhancements
  - [ ] 10.1 Update `src/app/admin-b2ce13e04e810c06/posts/page.tsx`
    - Add `verification_status` filter buttons: `all`, `verified`, `unverified`, `pending`
    - Add full-text search input that filters by `title ilike` and `content ilike`
    - Display `content_hash` (truncated to 16 chars) and `hcs_sequence_num` in each post row
    - Fix "Verify" action: set `verified_at = now()`, insert audit log with `action = 'admin_verify_post'`
    - Fix "Delete" action: insert audit log with `action = 'admin_delete_post'`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [~] 11. Admin Panel — Reports page
  - [ ] 11.1 Update `src/app/admin-b2ce13e04e810c06/reports/page.tsx`
    - Query `reports` table (not `issue_reports`)
    - Display: reporter username, target (post link or user profile link), reason, details, severity, timestamp
    - Add filter tabs: `pending`, `resolved`, `all`
    - "Dismiss" button: update `status = 'resolved'`, `resolution = 'dismissed'`, insert audit log
    - "Action Taken" button: update `status = 'resolved'`, `resolution = 'taken_action'`, insert audit log
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [~] 12. Admin Panel — Audit log and Status broadcasts
  - [ ] 12.1 Update `src/app/admin-b2ce13e04e810c06/audit/page.tsx`
    - Add `ip_address` column to the audit log table display
    - Wire up total count display from query result
    - Ensure pagination (20 per page) and text search by `action` / `target_type` are functional
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [ ] 12.2 Update `src/app/admin-b2ce13e04e810c06/status/UpdatesClient.tsx`
    - Wire broadcast form to POST `/api/admin/broadcast-update` with CSRF token from `/api/admin/csrf`
    - Display success count or error message after submission
    - Handle missing `RESEND_API_KEY`: show descriptive error, do not crash
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ] 12.3 Update `src/app/api/admin/broadcast-update/route.ts`
    - Guard: return 500 `{ error: 'Email service not configured' }` if `RESEND_API_KEY` is not set
    - Query all users with non-null email, send via Resend, return success count
    - Insert audit log entry for the broadcast action
    - _Requirements: 11.3, 11.4, 11.5_

- [x] 13. Checkpoint — Admin Panel
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Bug Fix — OG Image
  - [x] 14.1 Add `public/og-image.png`
    - Create or place a 1200×630 PNG at `public/og-image.png`
    - _Requirements: 12.1_
  - [x] 14.2 Update `src/app/layout.tsx` metadata
    - Ensure `openGraph.images` and `twitter.images` reference `/og-image.png`
    - _Requirements: 12.2_

- [x] 15. Bug Fix — Message Reactions UI
  - [x] 15.1 Create `src/components/EmojiPicker.tsx`
    - Inline component with 6 hardcoded emoji options (👍 ❤️ 😂 😮 😢 🔥)
    - Triggered on hover (desktop) and long-press (mobile) over a message
    - Calls `onSelect(emoji: string)` callback
    - _Requirements: 13.1_
  - [x] 15.2 Create `src/components/ReactionDisplay.tsx`
    - Accept `reactions: { emoji: string; count: number; usernames: string[]; reactedByMe: boolean }[]`
    - Render grouped emoji + count badges below the message
    - Show tooltip with reactor usernames on hover
    - Clicking a reaction calls `onToggle(emoji)` for toggle behavior
    - _Requirements: 13.4, 13.6_
  - [x] 15.3 Integrate `EmojiPicker` and `ReactionDisplay` into the conversation page
    - In `src/app/messages/[conversationId]/page.tsx`: wrap each message bubble with hover state
    - On emoji select: call existing `toggleReaction` (or insert/delete `message_reactions` record)
    - Pass grouped reactions data to `<ReactionDisplay>`
    - Ensure Supabase realtime subscription updates reaction display in real time
    - _Requirements: 13.2, 13.3, 13.4, 13.5_
  - [ ]* 15.4 Write property test for reaction toggle idempotence
    - **Property 9: Reaction Toggle Idempotence**
    - **Validates: Requirements 13.3**
    - Test that toggling the same `(message_id, user_id, emoji)` twice results in no net change

- [x] 16. Bug Fix — Push Notifications VAPID wiring
  - [x] 16.1 Create `src/lib/push/subscribe.ts`
    - Read `NEXT_PUBLIC_VAPID_PUBLIC_KEY` from `process.env`
    - Register service worker, call `pushManager.subscribe`, POST subscription to `/api/webpush/subscribe`
    - _Requirements: 14.3, 14.4_
  - [x] 16.2 Create `src/app/api/webpush/subscribe/route.ts`
    - POST: authenticate user, upsert subscription into `push_subscriptions`
    - _Requirements: 14.4_
  - [x] 16.3 Update `src/app/api/webpush/route.ts`
    - Confirm VAPID guard returns 500 with `'VAPID keys not configured on server'` when keys are missing
    - On 410/404 response from push service, delete the stale `push_subscriptions` record
    - _Requirements: 14.1, 14.2, 14.5_
  - [x] 16.4 Update `public/sw.js` with push event handler
    - Add `self.addEventListener('push', ...)` that reads `{ title, body, url }` from payload and calls `self.registration.showNotification`
    - _Requirements: 14.6_
  - [ ]* 16.5 Write property test for push subscription stale cleanup
    - **Property 7: Push Subscription Stale Cleanup**
    - **Validates: Requirements 14.5**
    - Test that after a 410/404 response the subscription is removed and not retried

- [x] 17. Bug Fix — Placeholder pages
  - [x] 17.1 Rewrite `src/app/brand/page.tsx`
    - Display downloadable SVG logo assets, color palette with hex values, typography guidelines, usage do/don't rules
    - Remove any `force-dynamic` export; ensure static rendering
    - _Requirements: 15.1, 15.4_
  - [x] 17.2 Rewrite `src/app/privacy/page.tsx`
    - Complete privacy policy with sections: data collection, data usage, E2E encryption, on-chain data, data storage, user rights, third-party services, cookies, contact
    - Include "Last updated" date; remove `force-dynamic`
    - _Requirements: 15.2, 15.4, 15.5_
  - [x] 17.3 Rewrite `src/app/terms/page.tsx`
    - Complete terms with sections: acceptance, user accounts, content policy, IP, blockchain verification, messaging, disclaimers, liability, governing law
    - Include "Last updated" date; remove `force-dynamic`
    - _Requirements: 15.3, 15.4, 15.5_

- [x] 18. Bug Fix — Feed caching (ISR)
  - [x] 18.1 Update `src/app/feed/page.tsx`
    - Replace `export const dynamic = 'force-dynamic'` with `export const revalidate = 60`
    - Cache trending tags sidebar query with `revalidate = 300` (use `unstable_cache` or a separate cached function)
    - _Requirements: 16.1, 16.3, 16.4_
  - [x] 18.2 Add `revalidatePath('/feed')` to post creation API route
    - In the route that handles new post creation, call `revalidatePath('/feed')` after a successful insert
    - _Requirements: 16.2_

- [x] 19. Bug Fix — Image optimization
  - [x] 19.1 Update `next.config.ts`
    - Add `images.remotePatterns` for Supabase storage (`*.supabase.co`), GitHub avatars (`avatars.githubusercontent.com`), and Google avatars (`lh3.googleusercontent.com`)
    - Set `images.formats: ['image/avif', 'image/webp']`
    - Update CSP `img-src` to include the new domains
    - _Requirements: 17.1, 17.3, 17.4_
  - [x] 19.2 Replace `<img>` tags with `<Image>` in `PostCard`, `Navbar`, and `MessagesClient`
    - In `src/components/PostCard.tsx`: replace avatar `<img>` with `<Image width={40} height={40} sizes="40px">`
    - In `src/components/Navbar.tsx`: same treatment for user avatar
    - In `src/app/messages/MessagesClient.tsx`: same treatment for conversation avatars
    - _Requirements: 17.2_
  - [x] 19.3 Add initials fallback to avatar `<Image>` components
    - Add `onError` handler that sets a local state flag
    - When flag is set, render a `<div>` with the user's initials instead of the broken image
    - _Requirements: 17.5_

- [x] 20. Checkpoint — Bug Fixes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 21. Tests — Vitest setup and unit tests
  - [x] 21.1 Install Vitest and configure `vitest.config.ts`
    - Run `npm install -D vitest @vitest/ui @fast-check/vitest`
    - Create `vitest.config.ts` at project root with `environment: 'node'`, `include: ['src/**/*.test.ts']`
    - Add `"test": "vitest --run"` script to `package.json`
    - _Requirements: 18.5_
  - [x] 21.2 Create `src/lib/__tests__/crypto.test.ts`
    - Import `encryptMessage`, `decryptMessage` from `src/lib/crypto.ts`
    - Write property test using `@fast-check/vitest`: for all valid plaintext strings and key pairs, `decryptMessage(encryptMessage(plaintext, recipientPubKey, senderSecretKey), senderPubKey, recipientSecretKey)` equals original plaintext
    - Tag: `// Feature: argentum-refinements, Property 1: Encryption Round Trip`
    - _Requirements: 18.1_
  - [ ]* 21.3 Write property test for encryption round trip (PBT)
    - **Property 1: Encryption Round Trip**
    - **Validates: Requirements 18.1**
    - Use `fc.string()` as the plaintext generator; run 100 iterations
  - [x] 21.4 Create `src/lib/__tests__/hash.test.ts`
    - Import `hashContent` from `src/lib/utils/hash.ts`
    - Write property test: for all string inputs, `hashContent(s) === hashContent(s)`
    - Tag: `// Feature: argentum-refinements, Property 2: Hash Idempotence`
    - _Requirements: 18.2_
  - [ ]* 21.5 Write property test for hash idempotence (PBT)
    - **Property 2: Hash Idempotence**
    - **Validates: Requirements 18.2**
    - Use `fc.string()` as the input generator; run 100 iterations
  - [x] 21.6 Create `src/lib/__tests__/streak.test.ts`
    - Import `calculateStreak` from `src/lib/utils/streak.ts`
    - Write example-based tests: consecutive days streak, broken streak, empty history
    - _Requirements: 18.3_
  - [x] 21.7 Create `src/lib/__tests__/time.test.ts`
    - Import `formatRelativeTime` from `src/lib/utils/time.ts`
    - Write example-based tests: seconds ago, minutes ago, hours ago, days ago
    - Tag: `// Feature: argentum-refinements, Property 10: Message Formatting Completeness`
    - _Requirements: 18.4_

- [x] 22. Tests — Playwright E2E setup and tests
  - [x] 22.1 Install Playwright and create `playwright.config.ts`
    - Run `npm install -D @playwright/test` and `npx playwright install`
    - Create `playwright.config.ts` at project root: `baseURL: 'http://localhost:3000'`, reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from env
    - Add `"test:e2e": "playwright test"` script to `package.json`
    - _Requirements: 19.4, 19.5_
  - [x] 22.2 Create `e2e/auth.spec.ts`
    - Test: user logs in with email/password → redirected to `/feed`
    - _Requirements: 19.1_
  - [x] 22.3 Create `e2e/post.spec.ts`
    - Test: authenticated user creates a new build log post → post appears on `/feed`
    - _Requirements: 19.2_
  - [x] 22.4 Create `e2e/admin.spec.ts`
    - Test: non-admin user navigates to `/admin-{SEGMENT}` → receives 404 or redirect
    - _Requirements: 19.3_

- [x] 23. Error Handling — Global error boundaries
  - [x] 23.1 Create `src/app/error.tsx`
    - `'use client'` component accepting `{ error, reset }` props
    - Display Argentum logo, human-readable error message, "Try Again" button (calls `reset()`), link to `/feed`
    - In development: `console.error(error)` with full stack; in production: `console.error(JSON.stringify({ message: error.message, stack: error.stack, timestamp: new Date().toISOString() }))`
    - _Requirements: 20.1, 20.3, 20.4_
  - [x] 23.2 Create `src/app/global-error.tsx`
    - `'use client'` component; must include `<html>` and `<body>` tags
    - Same recovery UI as `error.tsx`
    - Same logging behavior
    - _Requirements: 20.2, 20.3, 20.4_

- [x] 24. Final checkpoint — Ensure all tests pass
  - Run `npx vitest --run` and verify all unit/property tests pass
  - Ensure all TypeScript types compile without errors
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (Properties 1–10 from design doc)
- Unit tests validate specific examples and edge cases
- The `@hashgraph/sdk` install in task 2.1 is a prerequisite for all blockchain tasks
- Vitest and Playwright installs in tasks 21.1 and 22.1 are prerequisites for all test tasks
- SQL migrations (task 1) must be applied to Supabase before running the app with collab or reports features
