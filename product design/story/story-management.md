## 1. Overview
This document defines the story management experience for MyHaven based on the three story mockups in `product design/story`:

* `write.html` for story creation
* `story.html` for story reading
* `pofile.html` for the personal "My Stories" area

The goal is to turn those screen concepts into implementation-ready product requirements for the full story lifecycle: create, scan, publish, read, react, review ownership, edit, and delete.

This document should be read together with `product design/authentication.md`. Authentication defines who can access the platform and which session types exist. This document defines what those session types can do with stories.

## 2. Product Goals
The story management experience must support the following outcomes:

* Let users share sensitive stories in a calm, low-friction writing flow.
* Preserve public anonymity even when the author uses a registered account behind the scenes.
* Reduce accidental identity exposure through an AI-assisted anonymity review before publishing.
* Give readers a lightweight, supportive interaction model through "Send a Hug".
* Give registered users a private area to review and manage their own published stories over time.

## 3. Core Principles
The story system must follow these principles throughout the product:

* **Anonymous by default in public:** Public story surfaces must never expose a registered user's username or email address.
* **Ownership without public identity:** The backend may know who owns a story, but the community-facing UI should present the author as anonymous unless a future product decision explicitly changes that rule.
* **Safety before speed:** Publishing must include policy acceptance and anonymity screening before a story becomes visible.
* **Gentle interaction model:** Community response should feel supportive rather than performative. "Hugs" are the primary visible engagement mechanic in the current story mockups.
* **Clear session boundaries:** Registered users can recover and manage prior stories. Anonymous users can publish during a guest session but cannot rely on cross-session recovery.

## 4. User Types and Story Permissions
A summary of story-related capabilities by session type:

| Capability | Registered User | Anonymous Guest Session |
| :--- | :--- | :--- |
| Read published stories | Yes | Yes |
| Write a new story | Yes, after active policy acceptance | Yes, after active policy acceptance for that guest session |
| Run AI anonymity check | Yes | Yes |
| Publish a story | Yes | Yes |
| Publicly display real account identity | No | No |
| Send a Hug to another story | Yes | Yes |
| Access persistent "My Stories" dashboard | Yes | No |
| Edit or delete previously published stories | Yes, own stories only | No |
| Recover stories from a previous session | Yes | No |
| View persistent engagement totals for owned stories | Yes | No |

## 5. Story Lifecycle
The story lifecycle for Phase 1 should support these states:

1. Drafting: The user is composing text in the editor.
2. Ready for check: The draft meets minimum client-side requirements and can be scanned.
3. Privacy review complete: The AI anonymity check returns a result that allows the user to continue or requires changes.
4. Published: The story is visible in the reading experience and, if the author is registered, in "My Stories".
5. Updated: A registered owner edits a previously published story and republishes the revised version.
6. Deleted or hidden: The story is no longer visible to normal readers because the owner deleted it or the platform moderated it.

**Acceptance Criteria:**
* A story must not become publicly visible until policy acceptance and anonymity review requirements are satisfied.
* Registered-user stories must remain recoverable through account ownership.
* Guest-session stories may be attributed to the active guest session for immediate platform operations, but they must not become recoverable in future guest sessions.
* Deletion must remove the story from normal reader surfaces while preserving enough backend history for moderation and audit needs.

## 6. Story Creation Flow
**User Story:** As a user, I want a calm writing screen that helps me safely publish a story without accidentally revealing my identity.

**Acceptance Criteria:**
* **Entry Point:** The app must provide a clear compose entry point, including the floating action button pattern shown in `pofile.html`.
* **Header Controls:** The creation screen must include:
  * `Cancel`, which exits without publishing
  * `New Story` title text
  * `Publish`, which stays disabled until the draft is valid and required pre-publish checks are complete
* **Writing Area:** The main interaction must be a large text input area optimized for long-form reflection rather than short posts.
* **Character Limit:** The editor must enforce a maximum length of 1,500 characters and show a live character counter.
* **Validation Feedback:** The UI must clearly show when the story is too short, too long, empty, or otherwise ineligible for publishing.
* **Policy Dependency:** Users must not be able to publish unless the active session has accepted the current policy version described in `authentication.md`.
* **Publish State:** The publish action must have explicit loading, success, and failure states so users understand whether the story was submitted.
* **Unsaved Exit Protection:** If the user taps `Cancel` with non-empty content, the app should confirm before discarding the draft.
* **Draft Persistence:** Persistent cross-session drafts are out of scope unless separately specified. A local in-memory draft for the current screen is sufficient for Phase 1.

## 7. AI Anonymity Check
**User Story:** As a user, I want the platform to help me avoid posting identifying information by mistake.

**Acceptance Criteria:**
* **Mandatory Pre-Publish Step:** The story creation flow must require an anonymity scan before the first publish action.
* **Primary Risk Types:** At minimum, the scan should look for likely identifying details such as:
  * full names
  * phone numbers
  * email addresses
  * exact street addresses
  * highly specific locations
  * unique identifying combinations of facts
