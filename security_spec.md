# Security Specification

## Data Invariants
1. A user profile must match the authenticated user's UID.
2. Posts must have a valid authorId matching the creator's UID.
3. Comments must reference a valid target (post or publication) and have a valid authorId.
4. Publications are publicly readable if approved, but only submittable by authenticated users.
5. Events are only manageable by admins (hardcoded UID for now).

## The Dirty Dozen Payloads
1. Create a user profile for a different UID.
2. Update a post's authorName to someone else.
3. Create a post with a future createdAt timestamp.
4. Delete a post owned by another user.
5. Create a comment on a non-existent post.
6. Approve a publication as a regular user.
7. Inject a 1MB string into an event title.
8. Update a post's authorId (making it immutable).
9. Create an event without being an admin.
10. Read private user email data if not the owner.
11. List all users without restricted fields.
12. Bulk update posts to increment likes maliciously.

## Test Runner (Mock Logic)
- Verify `User` creation fails if `auth.uid != resource.id`.
- Verify `Post` creation fails if `authorId != auth.uid`.
- Verify `Event` creation fails for non-admins.
- Verify `Publication` submission requires institution and email.
