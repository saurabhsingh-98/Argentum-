# Requirements Document

## Introduction

Argentum is a "Twitter for Devs" social platform built with Next.js 16, Supabase, and TweetNaCl. This document covers the comprehensive refinement of the platform, including completing missing/incomplete features and fixing known bugs. The work spans five feature areas (Blockchain/Proof of Build, Collab, Disappearing Messages, Admin Panel, Tests & Error Handling) and six bug fixes (OG image, message reactions UI, push notification VAPID wiring, placeholder pages, feed caching, image optimization).

---

## Glossary

- **System**: The Argentum Next.js application as a whole.
- **HCS**: Hedera Consensus Service — a public ledger for ordering and timestamping messages.
- **HCS_Client**: The server-side module that submits messages to the Hedera Consensus Service.
- **NFT_Minter**: The server-side module responsible for minting NFTs on the Hedera Token Service.
- **Verification_UI**: The client-side component that displays on-chain proof data for a post.
- **Collab_Hub**: The `/collab` page and associated UI for browsing and applying to collaboration posts.
- **Collab_Request**: A record in the `collab_requests` table representing a user's intent to collaborate on a post.
- **DM_Client**: The client-side chat component at `/messages/[conversationId]`.
- **Expiry_Worker**: The server-side Supabase Edge Function or cron job that deletes expired messages.
- **Admin_Panel**: The protected admin interface at `/admin-{SEGMENT}`.
- **Report**: A user-submitted content violation record in the `reports` table.
- **Audit_Log**: An immutable record in the `admin_audit_log` table.
- **Push_Service**: The web push notification system using VAPID keys and the `web-push` library.
- **Feed_Cache**: The Next.js caching layer applied to feed data fetching.
- **OG_Image**: The Open Graph preview image served at `/og-image.png`.
- **Message_Reaction**: An emoji reaction on a DM, stored in the `message_reactions` table.
- **Error_Boundary**: A React component that catches rendering errors and displays a fallback UI.
- **CDN**: Content Delivery Network used for serving optimized user-uploaded images.

---

## Requirements

### Requirement 1: Blockchain / Proof of Build — HCS Submission

**User Story:** As a builder, I want my published build log to be anchored on the Hedera Consensus Service, so that I have a tamper-proof, publicly verifiable timestamp of my work.

#### Acceptance Criteria

1. WHEN a post is created with `status = 'published'`, THE HCS_Client SHALL submit a message containing the post's `content_hash`, `post_id`, and `user_id` to the configured HCS topic.
2. WHEN the HCS submission succeeds, THE System SHALL update the post record with the returned `hcs_sequence_num` and set `verification_status` to `'pending'`.
3. IF the HCS submission fails due to a network error, THEN THE System SHALL retry the submission up to 3 times with exponential backoff before marking `verification_status` as `'unverified'` and logging the error.
4. THE HCS_Client SHALL read the Hedera operator account ID and private key from environment variables `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY`.
5. THE HCS_Client SHALL read the target HCS topic ID from the environment variable `HEDERA_TOPIC_ID`.
6. WHEN `hcs_sequence_num` is set on a post, THE System SHALL set `verification_status` to `'verified'` and record `verified_at` as the current timestamp.

---

### Requirement 2: Blockchain / Proof of Build — NFT Minting

**User Story:** As a builder, I want a verified build log to be represented as an NFT on Hedera, so that I have a transferable, on-chain certificate of ownership.

#### Acceptance Criteria

1. WHEN a post's `verification_status` transitions to `'verified'`, THE NFT_Minter SHALL mint a non-fungible token on the Hedera Token Service using the post's `content_hash` as the token metadata.
2. WHEN the NFT is minted successfully, THE System SHALL update the post record with the returned `nft_token_id`.
3. IF the NFT minting fails, THEN THE System SHALL log the error and leave `nft_token_id` as `null` without reverting the `verification_status`.
4. THE NFT_Minter SHALL associate the minted NFT with the post author's `hbar_wallet` address stored in the `users` table.
5. WHERE a user has not set an `hbar_wallet`, THE NFT_Minter SHALL mint the token to the platform's treasury account and record the token ID for later transfer.