* **Result States:** The scan must support at least three outcomes:
  1. `pass`: no obvious issues detected
  2. `warning`: possible identity exposure; user should review before continuing
  3. `block`: high-confidence identity exposure; publishing must remain disabled until the text changes and is rescanned
* **User Control:** The user must be able to edit the story after a warning or block result and rerun the scan.
* **No Silent Rewrite:** The system must not silently rewrite a user's story without showing what changed. If auto-suggestions are added later, they must be explicit and reviewable.
* **Auditability:** The backend should retain enough metadata to prove that a scan occurred before publish, including the result status and timestamp.
* **Edit Rule:** If a registered user edits a published story, the revised body must go through the anonymity check again before the update goes live.

## 8. Story Read Experience
**User Story:** As a reader, I want a focused, calming reading view so I can engage with one story at a time.

**Acceptance Criteria:**
* **Layout:** The story detail screen must present:
  * back navigation
  * a story-level overflow menu
  * a topic label or tag area
  * the story title
  * author/publish metadata
  * the story body in a comfortable reading layout
  * a persistent primary reaction action at the bottom
* **Public Author Label:** Public metadata should use an anonymity-preserving label such as `Published anonymously`, even when the backend owner is a registered account.
* **Timestamp Display:** The UI should support human-readable relative or formatted publish times.
* **Readability:** Text spacing, contrast, and line length should be optimized for emotionally sensitive long-form content.
* **Navigation Preservation:** Returning from a story should preserve the user's previous feed or list context where possible.
* **Overflow Menu Rules:** The overflow menu must only show actions the current user is allowed to perform. Edit and delete must never appear for non-owners.

## 9. Support Reaction: "Send a Hug"
**User Story:** As a reader, I want a simple way to show care without the pressure of public social signaling.

**Acceptance Criteria:**
* **Primary Reaction Model:** "Send a Hug" is the primary visible reaction in the current story experience.
* **Availability:** Both registered users and guest sessions may send hugs to published stories.
* **Abuse Control:** The backend must prevent unlimited duplicate hugs from the same account or guest session for the same story. The simplest Phase 1 rule is one hug per story per account or guest session.
* **Feedback:** Tapping the Hug button must produce immediate feedback so the user knows the action succeeded.
* **Privacy:** The identity of users who sent hugs must not be exposed publicly to story authors or other readers in Phase 1.
* **Dashboard Metric:** Hug counts should be visible to the registered owner inside "My Stories".
* **Removal Rule:** If hug toggling or removal is supported, the behavior must be consistent across feed, detail, and dashboard surfaces. If not supported, repeat taps should be idempotent.

## 10. "My Stories" Dashboard
**User Story:** As a registered user, I want a private dashboard where I can review and manage the stories I have shared.

**Acceptance Criteria:**
* **Access Restriction:** Only registered users may access the persistent dashboard. Guest sessions must be blocked, consistent with `authentication.md`.
* **Primary Layout:** The dashboard must include:
  * a personal heading such as `My Haven` or `My Stories`
  * an account or settings entry point
  * a summary card showing the user's total published stories
  * a list of owned stories
  * persistent navigation that keeps Home, Compose, and My Stories easy to reach
* **Story Inventory:** Each list item should show, at minimum:
  * story title
  * publish date
  * community support metric, currently hug count
* **Open Detail:** Tapping an owned story should open a management-capable detail view for that story.
* **Ownership Enforcement:** The dashboard must list only stories owned by the active registered user.
* **Empty State:** If the user has no stories, the dashboard must show a clear empty state and a path to write a first story.
* **Management Controls:** Registered users must be able to edit or delete their own published stories from this area or from the story detail reached through it.
* **Metric Freshness:** Story counts and hug counts should refresh after publish, edit, delete, or hug events affecting owned stories.

## 11. Edit and Delete Rules
**User Story:** As a registered author, I want to correct or remove a story I previously shared.

**Acceptance Criteria:**
* **Who Can Edit:** Only the registered owner of a story may edit it.
* **Who Can Delete:** Only the registered owner of a story may delete it, unless the platform removes it for moderation reasons.
* **Anonymous Limitation:** Anonymous guest authors do not receive persistent edit or delete tools for previously published stories.
* **Edit Safety:** Editing a story must rerun the anonymity check before the updated version becomes public.
* **Delete Behavior:** Delete should be implemented as a safe backend state change rather than a hard erase whenever moderation, auditability, or analytics retention requires traceability.
* **User Confirmation:** Destructive actions must require confirmation.
* **Post-Delete Result:** Deleted stories must disappear from public feed and story detail surfaces. The dashboard may either remove them entirely or show a deleted state, but the behavior must be consistent.

## 12. Content Model Requirements
The story experience requires a content model that supports writing, publishing, reacting, and ownership enforcement.

