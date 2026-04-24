# Security Specification for Bihar Board Quiz App

## 1. Data Invariants
- `User`: Only the user themselves can read/update their profile. Only admins can modify 'role' or score totals directly (unless aggregated, but let's say only system/admins update `totalScore`).
- `Quiz`: Admins can create/edit/delete quizzes. Students can read quizzes.
- `Question`: Admins can create/edit/delete questions. Students can read questions.
- `QuizAttempt`: Students can create an attempt for themselves. `userId` must match `request.auth.uid`. Students can read their own attempts. Admins can read all attempts.

## 2. The "Dirty Dozen" Payloads
1. **Spoofed Attempt Creation**: User A tries to create a QuizAttempt where `userId` is User B's uid.
2. **Read Other's Profile**: User A attempts to read User B's user document.
3. **Admin Privilege Escalation**: User A attempts to update their own role to 'admin'.
4. **Unauthorized Quiz Creation**: Student attempts to create a Quiz document.
5. **Unauthorized Question Creation**: Student attempts to create a Question under a Quiz.
6. **Overwrite Existing Attempt**: User A attempts to overwrite a completed QuizAttempt.
7. **Score Tampering**: User A attempts to update their `totalScore` directly.
8. **Invalid ID**: User attempts to create a document with an ID exceeding 128 chars.
9. **Missing Fields**: Creating a quiz without a title.
10. **Type Mismatch**: Creating an attempt with `score` as a string instead of number.
11. **Spoofed Email**: User logs in with spoofed unverified email and tries to act as admin.
12. **Array Boundary Exceeded**: Admin creates a Quiz with an excessively large string field or questions array (though we use subcollections for questions, options array must be exactly 4).

## 3. Test Runner Context
The rules will be tested using a dedicated test runner (`firestore.rules.test.ts` to follow).
