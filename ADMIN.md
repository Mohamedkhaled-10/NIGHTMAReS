# NIGHTMAReS Admin Dashboard Technical Documentation

This document serves as the official, verified reference for the Admin Dashboard of the NIGHTMAReS project. It is based on a real, strict repository audit of the current codebase (`admin/js/app.js`, `admin/js/auth-guard.js`, `firestore.rules`, `firestore.indexes.json`, etc.). 

**IMPORTANT NOTE FOR NEW DEVELOPERS**: Do not assume any feature is fully implemented just because its UI exists. Always refer to this document for verified behaviors.

---

## 1. Repository Inventory

The following files are part of the Admin module:

| File | Purpose | Dependencies | Used By |
| --- | --- | --- | --- |
| `admin/index.html` | The main Admin layout, sidebar, views, and modals. | Tailwind CSS, DOMPurify, Font Awesome. | Admin Dashboard |
| `admin/js/app.js` | The monolithic main script handling UI switching, data fetching, creating/editing posts, and moderation. | `js/firebase-init.js`, `js/ui-utils.js`, Firebase SDK | `admin/index.html` |
| `admin/js/auth-guard.js` | Authentication and authorization gateway for the `/admin` route. | `js/firebase-init.js`, Firebase SDK | `admin/index.html` |
| `admin/admin.js` | A legacy Realtime Database script. | Realtime Database | Potentially unused, legacy |
| `admin/js/backfill.js` | Utility script for database backfilling (migration). | Firebase SDK | Ad-hoc maintenance |
| `admin/js/series.js` | Logic for series management (grouping stories). | Firebase SDK | `admin/index.html` |

**Global Shared Files:**
- `firestore.rules`: Defines all Admin bypasses and security perimeters.
- `firestore.indexes.json`: Contains all query indexes.
- `js/firebase-init.js`: Initialization of Firebase context.
- `js/ui-utils.js`: Shared toast/modal system.

---

## 2. Admin Architecture

The architecture is entirely Client-Side Rendered (CSR) built with vanilla JS and Firebase.

```text
Browser Requests /admin
↓
HTML loads with `body.hidden`
↓
auth-guard.js initializes
↓
Checks Firebase Auth state
↓
Checks users collection for `role === 'admin'`
↓
If true -> Removes `.hidden`, loads `app.js` views
If false / error -> Shows overlay, redirects to `/`
↓
Admin interacts directly with Firestore using Firebase SDK
```

- **Routing:** There is no real routing (no React Router, no SPA framework). Switching sections is done by adding/removing the `hidden` class on `div` views (e.g., `#view-overview`, `#view-posts`) using the `hideAllViews()` mechanism.
- **Lazy Loading:** Data is fetched lazily when a sidebar tab is clicked.
- **Failures:** Handled mostly via `showToast` or falling back to client-side aggregation (as seen in the Overview module).

---

## 3. Admin Entry & Auth Guard

### Entry Point
- **URL:** `/admin` or `/admin/index.html`.

### Authentication Flow
- **Guest:** Redirected immediately to `/login`.
- **User (role: 'user'):** Shown a "غير مصرح" (Unauthorized) overlay and redirected to `/` after 3 seconds.
- **Admin (role: 'admin'):** The loading overlay is removed, and the dashboard becomes visible.

### Auth Guard Details (`admin/js/auth-guard.js`)
- **Timeout Mechanism:** It implements a strict 5-second `Promise.race` timeout for the `getDoc` call. If Firestore doesn't respond (e.g., offline), it catches the timeout and displays an offline error UI with a "Retry" button.
- **Security:** 
  - **UI Protection:** `document.body.classList.add('hidden')` hides the dashboard physically before JS execution.
  - **Firestore Rules:** The `isAdmin()` function in rules strictly requires the `role` field in the user's document to be `'admin'`.

---

## 4. Admin Layout & UI Design

### Visual Identity
- **Layout:** Standard two-column dashboard (Left Sidebar, Main Content Area).
- **Colors:** Dark sidebar (`bg-gray-900`) with red accents (`text-red-600`, `border-red-900/30`), maintaining the brand identity. The main area is light gray (`bg-gray-100`) for readability.
- **Typography:** Uses 'Tajawal' font.
- **Modals/Toasts:** Utilizes the global `showConfirmModal`, `showPromptModal`, and `showToast` from `js/ui-utils.js`.

### States
- **Loading:** Usually injects a table row or div containing `<i class="fas fa-spinner fa-spin"></i> جاري التحميل...`.
- **Empty:** Injects a "لا يوجد بيانات" message.

---

## 5. Dashboard Sections

Verified sections existing and working in the code:
- **Overview:** System analytics and charts.
- **Users:** User directory.
- **Comments:** Global comments moderation.
- **Content (Posts):** Create, edit, and list posts (Stories, News, Videos).
- **Submissions:** Review user-submitted stories.
- **Reports:** Moderation of user reports.
- **Audit Logs:** Immutable system logs.
- **Ads:** Ad template management.
- **Notifications:** Global announcement broadcasting.
- **Series:** (via `series.js`) Managing multi-part stories.

---

## 6. Overview / Dashboard Analytics