**Story Record Requirements**
* Every story must have a unique internal ID.
* Every story must store a body, publish status, created timestamp, updated timestamp, and published timestamp.
* Every story must store ownership through either:
  * `author_user_id` for registered ownership, or
  * `author_guest_session_id` for guest-session ownership
* The database must enforce that a story belongs to exactly one of those ownership types.
* Public surfaces must not expose ownership fields directly.

**Title Requirements**
* The read view and dashboard both display titles.
* The current write mockup does not include a title field.
* Product and engineering must choose one of these approaches before implementation:
  1. add an explicit title input to the write flow, or
  2. auto-generate a title from the story body using deterministic product rules
* This decision must be finalized before the story API is considered complete.

**Topic Tag Requirements**
* The read view displays a tag such as `#memories`.
* The current write mockup does not include a tag-selection control.
* Product must decide whether tags are:
  * author-selected,
  * system-assigned, or
  * omitted in Phase 1

## 13. Suggested API Surface
The backend should expose endpoints sufficient to support the flows above. A reasonable Phase 1 API surface is:

* `GET /api/stories` to list published stories for the feed
* `GET /api/stories/:id` to fetch a single published story
* `POST /api/stories/privacy-check` to run the anonymity scan on draft text
* `POST /api/stories` to publish a new story
* `PATCH /api/stories/:id` to update a registered user's owned story
* `DELETE /api/stories/:id` to delete a registered user's owned story
* `POST /api/stories/:id/hugs` to register a hug
* `GET /api/dashboard/my-stories` to fetch a registered user's private inventory and metrics

## 14. MySQL Schema Implications
The current authentication schema already covers users, guest sessions, and policy acceptance. Story management adds the following database needs.

**Core Tables**
* **`stories`:** Stores published stories and ownership.
* **`story_hugs`:** Stores support reactions linked to a story and to either a user or guest session.
* **`story_privacy_scans`:** Stores publish-time anonymity check results for auditability.
* **`story_revisions`:** Optional but recommended if the product wants to preserve edit history or moderation traceability.

**Stories Table Requirements**
* `stories.id` must be the primary key.
* `stories.author_user_id` may reference `users.id`.
* `stories.author_guest_session_id` may reference `guest_sessions.id`.
* Exactly one ownership field must be populated.
* `stories.title` must exist if titles are explicit or generated at publish time.
* `stories.body` must store the final published content.
* `stories.status` should distinguish states such as `published`, `deleted`, `hidden`, or `flagged`.
* `stories.published_at` must support ordering in public feeds and dashboards.
* The schema should support soft deletion and moderation visibility control.

**Story Hugs Requirements**
* `story_hugs.id` must be the primary key.
* `story_hugs.story_id` must reference `stories.id`.
* Each hug must belong to either:
  * `user_id`, or
  * `guest_session_id`
* The schema should prevent duplicate hugs from the same actor on the same story.
* A unique key should exist for `(story_id, user_id)` and for `(story_id, guest_session_id)`.

**Privacy Scan Requirements**
* `story_privacy_scans.id` must be the primary key.
* `story_privacy_scans.story_id` may reference `stories.id` if the scan result is stored after story creation.
* The scan record should store result status, timestamp, and enough metadata to explain whether the story passed, warned, or blocked.
* If draft-level scans happen before a story row exists, the system may store a temporary result keyed to the active session and later attach it to the published story.

**Indexes**
* Add indexes on story ownership fields, `stories.status`, `stories.published_at`, and `story_hugs.story_id`.
* Add indexes that support fast lookup for:
  * public feed ordering
  * a registered user's private story inventory
  * hug totals by story
  * moderation and audit review

## 15. Cross-Document Alignment with Authentication
This story document must stay aligned with `product design/authentication.md`.

**Confirmed Alignment**
* Registered users can access persistent story ownership and management.
* Guest users can post only after policy acceptance in the active guest session.
* Guest users cannot recover stories from older sessions.
* Edit and delete rights are limited to registered owners.

**Design Tension That Must Be Resolved**
* `authentication.md` currently describes comment counts and unread comment badges in "My Stories".
* The three story mockups show hugs as the visible engagement mechanic and do not include any comment UI.
* Before implementation begins, product must decide whether:
  1. comments and unread badges remain Phase 1 requirements, which will require more UI than these three mockups provide, or
  2. Phase 1 story engagement is hugs-only, with comment requirements deferred to a later document and release

## 16. Open Implementation Notes
These items are not fully resolved by the current mockups and should be finalized before development is considered complete:

* Whether story titles are user-entered or auto-generated
* Whether topic tags are author-selected, system-assigned, or removed from Phase 1
* Whether hugs are idempotent only or fully toggleable
* Whether the overflow menu includes reporting, copying a link, sharing, or only owner actions
* Whether deleted stories remain visible in the author's dashboard as tombstones or disappear entirely
* Whether guest-session authors receive any immediate post-publish confirmation or temporary within-session receipt
* Whether the product keeps hugs-only engagement in Phase 1 or expands to comments and unread badges now
