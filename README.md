**WatchWise: Smart Video Learning Tracker** 🚀

Hey there! This is my take on making online learning actually meaningful by tracking real video-watching progress. No more cheating by skipping ahead or rewatching the same bit just to inflate your "complete" badge. 😜

## 🧐 The Real-World Problem

Most e-learning platforms mark a lesson "complete" as soon as you hit the end of the video. But does that mean you actually watched everything? Nope! Users can skip around or rewatch the same parts, and the system still thinks they covered all the content. My solution:

* **Track unique seconds**: Only count time you haven’t seen before.
* **Prevent skipping hype**: If you jump to the end, you don’t get credit for the skipped bits.
* **Save & Resume**: Come back later, and the player picks up where you left off – with progress showing only real new content.

*(Based on the design doc: track real progress, merge intervals, handle edge cases, save state, resume seamlessly)* citeturn0file0

---

## 🔧 Tech Stack & Tools

* **Frontend**: React + TypeScript, React Router, TailwindCSS + shadcn/ui, react-hook-form + Zod, Sonner toasts.
* **Backend**: Node.js + Express, MongoDB + Mongoose, Passport (Local, Google, GitHub), JWT auth, Celebrate for request validation, Winston logger.
* **Video Hosting**: Cloudinary (video uploads & thumbnails).
* **Infrastructure**: `dotenv` + Envalid for env vars, Helmet, CORS, rate limiting, structure following industry best practices.

---

## ⚙️ How It Works

### 1. Playing & Watching

* User picks a video from the list (fetched from Cloudinary).
* The video element fires `timeupdate` events (throttled to every 500ms).
* Every new second is checked against a Set of already-seen seconds.

### 2. Tracking Intervals

* If it’s a brand-new second, we start/extend a current interval `{ start, end }`.
* When there’s a gap (re-jump or pause), we push the old interval into `newIntervals` and start fresh.

### 3. Merging & Calculating

* On the backend, we merge all overlapping/adjacent intervals and compute total unique watched seconds.
* Progress% = `(uniqueSeconds / videoDuration) * 100`, rounded to 2 decimals.

### 4. Saving & Resuming

* On `pause`, `ended`, or before unload, the frontend POSTs:

  ```json
  { videoId, watchedIntervals, lastPosition, videoDuration }
  ```
* Backend upserts the user’s progress in MongoDB, keyed by `{ userId, videoId }`.
* When the user returns, we load saved intervals, repopulate the Set, merge them, set the video’s `currentTime`, and display the true % watched.

*(This meets the "track real progress" and "resume correctly" goals.)* citeturn0file0

---

## 🚀 Getting Started

1. **Clone it**

   ```bash
   git clone https://github.com/yourusername/video-progress-tracker.git
   ```
2. **Backend**

   ```bash
   cd backend
   cp .env.example .env
   # Fill in MONGO_URI, JWT_SECRET, GOOGLE/GITHUB keys, FRONTEND_URL, CLOUDINARY creds...
   npm install
   npm run dev
   ```
3. **Frontend**

   ```bash
   cd frontend
   cp .env.example .env
   # VITE_BACKEND_URL=http://localhost:4000
   npm install
   npm run dev
   ```
4. Visit `http://localhost:3000`, sign up/login, pick a video, and watch real progress happen!

---

## 🤓 Why This Rocks

* **Modular & Typed**: TypeScript + Zod + Celebrate keep things predictable.
* **Social Login**: Google & GitHub OAuth alongside email/password.
* **Security**: Helmet, CORS, rate-limiter, JWT, bcrypt hashing.
* **Scalable**: Mongoose schemas with indexes, cloud-based video storage.
* **UX Smoothness**: Throttled events, toasts, loading states, responsive design.

---

## 🛠️ Challenges & Solutions

* **Merging Overlaps**: Handling adjacent/overlapping intervals was tricky. I wrote a merge loop that groups and coalesces them before saving.
* **Fast Forwards**: Jumping ahead shouldn’t inflate progress—my logic checks only newly seen seconds.
* **Resilience**: Network hiccups? Global axios interceptors log out on 401/403, display friendly errors, and retry pipelines.

---

## 🔮 What’s Next

* Cool analytics dashboard: show which parts of lectures get skipped most.
* WebSockets for real-time multi-user sessions.
* Mobile app version with React Native.

---
