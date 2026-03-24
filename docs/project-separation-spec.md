# Project Separation Specification

## Overview
This specification details the architecture for implementing "Project Separation" (Phase 3) in the OOPS Issue Tracker. This document serves as the single source of truth for AI agents executing this phase, preventing conflicting changes.

## 1. Role Definitions & Access Control
The application resolves to a two-tier permission system:
*   **Global Level**:
    *   **OWNER (Global Admin)**: Full system access. Creates new users and projects; assigns users to projects.
    *   **USER**: Standard global role. Access is governed locally via project assignments.
*   **Project Level**:
    *   **PROJECT_ADMIN**: Can view, edit, and manage their assigned project(s). This includes inviting existing system users to their project and managing issue lifecycles.
    *   **PROJECT_REPORTER**: Read/Write access constrained to project(s) they are a member of. Cannot see unassigned projects.

## 2. Data Model Additions
A many-to-many link table must be introduced to map `User` to `Project` with an explicit `role`.

```prisma
// To be added in schema.prisma

model User {
  // Existing fields...
  role            String          @default("USER") // Update from REPORTER -> USER. Owners are explicitly "OWNER"
  projectMembers  ProjectMember[] 
}

model Project {
  // Existing fields...
  members         ProjectMember[] 
}

model ProjectMember {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  role      String   @default("PROJECT_REPORTER") // PROJECT_ADMIN or PROJECT_REPORTER
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([userId, projectId])
  @@index([userId])
  @@index([projectId])
  @@map("project_members")
}
```

## 3. UI/UX and API Flow Impacts

### Dashboard
*   Global stats (Open / Critical counts) will only aggregate issues from projects the logged-in user is a member of, or all projects if the user is an `OWNER`.

### Project Navigation
*   Users will only see projects they are assigned to in dropdowns, lists, and navigation sidebars.
*   `OWNER` accounts will have a separate "System Administration" UI to create/manage projects globally.

### Team Management
*   Project Admins will gain a new view within their Project details page to add/remove members and adjust their project roles (`PROJECT_ADMIN` vs `PROJECT_REPORTER`).

### Issue Creation & Review
*   The "Log Issue" form's project selector must be filtered by the user's `ProjectMember` records.
*   Only `OWNER`s or the specific `PROJECT_ADMIN`s for the issue's parent project have authority to transition issues from `IN_REVIEW` to `DONE` or `ACTIONED`.

## Execution Guidelines
When implementing this specification, follow these steps strictly:
1.  **Prisma Updates**: Apply the new schema and generate the Prisma Client.
2.  **Seed Update**: Update any existing `setup.sh` or seed scripts to migrate current users into the new structure (e.g., assign existing Admins as `OWNER`s and existing Reporters as `USER`s mapped to all current projects for backward compatibility).
3.  **API Safeguards**: Wrap API routes to verify `ProjectMember` context before returning data or mutating state.
4.  **UI Refactor**: Implement the frontend scoping based on the new API responses.
