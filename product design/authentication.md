## 1. Overview
This document defines the authentication flows, privacy controls, identity rules, and dashboard access model for the platform. The product must support both fully registered users and anonymous participants during the pilot phase, while keeping ownership and consent rules explicit enough for engineering implementation.

## 2. Authentication Flow
**User Story:** As a user, I want to sign in using Google, email/password, or anonymously, so that I can choose my level of privacy.

**Acceptance Criteria:**
* **Supported Methods:** Phase 1 must support exactly three login routes:
  1. Google OAuth
  2. Manual account login using email and password
  3. Anonymous access using a guest session
* **Out of Scope for Phase 1:** Apple, Facebook, and other OAuth providers are not required in Phase 1. They may be considered in a future release.
* **Primary Identity Model:** Every registered account must have a unique internal user ID. Manual accounts must also have:
  * A unique username
  * A unique email address
* **Google Identity Model:** Google sign-in must require a verified Google email address and create or link to a registered account.
* **Account Linking Rule:** If a user signs in with Google and a registered account already exists for the same verified email address, the system must link that login to the existing account rather than creating a duplicate user.
* **Username Constraint:** Usernames must be globally unique across the database.
* **Authentication State:** After successful authentication, the system must create a server-recognized session for the active user type:
  * Registered session for Google or manual login
  * Guest session for anonymous login
* **Logout:** All session types must support explicit logout. Logging out must revoke access to protected features until the user signs in again.

## 3. Manual Account Requirements
**User Story:** As a user creating a standard account, I want a clear and secure registration and login flow.

**Acceptance Criteria:**
* **Registration Inputs:** Manual registration must collect username, email address, and password.
* **Password Policy:** Passwords must meet a minimum security standard defined by engineering and product. At minimum, the UI must reject obviously weak passwords and provide validation feedback.
* **Password Storage:** Passwords must never be stored in plain text and must be stored using a secure one-way password hashing method.
* **Reset Flow:** Manual accounts must support a password reset mechanism before production launch.
* **Email Verification:** If email verification is not implemented during the pilot, the system must clearly mark it as a launch risk and prevent unverified emails from being treated as high-trust identity proof outside the manual login flow.
* **Abuse Controls:** The authentication service must include basic protections against repeated failed login attempts and automated abuse.

## 4. Terms of Service (ToS) and Privacy Consent
**User Story:** To ensure informed consent and ethical data handling, all users must acknowledge the platform's policies before contributing content.

**Acceptance Criteria:**
* **General Requirement:** A user must explicitly approve the active Terms of Service and Privacy Policy before being permitted to share a story.
* **Content Requirements:** The consent UI must prominently highlight:
  * The platform's Privacy Policy
  * The current pilot status of the project
* **Versioned Consent:** The system must store the version of the accepted policy set for registered users.
* **Policy Updates:** If the Terms of Service or Privacy Policy changes, registered users must re-accept the new version before posting again.
* **Anonymous User Protocol:** Because guest sessions do not persist across logins, anonymous users must re-approve the active policy set in every new guest session before posting.
* **Auditability:** The system must be able to determine whether the active session has accepted the current policy version.

## 5. Anonymous Session Rules
**User Story:** As a privacy-sensitive user, I want to contribute anonymously without creating a persistent account.

**Acceptance Criteria:**
* **Session Scope:** Anonymous access must create a temporary guest session that is distinct from registered accounts.
* **No Cross-Session History:** Anonymous users must not be able to recover authored content, dashboard history, or account state from previous guest sessions.
* **Within-Session Ownership:** During a live guest session, the system may associate newly created content with that session for moderation, rate limiting, and immediate post-submission behavior.
* **Session Expiry:** Once a guest session expires or the user logs out, the user must lose access to any ownership-based features associated with that session.
* **Upgrade Path:** Converting an anonymous session into a registered account is out of scope unless separately specified.

## 6. Personal Dashboard ("My Stories")
**User Story:** As a registered user, I want to access a "My Stories" section, so that I can manage my previous posts and see community engagement.

**Acceptance Criteria:**
* **Navigation:** The UI must include a "My Stories" entry point accessible from the main navigation for registered users only.
* **Access Restriction:** Anonymous users must not be able to access this section and must not be able to view or manage stories from previous guest sessions.
* **Content Inventory:** The dashboard must list all stories authored by the active registered user and show the total comment count for each story.
* **Content Management:** Registered users must be able to edit or delete only their own previously published stories from this dashboard.
* **Unread Badge:** The "My Stories" entry point must display the number of unread comments across the user's stories.
* **Read State Definition:** A comment is considered unread until the registered user views the relevant story detail or dashboard thread in a way defined by implementation.
* **Badge Scope:** The unread count must be based only on comments associated with the active registered user's authored stories.

