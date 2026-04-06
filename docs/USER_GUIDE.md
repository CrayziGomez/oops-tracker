# OOPS Tracker — User Guide

Welcome to **OOPS Tracker**. This guide covers everything you need to know to report, track, and manage issues effectively using our platform.

---

## 🚀 Getting Started

### 1. Your Workspace
When you log in, your dashboard shows a summary of activity for the **Projects** you are a member of.
- If you don't see a project you expect to be in, contact your **Project Administrator** to be invited.
- You can switch between projects using the project selector in the top navigation bar.

### 2. The OOPS Lifecycle
Every issue (Observation, Outage, Problem, or Suggestion) follows a standard workflow:
1. **OPEN**: The issue has been reported and is awaiting triage.
2. **ACTIONED**: Someone is actively working on a resolution.
3. **IN REVIEW**: A fix has been submitted and is being verified.
4. **DONE**: The issue is resolved and closed.

---

## 📝 Reporting & Tracking

### Logging a New OOPS
Click the **+ OOPS log** button on your dashboard or project page.
- **Title**: Be specific (e.g., "Login page returns 500 error on mobile").
- **Description**: Provide steps to reproduce, expected vs. actual results.
- **Attachments**: Drag and drop logs, screenshots, or screen recordings to provide evidence.

### Finding Issues
Every log is assigned a unique tracking ID (e.g., `OOPS-123`). You can use the search bar to find tickets by ID, title, or reporter.

---

## 🔔 Managing Notifications

OOPS Tracker provides real-time updates so you never miss a critical fix.

### Profile Settings
Go to your **Profile** page to manage how you receive alerts:
- **Global Toggles**: Turn **Email** or **Telegram** notifications ON/OFF for your entire account.
- **Project Subscriptions**: You can choose to "Mute" or "Unmute" specific projects. If a project is muted, you won't receive any Push/Email alerts for it, even if you are a member.

---

## 📱 Advanced Telegram Bot

Our Telegram integration allows you to manage tickets without opening your browser.

### Setup
1. Open the [OOPS Tracker Bot](https://t.me/your_bot_name) (get the link from your Admin).
2. Type `/start` to get your **Chat ID**.
3. Paste this Chat ID into your **Profile** settings in the OOPS Web App.

### Features
- **Real-time Alerts**: Get notified the second a ticket is updated or a comment is added.
*   **Quick Replies**: Simply reply to any bot message to add a comment to that ticket.
*   **Photo Attachments**: Reply with a photo to automatically attach it to the OOPS log.
*   **Action Commands** (Admins Only):
    *   `/done`: Mark the ticket as resolved.
    *   `/action`: Mark the ticket as being worked on.
    *   `/open`: Re-open a ticket.

---

## 🛡️ Roles & Permissions

- **Global Owner**: Manages the entire system and all projects.
- **Project Admin**: Manages team members and ticket status for their specific projects.
- **Reporter**: Can create logs and participate in discussions within their assigned projects.

---

*Need more help? Reach out to your local Project Administrator.*