The system calculates metrics based on a dynamic time filter.

| Metric | Source Collection | Query Type | Aggregation / Display |
| --- | --- | --- | --- |
| **Users** | `users` | `getCountFromServer` | Total count. |
| **Pending Submissions** | `user_submissions` | `getCountFromServer` | Filter: `status == 'submitted'`. |
| **Comments** | `comments` | `getCountFromServer` | Total count. |
| **Reports** | `reports` | `getCountFromServer` | Total count. |
| **Published Posts** | `posts` | `getCountFromServer` | Filter: `status == 'published'`. |
| **Views & Likes** | `posts` | `getAggregateFromServer` | Uses `sum('views')` and `sum('likesCount')`. *Fallback*: If index is missing, it fetches all docs and sums locally in memory. |
| **Content Distribution** | `posts` | `getCountFromServer` | Runs 3 concurrent queries for `type == 'story'`, `'news'`, and `'video'`. Updates a progress bar visually. |

---

## 7. Analytics Time Filters

Available filters:
- **Today**: Midnight of the current day.
- **Last 7 Days**: Current date minus 7 days.
- **Last 30 Days**: Current date minus 30 days.
- **All Time**: No date filter applied.

**Mechanics:** Uses the `createdAt` Timestamp field in Firestore. Queries append `where("createdAt", ">=", startDate)` and `orderBy("createdAt", dir)` when a filter is active. 
**Timezone:** Client's local browser timezone (using `new Date()`).

---

## 8. Content Management / Posts

The `post-form` is used to Create and Edit content.

| Field | Type | Validation / Behavior |
| --- | --- | --- |
| `id` | String | Auto-generated (`'doc_' + Date.now()`) on create, preserved on edit. |
| `title` | String | Required. |
| `slug` | String | Required, aggressively normalized, unique. |
| `type` | String | Select: `story`, `news`, `video`. Default: `story`. |
| `status` | String | Select: `published`, `draft`. |
| `category` | String | Optional. |
| `tags` | Array | UI chip input. Saved as an array of strings. |
| `contentHtml` | HTML | Sanitized via DOMPurify before saving. |
| `embedCode` | HTML | Sanitized via DOMPurify allowing only `iframe` tags. |
| `isFeatured` | Boolean | Checkbox for featuring on the homepage. |

---

## 9. Post Types & Statuses

### Post Types
- **story**: Standard written stories.
- **news**: News articles.
- **video**: Embedded video content (relies on `embedCode`).

### Post Statuses
- **published**: Visible to users (enforced by `firestore.rules`).
- **draft**: Hidden from public, visible only to Admins.
*(Note: There is no `scheduled` status).*

---

## 10. Slug System

**Normalization Logic:**
1. Trims whitespace.
2. Lowercases.
3. Replaces spaces and underscores with hyphens (`-`).
4. Removes invalid characters using `[^\w\u0600-\u06FF-]` (preserves Arabic characters, alphanumeric, and hyphens).
5. Removes duplicate and trailing/leading hyphens.

**Uniqueness Check:** Before saving, it queries `posts` where `slug == normalizedSlug`. If a document exists and its `id` does not match the current post being edited, it aborts saving and shows an error.

---

## 11. Rich Text / HTML Security

**Sanitization Engine:** DOMPurify.
- **contentHtml:** Sanitized before saving using `{ USE_PROFILES: { html: true } }`.
- **embedCode:** Sanitized to safely allow only `iframe` elements with specific attributes (`allow`, `allowfullscreen`, `frameborder`, `scrolling`).
- **Rendering:** Safely inserted into the DOM.

---

## 12. User Submissions Workflow

When a user submits a story, it goes to `user_submissions`.

**Workflow:**
1. Admin opens submission.
2. Clicks **Approve**.
3. **Double Click Protection:** `btn.disabled = true`.
4. **Transaction Starts:**
   - Verifies it is not already approved (`subData.status === 'approved' || subData.publishedPostId`). If it is, throws `ALREADY_APPROVED`.
   - Creates a new published `post` document.
   - Slug generation: `currentSubmission.title.trim().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 1000)` (Ensures absolute uniqueness dynamically).
   - Word count and `readTimeMinutes` are calculated on the server-side logic (using DOMPurify text extraction).
   - Generates a global `notification` for the original author.
   - Updates the submission `status` to `approved` and attaches the `publishedPostId`.
   - Creates an `audit_log`.

**Rejection / Request Edit:**
Updates the status to `rejected` or `needs_edit` and sends a corresponding notification.

---

## 13. User Management

- **Listing:** Paginated list of users from the `users` collection.
- **Ban/Unban Bug (NOT VERIFIED IN LOGIC):** The HTML injects an `onclick="banUser(id)"` button. However, **the `banUser` and `unbanUser` functions DO NOT EXIST in `app.js`**. There is a defined function `window.changeUserStatus` that is intended for this purpose but is never called by the UI. 
- **Roles:** The UI displays if a user is `Admin` or `User`. There is a `window.changeUserRole` function defined, but it doesn't appear to be wired to the main UI properly.

---

## 14. Comments Moderation