## 7. Role and Permission Matrix
A summary of system capabilities based on the active session type:

| Capability | Registered User (Google/Manual) | Anonymous User |
| :--- | :--- | :--- |
| **Read Stories** | Yes | Yes |
| **Share Stories** | Yes, after accepting current policies | Yes, after accepting current policies for that guest session |
| **Access "My Stories"** | Yes | No |
| **View Past Authored Content** | Yes | No |
| **Edit/Delete Own Content** | Yes | No |
| **Unread Comment Badge** | Yes | No |

## 8. Open Implementation Notes
These items must be confirmed before full production launch if they remain deferred during the pilot:

* Email verification behavior for manual accounts
* Password reset delivery mechanism
* Session duration and expiration rules
* Rate limiting and anti-abuse thresholds
* Any future support for Apple, Facebook, or other OAuth providers

## 9. MySQL Schema Implications
The authentication and ownership rules in this document have direct database design implications. The MySQL schema should support the following structures and constraints.

**Core Tables**
* **`users`:** Stores registered accounts created through manual signup or Google login.
* **`auth_providers`:** Stores external authentication identities linked to a registered user, starting with Google for Phase 1.
* **`sessions`:** Stores active and expired authenticated sessions for registered users.
* **`guest_sessions`:** Stores temporary anonymous sessions used for guest access.
* **`policy_versions`:** Stores each published Terms of Service and Privacy Policy version pair that can be accepted by users.
* **`policy_acceptances`:** Stores which registered user or guest session accepted which policy version and when.

**Users Table Requirements**
* `users.id` must be the primary key.
* `users.username` must be unique.
* `users.email` must be unique for registered accounts.
* The schema must store password hash data for manual accounts, not raw passwords.
* The schema should distinguish the account creation method without making it impossible for one account to support both manual and Google login later.

**Auth Provider Linkage**
* `auth_providers.id` must be the primary key.
* `auth_providers.user_id` must reference `users.id`.
* `auth_providers.provider_name` should support values such as `google`.
* `auth_providers.provider_user_id` must store the provider-specific subject identifier.
* The pair `(provider_name, provider_user_id)` must be unique.
* A user may have zero or more linked provider records, which allows future support for additional OAuth providers.

**Registered Session Requirements**
* `sessions.id` must be the primary key.
* `sessions.user_id` must reference `users.id`.
* The schema should support issued-at, expiry, revocation, and last-activity timestamps as needed by implementation.
* Revoked or expired sessions must be distinguishable from active sessions.

**Guest Session Requirements**
* `guest_sessions.id` must be the primary key.
* Guest sessions must not require a `users.id`.
* The schema should support issued-at, expiry, revocation, and last-activity timestamps.
* Guest sessions must be treated as temporary identity containers, not user accounts.

**Policy Consent Requirements**
* `policy_versions.id` must be the primary key.
* `policy_versions` should store enough metadata to identify the active Terms of Service and Privacy Policy version presented to the user.
* `policy_acceptances.id` must be the primary key.
* `policy_acceptances.policy_version_id` must reference `policy_versions.id`.
* A policy acceptance record must reference either:
  * `user_id` for a registered user acceptance, or
  * `guest_session_id` for an anonymous guest-session acceptance
* The schema must allow the backend to determine whether the current session has accepted the active policy version before posting.

**Story Ownership Implications**
* Stories authored by registered users should reference `users.id`.
* Stories authored during anonymous use may reference `guest_sessions.id` for the lifetime of that guest session if the product needs within-session ownership behavior.
* Anonymous story ownership must not imply long-term recoverability across guest sessions.
* Edit and delete permissions must be enforceable from stored ownership fields rather than UI logic alone.

**Comment and Unread Count Implications**
* If unread comment badges are required, the schema must support calculating unread comments for each registered author.
* This can be implemented through a read-state table, stored last-viewed timestamps, or another equivalent design, but the data model must support:
  * determining which comments belong to stories authored by a given registered user
  * determining whether those comments have been viewed by that author
* Anonymous users do not require persistent unread tracking across sessions.

**Indexes and Constraints**
* Add unique indexes for `users.username`, `users.email`, and `(auth_providers.provider_name, auth_providers.provider_user_id)`.
* Add foreign key constraints wherever ownership or session relationships must be enforced.
* Add indexes on `sessions.user_id`, `guest_sessions.id`, story ownership fields, and policy acceptance references to support lookup performance.

**Future-Proofing**
* The schema should allow additional OAuth providers without requiring a redesign of the `users` table.
* If guest-to-registered-account conversion is added later, the schema may need migration rules for transferring story ownership from `guest_sessions` to `users`.
