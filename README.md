# 🔖 Smart Bookmark App

A real-time bookmark manager built using **Next.js** and **Supabase**, supporting secure authentication, private data storage, and live updates across multiple tabs.

---

## 🚀 Live Demo

https://smart-book-mark-silk.vercel.app

## 📂 GitHub Repo

https://github.com/Adityam53/smart-bookMark.git

---

## ⚠️ Problems Faced & Solutions

### 1. Bookmarks not visible after refresh

**Problem:**
After adding bookmarks, they disappeared on page refresh.

**Cause:**
Row Level Security (RLS) was enabled but no SELECT policy was defined.

**Solution:**
Added a SELECT policy to allow users to fetch only their own bookmarks:

```sql
auth.uid() = user_id
```

---

### 2. Authentication UI flicker on reload

**Problem:**
The login button briefly appeared before the user session was restored.

**Cause:**
User state was initially `null` while Supabase was fetching the session.

**Solution:**
Introduced an `authLoading` state to delay rendering until authentication check completes.

---

### 3. Realtime updates not syncing correctly

**Problem:**
Bookmarks were not updating instantly across multiple tabs.

**Cause:**
Realtime replication was not enabled and there was no active subscription to database changes.

**Solution:**

* Enabled replication for the `bookmarks` table in Supabase
* Subscribed to changes using `postgres_changes` to trigger UI updates

---

### 4. Managing loading states without degrading UX

**Problem:**
Loading spinners appeared too frequently, especially during tab switches and realtime updates.

**Cause:**
Loading state was being triggered on every data fetch.

**Solution:**
Scoped loading only to the initial data fetch and avoided triggering it during realtime updates, ensuring a smoother experience.

---

### 5. Invalid URLs being stored

**Problem:**
Users could add invalid or malformed URLs.

**Solution:**
Added validation using JavaScript’s `URL` constructor before inserting data:

```ts
new URL(url);
```

---

### 6. Ensuring user-specific data security

**Problem:**
Needed to ensure users could not access or modify other users' bookmarks.

**Solution:**
Implemented Row Level Security (RLS) policies at the database level instead of relying only on frontend filtering.

---

## ✨ Features

* 🔐 Google OAuth authentication (Supabase Auth)
* ➕ Add bookmarks (title + URL)
* 🗑 Delete bookmarks
* 🔒 User-specific private data (RLS enforced)
* ⚡ Real-time updates across tabs
* 🎨 Minimal dark UI with Tailwind CSS
* 🔔 Toast notifications for actions
* ⏳ Loading states for better UX
* 🧠 URL validation before saving
* 🔗 Copy bookmark link functionality

---

## 🛠 Tech Stack

* **Frontend:** Next.js (App Router)
* **Backend:** Supabase (Auth, Database, Realtime)
* **Styling:** Tailwind CSS
* **Deployment:** Vercel

---

## 🧠 Learnings

* Implemented secure data access using Supabase Row Level Security (RLS)
* Built real-time functionality using database change subscriptions
* Managed authentication state to avoid UI inconsistencies
* Improved user experience with proper loading states and validation

---

## 🏁 Run Locally

```bash
git clone <repo-url>
cd smart-bookmark
npm install
npm run dev
```

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

## 👨‍💻 Author

Aditya Moorjmalani
