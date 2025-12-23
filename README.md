# Quiz-Ai

Quiz-Ai is a lightweight web app that uses the Gemini (Generative AI) API to generate interactive quizzes from text or prompts for quick practice and study.

Key uses
- Generate quizzes from text or prompts
- Take quizzes with instant scoring and feedback
- Review correct answers and explanations

Features
- AI-generated multiple-choice and short-answer questions
- Adjustable difficulty and question count
- Responsive UI for desktop and mobile
- Local development with Node.js

Prerequisites
- Node.js (v16+ recommended)
- A Gemini API key (see "Getting a Gemini API key")

Installation — step by step
1. Clone the repository:
   ```bash
   git clone https://github.com/Emdad05/Quiz-Ai.git
   cd Quiz-Ai
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Provide an API key (choose one of the two methods below — .env or in-browser):
   - .env (recommended for local/server-side testing)
     1. Create a file named `.env.local` in the project root.
     2. Add your key(s). Preferred variable: `API_KEY`.
        - Single key:
          ```bash
          API_KEY=your_gemini_api_key_here
          ```
        - Multiple keys (comma-separated, single line):
          ```bash
          API_KEY=gemini_api1,gemini_api2,gemini_api3,...
          ```
     3. Ensure `.env.local` is ignored by git (add to `.gitignore`) and never commit secrets.
   - In-browser (convenient for quick local testing)
     1. Run the app and open it in your browser.
     2. Use the app's "Add API Key" or settings UI to paste one or more keys.
     3. Keys saved via the UI are stored locally in the browser (typically localStorage) and are available only on that browser/profile.
     4. Do NOT use in-browser storage for production or on shared/public machines.

4. Run locally:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 (or the port your framework uses).

Getting a Gemini API key (quick guide)
1. Sign in to the Google Cloud Console and create/select a project.
2. Enable the Generative AI / Vertex AI API for that project.
3. Go to APIs & Services → Credentials → Create credentials → API key.
4. Restrict the key (recommended): limit by HTTP referrer, IP addresses, or specific APIs.
5. For production, prefer service accounts with scoped permissions and server-side authentication (rather than embedding API keys in client code).

API key notes & best practices
- Never commit API keys to source control. Treat keys as secrets.
- For production, keep keys server-side and use service accounts or OAuth where appropriate.
- Multiple comma-separated keys are supported to distribute requests across keys; implement per-key error handling and backoff.
- Do not use multiple keys to intentionally bypass rate limits — this may violate your provider's terms. Prefer increasing quotas or contacting the provider.

Usage (brief)
1. Add an API key (via `.env.local` or in-browser).
2. Enter/paste the source text or prompt for quiz generation.
3. Choose question count and difficulty (if available) and generate the quiz.
4. Take the quiz, submit answers, and review score and explanations.

Build & deploy
- Build for production (framework dependent):
  ```bash
  npm run build
  npm run start
  ```

Security & monitoring
- Monitor API usage and set billing/quotas to avoid unexpected charges.
- Rotate and restrict keys periodically.
- Use server-side rate limiting and retries to handle transient errors.

Contributing
Contributions welcome — open issues for bugs or feature requests and submit pull requests for fixes or enhancements.

License
(If applicable) Add a LICENSE file to the repository.
