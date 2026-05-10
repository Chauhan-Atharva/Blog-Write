# MegaBlog — Custom Backend (Node.js + Express + MongoDB + Cloudinary)

## Folder Structure

```
blog-backend/
├── src/
│   ├── config/
│   │   ├── db.js               # MongoDB connection with retry logic
│   │   └── cloudinary.js       # Cloudinary SDK config
│   ├── controllers/
│   │   ├── auth.controller.js  # register, login, logout, refresh, getMe
│   │   ├── post.controller.js  # CRUD for posts + Cloudinary upload
│   │   └── upload.controller.js# Standalone image upload/delete
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT verify + role-based guard
│   │   ├── error.middleware.js # Global error handler
│   │   └── upload.middleware.js# Multer (memory storage → Cloudinary)
│   ├── models/
│   │   ├── User.js             # bcrypt password, JWT methods, role
│   │   └── Post.js             # title, slug, content, featuredImage, status
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── post.routes.js
│   │   └── upload.routes.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   └── cookieOptions.js
│   ├── app.js                  # Express app, CORS, helmet, rate-limit
│   └── index.js                # Entry point, graceful shutdown
├── frontend-replacements/      # Drop-in frontend files (copy to your React project)
│   ├── frontend.env.example
│   └── src/
│       ├── api/
│       │   ├── auth.js         # Replaces appwrite/auth.js
│       │   └── config.js       # Replaces appwrite/config.js
│       ├── conf/
│       │   └── conf.js         # Replaces conf/conf.js
│       ├── components/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── PostCard.jsx
│       │   ├── Header/
│       │   │   └── LogoutButton.jsx
│       │   └── Post-form/
│       │       └── PostForm.jsx
│       └── pages/
│           ├── Home.jsx
│           ├── Post.jsx
│           ├── AllPosts.jsx
│           └── EditPost.jsx
├── .env.example
├── .gitignore
└── package.json
```

---

## API Endpoints

### Auth  `/api/v1/auth`
| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | /register         | ❌   | Register new user        |
| POST   | /login            | ❌   | Login, returns JWT + cookie |
| POST   | /logout           | ✅   | Clears refresh token     |
| POST   | /refresh-token    | ❌   | Issues new access token  |
| GET    | /me               | ✅   | Get current user         |

### Posts  `/api/v1/posts`
| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| GET    | /                 | ❌   | List all active posts    |
| GET    | /:slug            | ❌   | Get single post          |
| POST   | /                 | ✅   | Create post + image      |
| PUT    | /:slug            | ✅   | Update post + image      |
| DELETE | /:slug            | ✅   | Delete post + image      |

### Upload  `/api/v1/upload`
| Method | Endpoint          | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | /image            | ✅   | Upload image → Cloudinary|
| DELETE | /image            | ✅   | Delete image by publicId |

---

## Setup

### 1. Install Backend
```bash
cd blog-backend
npm install
cp .env.example .env
# Fill in all values in .env
npm run dev
```

### 2. Setup Frontend
```bash
# Copy replacement files over your existing ones:
cp -r frontend-replacements/src/api  your-react-project/src/
cp frontend-replacements/src/conf/conf.js  your-react-project/src/conf/conf.js

# Replace these component files:
cp frontend-replacements/src/components/Login.jsx      your-react-project/src/components/
cp frontend-replacements/src/components/Signup.jsx     your-react-project/src/components/
cp frontend-replacements/src/components/PostCard.jsx   your-react-project/src/components/
cp frontend-replacements/src/components/Header/LogoutButton.jsx  your-react-project/src/components/Header/
cp frontend-replacements/src/components/Post-form/PostForm.jsx   your-react-project/src/components/Post-form/
cp frontend-replacements/src/pages/Home.jsx            your-react-project/src/pages/
cp frontend-replacements/src/pages/Post.jsx            your-react-project/src/pages/
cp frontend-replacements/src/pages/AllPosts.jsx        your-react-project/src/pages/
cp frontend-replacements/src/pages/EditPost.jsx        your-react-project/src/pages/
cp frontend-replacements/src/App.jsx                   your-react-project/src/App.jsx

# Add to your frontend .env:
echo "VITE_API_BASE_URL=http://localhost:5000/api/v1" >> your-react-project/.env
```

### 3. Remove Appwrite
```bash
cd your-react-project
npm uninstall appwrite
rm -rf src/appwrite/
```

---

## Token Architecture

```
LOGIN
 └─ Backend sets httpOnly cookie: refreshToken (7d)
 └─ Returns: accessToken (15min) in JSON body
 └─ Frontend stores accessToken IN MEMORY only (never localStorage)

EVERY API CALL
 └─ Frontend sends: Authorization: Bearer <accessToken>
 └─ If 401 → auto-call /refresh-token → get new accessToken → retry

LOGOUT
 └─ Backend clears refreshToken from DB + cookie
```

---

## Cloudinary Image Flow

```
User picks file → PostForm
 └─ apiService.uploadFile(file)
     └─ POST /api/v1/upload/image  (multipart/form-data)
         └─ Multer reads into memory buffer
             └─ Cloudinary upload_stream
                 └─ Returns { url, publicId }
                     └─ Stored in Post.featuredImage: { url, publicId }

Display:
 └─ <img src={post.featuredImage.url} />  ← direct Cloudinary CDN URL

Delete:
 └─ apiService.deleteFile(post.featuredImage.publicId)
     └─ DELETE /api/v1/upload/image { publicId }
         └─ cloudinary.uploader.destroy(publicId)
```

---

## Production Deployment Notes

### Backend (Render / Railway / EC2)
1. Set `NODE_ENV=production` in environment variables
2. All secrets via environment variables — NEVER commit `.env`
3. MongoDB Atlas: whitelist server IP or use `0.0.0.0/0` temporarily
4. Use a reverse proxy (Nginx) or platform HTTPS — required for `secure` cookies
5. `sameSite: "none"` + `secure: true` is set automatically in production mode

### Frontend (Vercel / Netlify)
1. Set `VITE_API_BASE_URL=https://your-backend.com/api/v1`
2. Backend CORS must include your Vercel/Netlify domain in `FRONTEND_URL`

### Security Checklist
- [x] Passwords hashed with bcrypt (cost factor 12)
- [x] Access token in memory only (not localStorage)
- [x] Refresh token in httpOnly cookie (XSS-safe)
- [x] Rate limiting on all routes (stricter on auth)
- [x] Helmet security headers
- [x] CORS locked to your frontend URL
- [x] Input validation via Mongoose schema
- [x] Duplicate key / validation errors handled gracefully
- [x] Cloudinary images deleted on post delete/update
- [x] Role-based access (user / admin)
- [x] Graceful shutdown on SIGTERM/SIGINT

---

## Frontend Changes Summary

| Old (Appwrite)                       | New (Custom API)                     |
|--------------------------------------|--------------------------------------|
| `src/appwrite/auth.js`               | `src/api/auth.js`                    |
| `src/appwrite/config.js`             | `src/api/config.js`                  |
| `src/conf/conf.js` (Appwrite vars)   | `src/conf/conf.js` (VITE_API_BASE_URL) |
| `user.$id`                           | `user._id`                           |
| `post.$id`                           | `post._id`                           |
| `post.userId`                        | `post.author._id`                    |
| `appwriteService.getFilePreview(id)` | `apiService.getFilePreview(url)` (direct URL) |
| `featuredImage` = Appwrite file ID   | `featuredImage` = `{ url, publicId }`|
| Navigate with `post.$id`             | Navigate with `post.slug`            |
