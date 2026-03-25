# OOPS - Project Roadmap & Implementation Phases

This document tracks the progress of the OOPS Issue Tracker and serves as a reminder for future development.

## ✅ Phase 1: Core Foundation (Completed)
*   **Infrastructure**: Database setup (SQLite), Next.js App Router, Docker support.
*   **Auth**: Admin and Reporter roles via NextAuth.
*   **CRUD**: Create, Read, Update issues.
*   **Attachments**: File uploads for logs and screenshots.
*   **Comments**: Discussion threads on issues.

## ✅ Phase 2: Visibility & Lifecycle (Completed)
*   **Activity Logs**: Real-time audit feed tracking all status changes.
*   **Status Workflow**: `IN_REVIEW` status stage for Reporter -> Admin verification.
*   **Quick Log**: Frictionless modal for logging issues from any page.
*   **Metrics**: Global dashboard showing Critical vs. Open counts.

## ✅ Phase 3: Permissions & Gamification (Completed)
*   [x] **Project Separation**: Implement a membership model to restrict access to specific projects.
*   [x] **User Leaderboard**: New Dashboard widget for "Top Reporters" (most issues logged).
*   [x] **Admin Controls**: Manage user project assignments and privileges.

## ✅ Phase 4: Onboarding & Communications (Completed)
*   **Project Invitations**: `ProjectInvitation` model and tokens for secure onboarding.
*   **In-App Notifications**: `Notification` center in the header for status updates.
*   **Self Registration**: Users join projects and set up accounts via invitation links.
*   **Email Alerts**: Transactional emails (via Brevo) for invitations and status changes.

## 🚀 Phase 5: Advanced Issue Management (Future DB Changes to Anticipate)
*   [ ] **Custom Tags / Labels (DB Change)**: Introduce a `Tag` model and a many-to-many relationship with `Issue`. Allowing custom organization beyond standard categories (e.g., "frontend", "needs-design", "v1.0-release").
*   [ ] **Milestones / Sprints (DB Change)**: Introduce a `Milestone` model to group issues into targets, sprints, or versions for better project tracking.
*   [ ] **Issue Linking (DB Change)**: Introduce an `IssueLink` model to establish relationships between issues (e.g., "Issue A *blocks* Issue B", "Issue C *duplicates* Issue D").
*   [ ] **Time Logging (DB Change)**: Introduce a `TimeEntry` model to allow developers/reporters to track hours worked on specific issues.

---

*Last Updated: 2026-03-25*
