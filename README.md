# Quiz-Ai

Quiz-Ai is a lightweight web application that uses the Gemini API to generate interactive quizzes from text or prompts. It is designed for quickly creating practice tests, learning checks, and study materials using AI-generated questions and answers.

Key uses:
- Create quizzes from text or prompts
- Take quizzes and get instant scoring and feedback
- Review correct answers and explanations

Features
- AI-generated multiple-choice and short-answer questions (powered by Gemini API)
- Adjustable difficulty and question count
- Clean, responsive UI for desktop and mobile
- Score and review screen with correct answers and explanations
- Local development setup with Node.js

Prerequisites
- Node.js (v16+ recommended)
- A Gemini API key (set as GEMINI_API_KEY)

Installation
1. Clone the repository:

```bash
git clone https://github.com/Emdad05/Quiz-Ai.git
cd Quiz-Ai
```

2. Install dependencies:

```bash
npm install
```

3. Create a local environment file and set your Gemini API key:

```bash
# create .env.local in the project root and add:
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run the app locally:

```bash
npm run dev
```

The app will typically be available at http://localhost:3000 (or the port your framework uses).

Environment variables
- GEMINI_API_KEY: Your Gemini API key used to request the AI model. Keep this secret and do not commit it to source control.

How to use
1. Open the app in your browser.
2. Generate a quiz:
   - Enter or paste the text or prompt you want the quiz generated from.
   - Choose the number of questions and difficulty level (if available).
   - Click the button to generate the quiz. The app will call the Gemini API and produce questions and answer options.
3. Take the quiz:
   - Select answers for each question.
   - Submit the quiz when finished.
4. Review results:
   - See your score and which answers were correct/incorrect.
   - View explanations provided by the AI (if available).

Notes and troubleshooting
- If quiz generation fails or returns unexpected output, check that your GEMINI_API_KEY is valid and that you have network access.
- Keep an eye on usage limits for the Gemini API to avoid unexpected charges.

Build & deploy
- To build for production (depending on the framework used):

```bash
npm run build
npm run start
```

Contributing
Contributions are welcome. Please open issues for bugs or feature requests, and submit pull requests for fixes or enhancements.

License
Specify your project license here (for example, MIT). If you don’t want to set one yet, add a TODO and update later.

---

This README has been updated to include an installation guide, an overview of the application, features, and basic usage instructions. If you want me to add screenshots, a demo link, or more detailed examples of prompts and expected AI responses, tell me what you'd like and I will update the file.
