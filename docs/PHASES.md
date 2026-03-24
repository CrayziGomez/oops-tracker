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

## 📡 Phase 4: Onboarding & Notifications (Next)
*   [ ] **Self Registration**: Allow users to register accounts directly. Admins can then assign them to specific projects.
*   [ ] **User Onboarding Tutorial**: Registered users land on a basic instructions page explaining the app and reporting functionality, with an option to skip.
*   [ ] **Email Alerts**: Transactional emails for status changes and assignments.
*   [ ] **Messenger Integration**: Telegram or WhatsApp bot notifications for urgent alerts.
*   [ ] **User Reminders**: Automated reminders for stagnant issues or pending reviews.

---

*Last Updated: 2026-03-24*