---

### Requirement 3: Blockchain / Proof of Build — Verification UI

**User Story:** As a visitor, I want to see on-chain proof details on a post page, so that I can independently verify the authenticity of a build log.

#### Acceptance Criteria

1. WHEN a post has `verification_status = 'verified'`, THE Verification_UI SHALL display the `hcs_sequence_num`, `nft_token_id`, `content_hash`, and `verified_at` timestamp.
2. THE Verification_UI SHALL provide a link to the Hedera explorer URL for the HCS topic message using the format `https://hashscan.io/mainnet/topic/{topicId}?sequenceNumber={seqNum}`.
3. WHEN a post has `nft_token_id` set, THE Verification_UI SHALL provide a link to the NFT on the Hedera explorer using the format `https://hashscan.io/mainnet/token/{nftTokenId}`.
4. WHEN a post has `verification_status = 'unverified'` or `'pending'`, THE Verification_UI SHALL display the current status with a human-readable explanation.
5. THE Verification_UI SHALL display the `content_hash` truncated to 16 characters with a copy-to-clipboard button for the full hash.

---

### Requirement 4: Collab Feature — Application Flow

**User Story:** As a builder, I want to apply to collaborate on a post marked as open for collaboration, so that I can connect with the post author and contribute to their project.

#### Acceptance Criteria

1. WHEN a user views a post with `is_collab = true`, THE Collab_Hub SHALL display an "Apply to Collaborate" button visible to authenticated users who are not the post author.
2. WHEN a user submits a collaboration application, THE System SHALL insert a record into the `collab_requests` table with `post_id`, `applicant_id`, `message`, and `status = 'pending'`.
3. IF a user has already submitted a `collab_request` for a post, THEN THE System SHALL display "Application Pending" instead of the apply button and SHALL NOT allow a duplicate submission.
4. WHEN a collaboration application is submitted, THE System SHALL create a notification for the post author with `type = 'collab_request'`.
5. THE Collab_Hub SHALL display the count of pending collaboration requests on each post card.

---

### Requirement 5: Collab Feature — Author Management

**User Story:** As a post author, I want to review and accept or decline collaboration requests on my posts, so that I can control who joins my project.

#### Acceptance Criteria

1. WHEN a post author views their own collab post, THE System SHALL display a list of pending `collab_requests` with each applicant's username, avatar, and application message.
2. WHEN an author accepts a collaboration request, THE System SHALL update the `collab_request` record's `status` to `'accepted'` and create a notification for the applicant.
3. WHEN an author declines a collaboration request, THE System SHALL update the `collab_request` record's `status` to `'declined'` and create a notification for the applicant.
4. THE System SHALL allow the post author to initiate a direct message conversation with an accepted collaborator from the collab request UI.

---

### Requirement 6: Disappearing Messages — UI Controls

**User Story:** As a user, I want to configure a disappearing message timer for a conversation, so that messages automatically expire after a chosen duration.

#### Acceptance Criteria

1. WHEN a user opens a conversation, THE DM_Client SHALL display the current `disappearing_messages` setting (`off`, `24h`, `7d`) in the conversation settings panel.
2. WHEN a user changes the disappearing messages setting, THE System SHALL update the `conversations.disappearing_messages` field and display a system message in the chat indicating the change and who made it.
3. WHEN `disappearing_messages` is not `'off'`, THE DM_Client SHALL display a countdown timer or expiry indicator on each message that has an `expires_at` value.
4. WHEN a message's `expires_at` timestamp is reached on the client, THE DM_Client SHALL visually mark the message as expired and hide its content, replacing it with "This message has expired."
5. THE DM_Client SHALL display the active disappearing messages setting as a persistent badge in the conversation header.

---

### Requirement 7: Disappearing Messages — Server-Side Cleanup

**User Story:** As a platform operator, I want expired messages to be permanently deleted from the database, so that the disappearing messages feature provides genuine privacy guarantees.

#### Acceptance Criteria

