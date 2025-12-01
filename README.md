# AI Data Assistant

An interactive web application that allows users to chat with an AI assistant about their datasets and fitted model results. Built with **React**, **Vite**, **Express (Serverless)**, and deployed on **Vercel**.

---

## 🚀 Features

* **Interactive AI Chat**: Ask questions about your dataset and get real-time responses.
* **Model Fitting Analysis**: Provides insights based on fitted model results (RMSE, MAE, R², parameters).
* **Session Management**: Keeps multi-turn conversation per session.
* **Dynamic Suggestions**: Suggests relevant questions automatically based on dataset and model fitting.
* **Serverless Backend**: Express API deployed as serverless functions on Vercel.
* **CORS Enabled**: Safe cross-origin requests from frontend.

---

## 🛠️ Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/bingli601/microbial-survival-modeling.git
cd microbial-survival-modeling
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root or configure on Vercel:

```env
GEMINI_API_KEY=<YOUR_GOOGLE_GEMINI_API_KEY>
GEMINI_MODEL=gemini-pro
```

### 4. Local Development

Start both frontend and serverless backend:

```bash
npx vercel dev
```

* Frontend available at `http://localhost:3000`
* API available at `http://localhost:3000/api/messages`

### 5. Production Deployment

Deploy to Vercel:

```bash
npx vercel --prod
```

---

## 📂 Project Structure

```
project/
├─ api/                  # Vercel serverless API entry
│  └─ server.js
├─ server/               # Express server code
│  └─ serverless.js
├─ src/                  # React frontend components
│  └─ components/AIChat.tsx
├─ vercel.json           # Vercel configuration
├─ package.json
├─ .env                  # Environment variables
```

---

## 🌐 Live Demo

[Live Demo on Vercel](https://microbial-survival-modeling-vbhs-fb5ixb355.vercel.app/)

---

## ⚡ Usage

1. Enter your dataset or fitted model results.
2. Ask questions in the input box.
3. Click **Send** or press **Enter**.
4. AI responses appear in real-time with conversation history.

---

## 📌 Notes

* Ensure `GEMINI_API_KEY` is set properly, otherwise AI responses will fail.
* For local testing, `npx vercel dev` simulates the serverless environment.
* Production deployment requires setting environment variables in Vercel dashboard.

---
