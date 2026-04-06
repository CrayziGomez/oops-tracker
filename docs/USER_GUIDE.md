# OOPS Tracker — User Guide

Welcome to **OOPS Tracker**. This guide covers everything you need to know to report, track, and manage issues effectively using our platform.

---

## 🚀 Getting Started

### 1. Your Workspace
When you are added to a new project by an Owner or Admin, you will receive an **in-app notification** and a **welcome alert** (via Email/Telegram if enabled).
- Your dashboard shows a summary of activity for the **Projects** you are a member of.
- Use the project selector in the top navigation bar to switch between projects.

### 2. The OOPS Lifecycle
Every OOPS log (Observation, Outage, Problem, or Suggestion) follows a standard workflow:
1. **OPEN**: The issue has been reported and is awaiting triage. All project members are notified of the new log.
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

OOPS Tracker provides real-time updates so the entire team stays in the loop.

### Profile Settings
Go to your **Profile** page to manage how you receive alerts:
- **Privacy Defaults**: By default, **Email** and **Telegram** notifications are set to **OFF**. You must explicitly enable them if you wish to receive off-site alerts.
- **Project Subscriptions**: You can choose to "Mute" or "Unmute" specific projects. If a project is muted, you won't receive any Push/Email alerts for it, even if you are a member.

---

## 📱 Advanced Telegram Bot

Our Telegram integration allows you to manage tickets without opening your browser.

### Setup
1. Open the [OOPS Tracker Bot](https://t.me/your_bot_name) (get the link from your Admin).
2. Type `/start` to get your **Chat ID**.
3. Paste this Chat ID into your **Profile** settings in the OOPS Web App.

### Features
- **Real-time Alerts**: Get notified the second **any** member updates a ticket or adds a comment.
- **Mobile Discussions**: Simply reply to any bot alert to add a comment. **Every project member** receives your reply instantly.
- **Photo Attachments**: Reply with a photo to automatically attach evidence to the OOPS log.
- **Action Commands** (Admins Only):
    - `/done`: Mark the ticket as resolved.
    - `/action`: Mark the ticket as actioned.
    - `/open`: Re-open a ticket.

---

## 🛡️ Roles & Permissions

- **Global Owner**: Manages the entire system and all projects.
- **Project Admin**: Manages team members and ticket status for their specific projects.
- **Reporter**: Can create logs and participate in discussions within their assigned projects.

---

*Need more help? Reach out to your local Project Administrator.*
