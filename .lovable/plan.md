

## Fix: Allow Both Username and Email Login

### Problem
Currently two bugs prevent email-based accounts from logging in:
1. The login form validation regex only allows letters, numbers, underscores, and Chinese characters — blocking `@` and `.` characters needed for email addresses
2. The authentication logic always appends `@internal.local` to whatever is typed, so an email like `user@gmail.com` becomes `user@gmail.com@internal.local`

### Solution
Allow the account field to accept both plain usernames AND email addresses. If the input contains `@`, treat it as a real email; otherwise, append `@internal.local` as before.

### Changes

**1. `src/pages/Auth.tsx`** — Relax the username validation regex
- Update the regex to also allow `@`, `.`, `-`, `+` characters (common in email addresses)
- Update max length from 30 to 100 to accommodate longer email addresses

**2. `src/contexts/AuthContext.tsx`** — Smart email detection
- Modify `toInternalEmail` to check if the input already looks like an email (contains `@`)
- If yes, use it directly (just trim and lowercase)
- If no, append `@internal.local` as before

### Technical Details

```text
toInternalEmail logic:

  Input: "admin"        --> "admin@internal.local"     (username mode)
  Input: "test@qq.com"  --> "test@qq.com"              (email mode)
```

The validation regex changes from:
- `/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/` (no email chars allowed)
- to `/^[a-zA-Z0-9_\u4e00-\u9fa5@.\-+]+$/` (allows email characters)

