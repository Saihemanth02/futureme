# FutureMe - Meet Your Future Self

FutureMe is a premium, AI-powered personal reflection web application. Users enter details about their current life, goals, struggles, and future ambitions. The app then leverages the Google Gemini API to generate a powerful, emotionally intelligent response from their future self who already succeeded. After generation, users can engage in a real-time, context-aware chat conversation with this future self.

Developed under **Nitish's Founder Labs**.

---

## Features

1. **AI Reflection Generator**: Formulates messages, identities, habits, warning signals, and mantras tailored to the user's selected tone.
2. **Contextual Chat**: Speak directly with your future self. Conversational history and details are preserved so your future self remembers who they are talking to.
3. **Four Tone Models**:
   - **Motivational**: Inspiring and supportive.
   - **Brutally Honest**: Direct and accountability-focused.
   - **Calm Mentor**: Wise, peaceful, and grounded.
   - **CEO Mode**: Strategic and execution-focused.
4. **Premium Apple-style UI**: Glassmorphic cards, glowing animated borders, blur-filter background orbs, smooth transitions, and user friendly toast alerts.
5. **Interactive Lock Overlay**: Explains how the chat opens and blocks input before generation.
6. **Result Sharing**: Clipboard copy utility formatted for quick messaging.

---

## Directory Structure

```
futureme/
  frontend/
    index.html     # HTML Layout
    style.css      # CSS styling & animations
    script.js      # Form submissions & interactive chat handlers
  backend/
    server.js      # Express server & Gemini API integration routes
    package.json   # Server configurations & dependencies
    .env.example   # Configuration guidelines
    .env           # Secret key storage (CORS / Port config)
  README.md        # Setup & usage instructions
```

---

## Quick Start Setup

### 1. Configure the Gemini API Key

You will need a Gemini API key to run this project. Get a free key at [Google AI Studio](https://aistudio.google.com/).

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Open the `.env` file (which is already created for you in this workspace) and replace the placeholder value with your actual API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=5000
   ```

### 2. Install Dependencies

In the backend directory, run:
```bash
npm install
```

### 3. Run the Server

To launch the server in developer mode (using `nodemon` for automatic reloading on changes):
```bash
npm run dev
```

The console will output:
`FutureMe server is running at http://localhost:5000`

### 4. Open the Web Application

Open your browser and navigate to:
[http://localhost:5000](http://localhost:5000)

*Note: The Node.js server automatically serves the frontend statically, so you only need to run the backend server!*

---

## API Routes Documentation

### 1. `POST /api/generate-futureme`

Sends reflection details to compile the initial FutureMe profile card.

- **Request Body**:
  ```json
  {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  }
  ```

- **Response Body**:
  ```json
  {
    "success": true,
    "data": {
      "message": "A powerful 120-180 word message from the future self.",
      "futureIdentity": "A concise description of who the user is becoming.",
      "nextMoves": ["Action 1", "Action 2", "Action 3"],
      "habit": "One small daily habit they should start today.",
      "warning": "One mistake their future self warns them about.",
      "mantra": "A short memorable line they can repeat daily."
    }
  }
  ```

### 2. `POST /api/chat-futureme`

Handles interactive chat messages from the user to their future self.

- **Request Body**:
  ```json
  {
    "userProfile": {
      "name": "Nitish",
      "age": "23",
      "goal": "Build a successful AI startup",
      "struggle": "Lack of consistency",
      "oneYearVision": "Running a profitable AI company",
      "tone": "Brutally Honest"
    },
    "chatHistory": [
      {
        "role": "user",
        "message": "Will I actually make it?"
      },
      {
        "role": "futureme",
        "message": "Only if your daily actions stop negotiating with your dreams."
      }
    ],
    "question": "What should I focus on this week?"
  }
  ```

- **Response Body**:
  ```json
  {
    "success": true,
    "reply": "FutureMe reply content..."
  }
  ```