1. THE Expiry_Worker SHALL query the `messages` table for all records where `expires_at` is not null and `expires_at < NOW()`.
2. WHEN expired messages are found, THE Expiry_Worker SHALL permanently delete those records from the `messages` table.
3. THE Expiry_Worker SHALL run on a schedule no less frequent than every 60 minutes.
4. THE Expiry_Worker SHALL log the count of deleted messages and the execution timestamp on each run.
5. IF the Expiry_Worker encounters a database error, THEN THE Expiry_Worker SHALL log the error and exit without partial deletion.

---

### Requirement 8: Admin Panel — Content Moderation (Posts)

**User Story:** As an admin, I want to search, filter, and take moderation actions on posts, so that I can maintain content quality on the platform.

#### Acceptance Criteria

1. THE Admin_Panel posts page SHALL support filtering posts by `verification_status` (`all`, `verified`, `unverified`, `pending`) in addition to the existing `category` filter.
2. WHEN an admin clicks "Verify" on a post, THE System SHALL update `verification_status` to `'verified'`, set `verified_at`, and insert an `Audit_Log` record with `action = 'admin_verify_post'`.
3. WHEN an admin clicks "Delete" on a post and confirms, THE System SHALL delete the post record and insert an `Audit_Log` record with `action = 'admin_delete_post'`.
4. THE Admin_Panel posts page SHALL display the post's `content_hash` (truncated) and `hcs_sequence_num` when available.
5. THE Admin_Panel posts page SHALL support full-text search across post `title` and `content` fields.

---

### Requirement 9: Admin Panel — Reports Queue

**User Story:** As an admin, I want to review user-submitted reports and take action, so that I can enforce community guidelines.

#### Acceptance Criteria

1. THE Admin_Panel reports page SHALL display each report with: reporter username, target (user or post), reason, details, severity, and submission timestamp.
2. WHEN an admin resolves a report as "Dismissed", THE System SHALL update `reports.status` to `'resolved'`, set `resolution = 'dismissed'`, and insert an `Audit_Log` record.
3. WHEN an admin resolves a report as "Action Taken", THE System SHALL update `reports.status` to `'resolved'`, set `resolution = 'taken_action'`, and insert an `Audit_Log` record.
4. THE Admin_Panel reports page SHALL support filtering by status (`pending`, `resolved`, `all`).
5. WHEN a report targets a post, THE Admin_Panel SHALL provide a direct link to view the post in a new tab.
6. WHEN a report targets a user, THE Admin_Panel SHALL provide a direct link to view the user's profile in a new tab.

---

### Requirement 10: Admin Panel — Audit Log

**User Story:** As an admin, I want to view a paginated, searchable audit log of all administrative actions, so that I can maintain accountability and trace changes.

#### Acceptance Criteria

1. THE Admin_Panel audit page SHALL display each log entry with: timestamp, admin username, action type, target type, target ID, and IP address.
2. THE Admin_Panel audit page SHALL support text search filtering by `action` and `target_type` fields.
3. THE Admin_Panel audit page SHALL paginate results at 20 entries per page with previous/next controls.
4. THE Admin_Panel audit page SHALL display the total count of matching records.
5. WHEN an admin action is performed anywhere in the Admin_Panel, THE System SHALL insert an `Audit_Log` record including the admin's `user_id`, `action`, `target_type`, `target_id`, and the request IP address.

---

### Requirement 11: Admin Panel — Status Updates

**User Story:** As an admin, I want to broadcast platform status updates to all users via email, so that I can communicate maintenance windows and announcements.

#### Acceptance Criteria

1. THE Admin_Panel status page SHALL provide a form with `subject` and `content` fields for composing a broadcast email.
2. WHEN an admin submits the broadcast form, THE System SHALL call the `/api/admin/broadcast-update` endpoint with a valid CSRF token.
3. WHEN the broadcast API receives a valid request from an authenticated admin, THE System SHALL send the email to all users with a non-null email address via the Resend service.
4. THE Admin_Panel status page SHALL display the result of the broadcast (success count or error message) after submission.
5. IF the `RESEND_API_KEY` environment variable is not set, THEN THE System SHALL return a descriptive error to the admin UI without crashing.

---

### Requirement 12: Bug Fix — OG Image

**User Story:** As a platform operator, I want the Open Graph image to exist and be served correctly, so that link previews on social media display properly.

