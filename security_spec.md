# FlexiFlow Security Spec

## 1. Data Invariants
- Each user profile `/users/{userId}` belongs exclusively to that authenticated user (`request.auth.uid == userId`).
- Organizations and Projects are restricted to members or owners.
- Tasks, Custom Fields, Workflows, Automations and Comments belong to valid projects.
- Notifications are only read and updated by their owner (`userId == request.auth.uid`).

## 2. The Dirty Dozen Payloads
1. Writing to another user's profile with spoofed `uid`.
2. Creating an organization with an arbitrary non-matching `ownerId`.
3. Reading private user notifications without authentication.
4. Updating another user's notification `read` status.
5. Deleting project tasks without being signed in.
6. Injecting oversized string payloads into task descriptions (> 10000 chars).
7. Injecting arbitrary unexpected field keys into custom field definitions.
8. Modifying immutable creation timestamps on tasks.
9. Overwriting workflow statuses without project membership.
10. Modifying automation triggers without being signed in.
11. Reading activity logs as an unauthenticated client.
12. Attempting arbitrary collection writes to `__internal__` collections.