- **Listing:** Fetches from `comments` collection globally.
- **Actions:** Admins can change status between `visible` and `deleted` using the `moderateComment` function. This updates the `status` field.
- **Rules Restriction:** Standard users cannot change a comment status to anything other than `deleted` if they own it.

---

## 15. Reports Management

- **Listing:** Filters reports by `pending`, `reviewing`, `resolved`, `rejected`.
- **Workflow:** 
  - Admin changes status to `reviewing` (UpdateReportStatus).
  - Admin uses `resolveReport` which opens a prompt modal to take action based on the target type (`hide`, `remove`, `suspend`, `review`).

---

## 16. Audit Logs

- **Collection:** `audit_logs`
- **Fields:** `action`, `targetType`, `targetId`, `adminUid`, `timestamp`.
- **Immutability:** Guaranteed by Firestore Rules (`allow update, delete: if false;`). Only Admins can create and read.

---

## 17. Global Notifications

- Admins can broadcast notifications using the form `#notif-form`.
- It writes a document to the `notifications` collection with `userId: 'all'`.
- The rule `allow create: if isAuthenticated() && (isAdmin() || request.resource.data.userId != 'all')` strictly ensures only Admins can create a global notification.

---

## 18. Firestore Collections & Admin Usage

| Collection | Purpose | Read | Create | Update | Delete | Admin Only? |
| --- | --- | --- | --- | --- | --- | --- |
| `posts` | Main content storage. | All | Admin | Admin* | Admin | No (Read) |
| `user_submissions` | Drafts submitted by users. | Admin/Owner | User | Admin/Owner | Admin | No |
| `users` | User profiles and roles. | All | Owner | Owner/Admin | Admin | No (Read) |
| `comments` | User comments. | All | ActiveUser | Owner/Admin | Admin/Owner| No |
| `reports` | Moderation reports. | Admin | ActiveUser | Admin | Admin | Yes (Read) |
| `notifications` | System and user notifications.| Owner/All | Admin/System| Owner | Owner | No |
| `audit_logs` | Immutable system logs. | Admin | Admin | NONE | NONE | Yes |
| `ads_templates` | Display Ads. | All | Admin | Admin | Admin | No (Read) |
| `series` | Grouped content. | All | Admin | Admin | Admin | No (Read) |

*\*Note: Posts allow atomic increment updates for views/likes from standard users.*

---

## 19. Pagination Mechanism

Admin tables utilize cursor-based pagination.
- **Implementation:** `limit(50)` and `startAfter(lastDoc_Module)`.
- **State:** Variables like `lastDoc_Users`, `lastDoc_Posts` store the last document snapshot.
- **Reset:** When a tab is switched or filters change, `isLoadMore` is false, and the `lastDoc_*` variable is set to `null` to reset the cursor.

---

## 20. Existing Required Indexes

Based on `firestore.indexes.json` and `app.js` queries, the Admin dashboard relies heavily on compound indexes. 
For example:
- `user_submissions`: `status` ASC, `createdAt` ASC
- `reports`: `status` ASC, `createdAt` DESC
- `posts`: `status` ASC, `type` ASC, `createdAt` DESC (and combinations for views)

If an index is missing for the Overview `getAggregateFromServer` logic, it safely falls back to a massive client-side read, which could be costly but prevents crashing.

---

## 21. Current Technical Debt & Bugs

| Severity | Area | Problem | Impact | Recommended Action |
| --- | --- | --- | --- | --- |
| **High** | Users UI | `banUser()` and `unbanUser()` functions are missing from `app.js`, but referenced in the HTML `onclick`. | Admins cannot ban users from the UI. | Wire the buttons to use the existing `window.changeUserStatus` function. |
| **High** | Users UI | The search bar `<input id="search-users">` exists in HTML but has no JS implementation. | Cannot search users. | Implement client-side filtering or Firestore indexing for search. |
| **Medium** | Architecture | Massive monolithic `app.js` (1700+ lines). | Hard to maintain. | Break into modules (e.g., `admin-users.js`, `admin-posts.js`). |
| **Medium** | Overview | Fallback client-side aggregation for posts if index missing. | Expensive Firestore reads (N documents). | Ensure `firestore.indexes.json` is perfectly synced. |

---

## 22. Safe Modification Rules for Developers

1. **Do not broaden Firestore Rules:** The `isAdmin()` function is your only shield. Do not bypass it for "testing".
2. **Respect Idempotency:** The User Submission approval runs in a transaction. Do not alter this logic, or double-clicks could publish two identical posts.
3. **Do not remove DOMPurify:** User submissions and post bodies must be sanitized before rendering. 
4. **HTML Strings:** When editing the HTML injection strings in `app.js`, ensure you don't introduce XSS vulnerabilities by directly injecting user-provided fields (like display names) without sanitization.

---

## 23. Production Status

**PRODUCTION READY WITH WARNINGS**

The Admin Dashboard is highly functional, secure (backed strictly by Firestore Rules), and handles data safely using Transactions and DOMPurify. However, UI bugs related to User Management (banning and searching) require immediate fixing before the Admin experience is completely flawless. The monolithic nature of `app.js` is also a long-term maintenance concern.
