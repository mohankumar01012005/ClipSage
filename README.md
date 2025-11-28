# 🚀 ClipSage – AI-Powered Smart Video Summaries  
### *Turn long videos into short, meaningful, actionable insights instantly.*

---

## ⚡ About ClipSage
ClipSage is an AI-powered video summarization tool that converts long YouTube videos, lectures, podcasts, and tutorials into **clean, structured summaries** — in seconds.

---

## ✨ Features
- 🔹 **AI-generated summaries (Google Gemini / GenAI)**
- 🔹 **YouTube URL → Instant Summary**
- 🔹 **Multiple summary formats (bullet points, paragraphs, takeaways)**
- 🔹 **JWT Authentication**
- 🔹 **Secure password hashing (bcrypt)**
- 🔹 **React + Vite + Tailwind frontend**
- 🔹 **Fully responsive modern UI**
- 🔹 **MongoDB Atlas backend**

---

## 🛠️ Tech Stack

### **Frontend**
- React (Vite)
- TailwindCSS
- Axios

### **Backend**
- Node.js  
- Express.js  
- MongoDB Atlas  
- JWT  
- Bcrypt  
- Google Generative AI (Gemini API)

---

## 🔐 Authentication
ClipSage uses **JWT-based authentication**:

- Register → hashed password  
- Login → returns JWT  
- Frontend stores JWT  
- Protected routes require:

## 🧩 Backend Setup
Install dependencies:
npm install

Create .env file:
MONGO_URI="mongodb+srv://<yourUser>:<yourPass>@cluster.mongodb.net/clipsage"
JWT_SECRET=your_super_secret_here
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
GENAI_API_KEY="your_gemini_key_here"

Start backend:
npm run dev


Backend runs on:

http://localhost:5005

🎨 Frontend Setup
Install:
npm install

Run:
npm run dev


Frontend runs on:

http://localhost:5173

🔗 API Endpoints
Auth Routes
Method	Endpoint	Description
POST	/api/auth/register	Register a new user
POST	/api/auth/login	Login user & get JWT
🧠 Summary Endpoint
Method	Endpoint	Description
POST	/api/summarize	Accepts YouTube URL → returns AI summary
📌 Example Requests
Register
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@gmail.com",
  "password": "123456"
}

Login
POST /api/auth/login
{
  "email": "test@gmail.com",
  "password": "123456"
}

Generate Summary
POST /api/summarize
Headers:
  Authorization: Bearer <token>

{
  "youtubeURL": "https://www.youtube.com/watch?v=abc123"
}

🔮 Future Enhancements

PDF export

Multi-language summaries

Browser extension

Audio summarization

Premium credit system

Summary history/dashboard

## 🏆 Why ClipSage Stands Out

Real-world useful

Clean UI + fast UX

Strong GenAI integration

Fully secure architecture

Highly demo-friendly for hackathons

## 👥 Team Elite

Vamshi Krishna

Vishnu Preetham

Mohan Kumar

## ⭐ Support

If you appreciate this project, give it a ⭐ on GitHub!