#### Acceptance Criteria

1. THE System SHALL serve a valid PNG image at the path `/og-image.png` with dimensions of 1200×630 pixels.
2. THE System SHALL reference `/og-image.png` in the `openGraph.images` and `twitter.images` metadata fields in `src/app/layout.tsx`.
3. WHEN a social media crawler fetches the Argentum URL, THE System SHALL return the OG image with a `Content-Type` of `image/png`.

---

### Requirement 13: Bug Fix — Message Reactions UI

**User Story:** As a user, I want to add and view emoji reactions on direct messages, so that I can respond expressively without sending a full message.

#### Acceptance Criteria

1. WHEN a user hovers over or long-presses a message in the DM_Client, THE System SHALL display an emoji picker with at least 6 common emoji options.
2. WHEN a user selects an emoji reaction, THE System SHALL insert a record into `message_reactions` with `message_id`, `user_id`, and `emoji`.
3. WHEN a user selects an emoji they have already reacted with, THE System SHALL delete the existing `message_reactions` record (toggle behavior).
4. THE DM_Client SHALL display grouped reaction counts below each message, showing the emoji and the count of users who reacted with it.
5. WHEN a `message_reactions` record is inserted or deleted, THE DM_Client SHALL update the reaction display in real time via the existing Supabase realtime subscription.
6. THE DM_Client SHALL display a tooltip showing the usernames of reactors when a user hovers over a reaction group.

---

### Requirement 14: Bug Fix — Push Notifications VAPID Wiring

**User Story:** As a user, I want to receive web push notifications for new messages and interactions, so that I stay informed even when the app is not in focus.

#### Acceptance Criteria

1. THE System SHALL read `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from environment variables and configure the `web-push` library in the `/api/webpush` route handler.
2. WHEN `NEXT_PUBLIC_VAPID_PUBLIC_KEY` or `VAPID_PRIVATE_KEY` is not set, THE System SHALL return a `500` response with the message `'VAPID keys not configured on server'` and SHALL NOT attempt to send notifications.
3. THE System SHALL expose the `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the client-side service worker registration code so the browser can subscribe to push notifications.
4. WHEN a user grants notification permission, THE System SHALL register a push subscription and store it in the `push_subscriptions` table with the user's `user_id`.
5. WHEN a push subscription returns a `410` or `404` status code during a send attempt, THE System SHALL delete the stale subscription record from `push_subscriptions`.
6. THE `public/sw.js` service worker SHALL handle `push` events and display a notification using the `title`, `body`, and `url` fields from the push payload.

---

### Requirement 15: Bug Fix — Placeholder Pages (/brand, /privacy, /terms)

**User Story:** As a visitor, I want the brand, privacy, and terms pages to contain complete, accurate content, so that I can understand Argentum's identity and legal policies.

#### Acceptance Criteria

1. THE `/brand` page SHALL display downloadable SVG logo assets, the official color palette with hex values, typography guidelines, and usage do/don't rules.
2. THE `/privacy` page SHALL contain a complete privacy policy with sections covering: data collection, data usage, E2E encryption, on-chain data, data storage, user rights, third-party services, cookies, and contact information.
3. THE `/terms` page SHALL contain complete terms and conditions with sections covering: acceptance, user accounts, content policy, intellectual property, blockchain verification, messaging, disclaimers, liability, and governing law.
4. THE `/brand`, `/privacy`, and `/terms` pages SHALL be statically renderable (no `force-dynamic`) to enable CDN caching.
5. THE `/privacy` and `/terms` pages SHALL display a "Last updated" date that reflects the actual content revision date.

---

### Requirement 16: Bug Fix — Feed Caching Strategy

**User Story:** As a user, I want the feed to load quickly on repeat visits, so that I have a responsive browsing experience.

#### Acceptance Criteria

1. THE Feed_Cache SHALL use Next.js `unstable_cache` or route segment `revalidate` to cache the initial feed query result for a maximum of 60 seconds.
2. WHEN a new post is published, THE System SHALL call `revalidatePath('/feed')` to invalidate the feed cache so the new post appears within 60 seconds.
3. THE feed page SHALL use `export const revalidate = 60` instead of `export const dynamic = 'force-dynamic'` to enable ISR (Incremental Static Regeneration).
4. THE System SHALL cache the trending tags sidebar query with a `revalidate` of 300 seconds (5 minutes).
5. WHEN the feed cache is cold (first request after invalidation), THE System SHALL serve the page within 3 seconds under normal load conditions.

