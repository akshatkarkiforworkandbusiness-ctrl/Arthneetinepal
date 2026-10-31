# Firebase setup — fixing `auth/unauthorized-domain`

This is the error that blocks sign-up and log-in. It is **not** a bug in the
code and it is not a problem with anyone's account — Firebase simply refuses to
run auth from a host that has not been allowlisted in the project yet.

```
Firebase: Error (auth/unauthorized-domain)
```

Firebase validates the browser's hostname against a list before it will even
attempt authentication. Anything not on that list fails immediately.

---

## 1. Add the domain (this is the actual fix)

1. Open <https://console.firebase.google.com/> and select the
   **arthneeti Nepal** project (`arthneetinepal`).
2. In the left sidebar click **Authentication**.
3. Open the **Settings** tab and scroll to **Authorized domains**.
4. Click **Add domain** and add every host you actually use.

You can see the exact host you are being rejected on in the console error, or in
the Network tab — look at the `signIn...` request. Add precisely that hostname,
with no protocol, no port and no trailing slash.

### Hosts to add

| Host | When you need it |
| --- | --- |
| `localhost` | Local dev. Usually already present. |
| `127.0.0.1` | When you open the app via `http://127.0.0.1:5173` instead of `localhost`. |
| `192.168.x.x` | **Your machine's LAN IP.** This is the most commonly missed one — `npm run dev` binds to `0.0.0.0`, so opening the site from a phone or another PC on your network hits this host, and it is never authorized by default. |
| `arthneetinepal.web.app` | Production (Firebase Hosting). Pre-listed. |
| `arthneetinepal.firebaseapp.com` | Production. Pre-listed. |
| `arthneetinepal.vercel.app` | Vercel production. |
| `your-custom-domain.com` | Any custom domain you attach. |
| `*.vercel.app` preview hosts | Each preview deployment gets its own hostname (`arthneeti-git-branch-you.vercel.app`). Add it individually, or test against the production domain. |

> **Tip:** for local work, always open the site as `http://localhost:5173`.
> It is authorized by default, so you avoid the whole problem.

---

## 2. While you are in there, check the sign-in providers

Under **Authentication → Sign-in method**, confirm these are **Enabled**, not
just present:

- **Email/Password** — required for the email + password form.
- **Google** — required for the "Sign In with Google" button.

A disabled provider raises `auth/operation-not-allowed`, which used to be shown
to users as the unhelpful *"This sign-in method is not enabled."* That message
now names the problem, but enabling the providers is the real fix.

---

## 3. Deploy the updated security rules

`firestore.rules` was updated. Rules only take effect once deployed:

```bash
npx firebase deploy --only firestore:rules
```

What changed:

- **`admins` create was wide open.** It allowed `isSignedIn()`, so any signed-in
  user could write `admins/<their-uid>` and grant themselves admin. It is now
  `false` for all client writes — admins must be provisioned from the console or
  a trusted server.
- **`users/{uid}/bookmarks` was never declared.** Every path not declared in the
  rules file falls through to the global deny at the bottom, so bookmarking
  always failed with `permission-denied`. Added, scoped to the owner.
- **`users/{uid}/notifications` was never declared** — same cause, same fix.
  Clients may read their own and flip the `read` flag; only admins can create
  them.

### Provisioning an admin

Self-service admin was removed. To make yourself (or someone else) an admin:

1. Firebase console → **Firestore Database**.
2. Create a document in the **`admins`** collection.
3. Set the **document ID** to the user's UID. You can find your UID under
   **Authentication → Users**, or in the browser console:

   ```js
   (await import('firebase/auth')).getAuth().currentUser.uid
   ```

4. Add a field `role` = `admin` (optional, for your own reference).

From then on `isAdmin()` in the rules resolves to true for that UID.

---

## 4. Optional: enable the privileged Admin SDK features

`/api/*` now runs without a service account — it verifies sign-in tokens using
the project ID alone, so **Research, News and Digest work either way**.

A service account is only needed for privileged server work (Firestore Admin
access, user lookup, token revocation, and `api/leaderboard/snapshot.ts`). To
add one:

1. Firebase console → **Project settings → Service accounts**.
2. **Generate new private key.** This downloads a JSON file. Treat it as a
   password — do not commit it.
3. Put the file's entire contents on one line as `FIREBASE_SERVICE_ACCOUNT_JSON`,
   in Vercel Project Settings → Environment Variables (and in local `.env` if
   you run `vercel dev`).

---

## 5. Running the site locally

The dev setup previously proxied `/api` back into the Vite dev server itself,
so every API call returned HTML instead of JSON. Two scripts now split the work:

```bash
npm run dev        # frontend on http://localhost:5173
npm run dev:api    # backend (Vercel functions) on http://localhost:3000
```

Run both, in separate terminals. `/api` requests from 5173 are proxied to 3000.
If you run the backend on a different port, set `API_PROXY_TARGET` in `.env`.
