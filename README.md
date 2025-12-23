# Quiz-Ai

Quiz-Ai is a lightweight web application that uses the Gemini (Generative AI) API to generate interactive quizzes from text or prompts. It helps create practice tests, learning checks, and quick study quizzes.

Key uses:
- Generate quizzes from text or prompts
- Take quizzes and get instant scoring and feedback
- Review correct answers and explanations

Features:
- AI-generated multiple-choice and short-answer questions
- Adjustable difficulty and question count
- Responsive UI for desktop and mobile
- Local development with Node.js

Prerequisites:
- Node.js (v16+ recommended)
- A Gemini API key

Quick setup:
1. Clone the repository and install dependencies (`git clone ...` then `npm install`).
2. Provide your API key in a local environment file. Correct .env format for multiple keys: `API_KEY=gemini_api1,gemini_api2,gemini_api3,...`. The app prefers `GEMINI_API_KEY` and falls back to `API_KEY`.
3. Run locally with `npm run dev` and open the app (typically at http://localhost:3000).

Notes on API keys:
- Do not commit keys to source control. Keep keys server-side for production.
- You can provide multiple comma-separated keys; the app will pick one per request.
- Rotating or using multiple keys to circumvent rate limits may violate your provider's terms; prefer upgrading quotas or contacting the provider.

Getting a Gemini API key:
- See the Google Generative AI docs: https://developers.generativeai.google/ and Google Cloud API key docs: https://cloud.google.com/docs

Usage summary:
- Add API key (env or in-browser for local testing), provide input text or prompt, choose question count/difficulty, generate the quiz, take it, and review results.

Build & deploy:
- Build for production (`npm run build`) and run (`npm run start`) according to the framework used.

Contributing:
Contributions are welcome — open issues for bugs or features and submit pull requests for fixes or enhancements.