---

### Requirement 17: Bug Fix — Image Optimization and CDN

**User Story:** As a user, I want profile avatars and post images to load quickly and at the correct resolution, so that the app feels fast and polished.

#### Acceptance Criteria

1. THE System SHALL configure `next.config.ts` with an `images.remotePatterns` entry for the Supabase storage domain to enable Next.js image optimization.
2. THE System SHALL replace `<img>` tags for user avatars in `PostCard`, `Navbar`, and `MessagesClient` with Next.js `<Image>` components using appropriate `width`, `height`, and `sizes` props.
3. WHERE a user avatar URL is from an external OAuth provider (GitHub, Google), THE System SHALL include those domains in `next.config.ts` `images.remotePatterns`.
4. THE System SHALL configure `images.formats` in `next.config.ts` to include `['image/avif', 'image/webp']` for modern format delivery.
5. WHEN an avatar image fails to load, THE System SHALL display the user's initials as a fallback without a broken image icon.

---

### Requirement 18: Tests — Unit Tests

**User Story:** As a developer, I want unit tests for critical utility functions, so that I can refactor with confidence and catch regressions early.

#### Acceptance Criteria

1. THE System SHALL have unit tests for the `encryptMessage` and `decryptMessage` functions in `src/lib/crypto.ts` that verify the round-trip property: FOR ALL valid plaintext strings, `decryptMessage(encryptMessage(plaintext, recipientPublicKey, senderSecretKey), senderPublicKey, recipientSecretKey)` SHALL equal the original plaintext.
2. THE System SHALL have unit tests for the `hashContent` function in `src/lib/utils/hash.ts` that verify the idempotence property: calling `hashContent` twice with the same input SHALL produce the same output.
3. THE System SHALL have unit tests for the `calculateStreak` function in `src/lib/utils/streak.ts` covering: a streak of consecutive days, a broken streak, and an empty history.
4. THE System SHALL have unit tests for the `formatRelativeTime` function in `src/lib/utils/time.ts` covering: seconds ago, minutes ago, hours ago, and days ago.
5. THE System SHALL use Vitest as the test runner with a configuration file at `vitest.config.ts`.

---

### Requirement 19: Tests — End-to-End Tests

**User Story:** As a developer, I want E2E tests for critical user flows, so that I can verify the application works correctly from the user's perspective before deploying.

#### Acceptance Criteria

1. THE System SHALL have an E2E test that verifies a user can log in via email/password and be redirected to `/feed`.
2. THE System SHALL have an E2E test that verifies an authenticated user can create a new build log post and see it appear on the feed.
3. THE System SHALL have an E2E test that verifies the admin panel is inaccessible to non-admin users (returns 404 or redirect).
4. THE System SHALL use Playwright as the E2E test framework with a configuration file at `playwright.config.ts`.
5. THE System SHALL have E2E tests that run against a local development server using the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables.

---

### Requirement 20: Error Handling — Global Error Boundaries

**User Story:** As a user, I want to see a friendly error message instead of a blank screen when something goes wrong, so that I understand the issue and can take action.

#### Acceptance Criteria

1. THE System SHALL implement a Next.js `error.tsx` file at `src/app/error.tsx` that catches unhandled errors in the root layout and displays a recovery UI with a "Try Again" button.
2. THE System SHALL implement a Next.js `global-error.tsx` file at `src/app/global-error.tsx` that catches errors in the root layout itself.
3. WHEN an error is caught by an Error_Boundary, THE System SHALL log the error details (message, stack, component tree) to the console in development and to a structured log in production.
4. THE Error_Boundary recovery UI SHALL display the Argentum logo, a human-readable error message, and a button to reload the page or navigate to `/feed`.
5. WHILE the application is in maintenance mode, THE System SHALL display the maintenance page instead of the error boundary for all non-admin users.
