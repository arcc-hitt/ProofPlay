<div align="center">
  <br />
    <img src="https://github.com/user-attachments/assets/a1d389cd-63a6-4ba3-a594-8994e5227b41" alt="Project Banner">
  <br />

  <h3 align="center">ProofPlay</h3>
  <h6 align="center">Play. Watch. Prove you learned — No reel progress, only real!</h6>
   <div align="center">
     <a href="https://proofplay.vercel.app/" target="_blank">View Live Demo</a>
   </div>
</div>
<br />

Hey there! This is my take on making online learning actually meaningful by tracking real video-watching progress. No more cheating by skipping ahead or rewatching the same bit just to inflate your "complete" badge. 😜

## 🧐 The Real-World Problem

Most e-learning platforms mark a lesson "complete" as soon as you hit the end of the video. But does that mean you actually watched everything? Nope! Users can skip around or rewatch the same parts, and the system still thinks they covered all the content. My solution:

* **Track unique seconds**: Only count time you haven’t seen before.
* **Prevent skipping hype**: If you jump to the end, you don’t get credit for the skipped bits.
* **Save & Resume**: Come back later, and the player picks up where you left off – with progress showing only real new content.


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


---

## 🚀 Getting Started

1. **Clone it**

   ```bash
   git clone https://github.com/arcc-hitt/ProofPlay.git
   cd ProofPlay
   ```
2. **Backend**
	```bash
 	cd server
 	```
  
	* Create a new file named `.env` in the `server` folder.
	* Open `.env.example`, copy all its contents, and paste them into the newly created `.env` file.
	* Fill in the required environment variables in `server/.env`:

      ```
      MONGO_URI=your_mongo_connection_string
      PORT=5000
      JWT_SECRET=your_jwt_secret
      GOOGLE_CLIENT_ID=your_google_client_id
      GOOGLE_CLIENT_SECRET=your_google_client_secret
      GITHUB_CLIENT_ID=your_github_client_id
      GITHUB_CLIENT_SECRET=your_github_client_secret
      BACKEND_URL=http://localhost:5000
      FRONTEND_URL=http://localhost:5173
      CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
      CLOUDINARY_API_KEY=your_cloudinary_api_key
      CLOUDINARY_API_SECRET=your_cloudinary_api_secret
      ```
  
	* Install dependencies and start the backend server:
  
	  ```bash
	  npm install
	  npm run dev
	  ```
  
  > The backend will run on [http://localhost:5000](http://localhost:5000) by default.

  

3. **Frontend**

	```bash
 	cd client
	```

	* Create a new file named `.env` in the `client` folder.
    * Open `client/.env.example`, copy all its contents, and paste them into the newly created `client/.env` file.
    * Fill in the required environment variable:

      ```
      VITE_BACKEND_URL=http://localhost:5000
      VITE_FRONTEND_URL=http://localhost:5173
      VITE_GOOGLE_AUTH_URL=http://localhost:5000/auth/google
      VITE_GITHUB_AUTH_URL=http://localhost:5000/auth/github
      ```

	* Install dependencies and start the frontend server:
    
	  ```bash
	  npm install
	  npm run dev
	  ```
    
  > The frontend will run on [http://localhost:5173](http://localhost:5173) by default.



4. Visit `http://localhost:5173`, sign up/login, pick a video, and watch real progress happen!

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
