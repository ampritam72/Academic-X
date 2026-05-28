# Security Specification for Academic X

## 1. Data Invariants
- A user can only access their own private data (study notes, saved slides).
- Notices are publicly readable but only admins/CRs can create/update.
- Club events are publicly readable; only club leaders/admins can manage.
- Messages are only readable by participants of the chat (though for simplicity in this MVP, we might use group IDs).

## 2. The Dirty Dozen Payloads (Target: Insecure Writes)
1. **User Identity Spoofing**: Attempt to create a user profile with a different `auth.uid`.
2. **Elevated Privilege**: Attempt to set `roles: ['Admin']` during registration.
3. **Ghost Fields**: Adding `isVerified: true` to a profile update.
4. **Notice Hijacking**: A regular student attempting to post an official notice.
5. **Denial of Wallet (ID)**: Creating a document with a 1MB string as ID.
6. **Denial of Wallet (Data)**: Injecting a 1MB string into the `fullName` field.
7. **Relational Orphan**: Creating a club event for a non-existent club.
8. **PII Leak**: A student attempting to read another student's profile (if restricted).
9. **History Manipulation**: Attempting to change the `createdAt` timestamp of a note.
10. **State Skipping**: Manually setting `streakDays` to a massive number.
11. **Shadow Update**: Updating a note but also changing its `userId`.
12. **Blind Query**: Attempting to list all users' notes without a `where` filter.

## 3. Test Runner (Draft Plan)
We will use `@firebase/rules-unit-testing` logic (conceptually) to verify:
- `auth.uid != userId` => DENIED
- `incoming().roles.size() > 1` (unless Admin) => DENIED
- `incoming().keys().size() > expected` => DENIED
